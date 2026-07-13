import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '../utils/id';
import {
  AppSettings,
  LanguageCode,
  PendingChange,
  ServerStatus,
  SortDirection,
  SortMode,
  SyncStatus,
  Task,
  TaskHistoryItem,
  TaskPayload,
  TaskStatus,
} from '../types/task';
import { getDefaultLanguage, getStatusTranslationKey, translate } from '../utils/translations';
import { DEFAULT_USER, getUserById } from '../features/users/users';

type AppState = {
  hasHydrated: boolean;
  tasks: Task[];
  history: TaskHistoryItem[];
  pendingChanges: PendingChange[];
  isOnline: boolean;
  isSyncing: boolean;
  serverStatus: ServerStatus;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
  sortMode: SortMode;
  sortDirection: SortDirection;
  settings: AppSettings;
  setHasHydrated: (value: boolean) => void;
  setOnlineStatus: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
  setServerStatus: (status: ServerStatus, error?: string | null) => void;
  setLastSyncedAt: (value: string) => void;
  setSortMode: (value: SortMode) => void;
  toggleSortDirection: () => void;
  setThemeMode: (value: AppSettings['themeMode']) => void;
  setLanguage: (value: LanguageCode) => void;
  setCurrentUser: (userId: string) => void;
  setNotificationDemoMode: (value: boolean) => void;
  createTask: (payload: TaskPayload) => Task;
  editTask: (taskId: string, payload: TaskPayload) => Task | undefined;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Task | undefined;
  deleteTask: (taskId: string) => void;
  setTaskNotification: (taskId: string, notificationId?: string | null) => void;
  addHistoryItem: (item: Omit<TaskHistoryItem, 'id' | 'timestamp'> & Partial<Pick<TaskHistoryItem, 'timestamp'>>) => void;
  markTaskSyncStatus: (taskId: string, syncStatus: SyncStatus) => void;
  setTaskRemoteId: (taskId: string, remoteId: string) => void;
  updatePendingChangeAttempt: (taskId: string, params: { attemptedAt: string; error?: string | null }) => void;
  removePendingChange: (taskId: string) => void;
  mergeRemoteTasks: (tasks: Task[]) => void;
  reconcileSyncStatuses: () => void;
};

const queuePendingChange = (pendingChanges: PendingChange[], nextChange: PendingChange) => {
  const withoutTask = pendingChanges.filter((item) => item.taskId !== nextChange.taskId);
  return [...withoutTask, nextChange].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );
};

const reconcileTasksWithPendingChanges = (tasks: Task[], pendingChanges: PendingChange[]) => {
  const pendingMap = new Map(pendingChanges.map((change) => [change.taskId, change]));

  return tasks.map((task) => {
    const pendingChange = pendingMap.get(task.id);
    if (!pendingChange) {
      return task.syncStatus === 'synced'
        ? task
        : {
            ...task,
            syncStatus: 'synced' as const,
          };
    }

    const nextSyncStatus: SyncStatus = pendingChange.lastAttemptError ? 'failed' : 'pending';
    return task.syncStatus === nextSyncStatus
      ? task
      : {
          ...task,
          syncStatus: nextSyncStatus,
        };
  });
};

const appendHistory = (
  history: TaskHistoryItem[],
  entries: Array<Omit<TaskHistoryItem, 'id' | 'timestamp'> & Partial<Pick<TaskHistoryItem, 'timestamp'>>>,
) => {
  const prepared = entries.map((entry) => ({
    ...entry,
    id: createId('history'),
    timestamp: entry.timestamp ?? new Date().toISOString(),
  }));

  return [...prepared.reverse(), ...history];
};

const normalizeTaskUsers = (task: Task, fallbackUserId: string): Task => ({
  ...task,
  createdBy: task.createdBy ?? getUserById(fallbackUserId),
  assignedTo: task.assignedTo ?? getUserById(fallbackUserId),
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      tasks: [],
      history: [],
      pendingChanges: [],
      isOnline: false,
      isSyncing: false,
      serverStatus: 'unknown',
      lastSyncError: null,
      lastSyncedAt: null,
      sortMode: 'createdAt',
      sortDirection: 'desc',
      settings: {
        themeMode: 'light',
        notificationDemoMode: true,
        language: getDefaultLanguage(),
        currentUserId: DEFAULT_USER.id,
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOnlineStatus: (value) => set({ isOnline: value }),
      setSyncing: (value) => set({ isSyncing: value }),
      setServerStatus: (serverStatus, error = null) => set({ serverStatus, lastSyncError: error }),
      setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
      setSortMode: (value) =>
        set({
          sortMode: value,
          sortDirection: value === 'createdAt' ? 'desc' : 'asc',
        }),
      toggleSortDirection: () =>
        set((state) => ({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' })),
      setThemeMode: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            themeMode: value,
          },
        })),
      setLanguage: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            language: value,
          },
        })),
      setCurrentUser: (currentUserId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            currentUserId: getUserById(currentUserId).id,
          },
        })),
      setNotificationDemoMode: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notificationDemoMode: value,
          },
        })),
      createTask: (payload) => {
        const language = get().settings.language;
        const currentUser = getUserById(get().settings.currentUserId);
        const now = new Date().toISOString();
        const task: Task = {
          id: createId('task'),
          ...payload,
          createdBy: currentUser,
          assignedTo: payload.assignedTo ?? currentUser,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
          notificationId: null,
        };

        set((state) => ({
          tasks: reconcileTasksWithPendingChanges([task, ...state.tasks], queuePendingChange(state.pendingChanges, {
            taskId: task.id,
            type: 'upsert',
            payload: task,
            updatedAt: task.updatedAt,
            lastAttemptError: null,
          })),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId: task.id,
            remoteId: task.remoteId,
            type: 'upsert',
            payload: task,
            updatedAt: task.updatedAt,
            lastAttemptError: null,
          }),
          history: appendHistory(state.history, [
            {
              taskId: task.id,
              taskTitle: task.title,
              actionType: 'created',
              actor: 'user',
              actorId: currentUser.id,
              actorName: currentUser.name,
              description: translate(language, 'history_task_created', { title: task.title }),
            },
            ...(task.attachments.length
              ? [
                  {
                    taskId: task.id,
                    taskTitle: task.title,
                    actionType: 'attachment_added' as const,
                    actor: 'user' as const,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    description: translate(language, 'history_attachments_added', {
                      count: task.attachments.length,
                    }),
                  },
                ]
              : []),
          ]),
        }));

        return task;
      },
      editTask: (taskId, payload) => {
        const language = get().settings.language;
        const currentUser = getUserById(get().settings.currentUserId);
        const current = get().tasks.find((item) => item.id === taskId);
        if (!current) {
          return undefined;
        }

        const nextTask: Task = {
          ...current,
          ...payload,
          assignedTo: payload.assignedTo ?? current.assignedTo,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };
        const attachmentDiff = nextTask.attachments.length - current.attachments.length;

        set((state) => ({
          tasks: reconcileTasksWithPendingChanges(
            state.tasks.map((item) => (item.id === taskId ? nextTask : item)),
            queuePendingChange(state.pendingChanges, {
              taskId,
              remoteId: nextTask.remoteId,
              type: 'upsert',
              payload: nextTask,
              updatedAt: nextTask.updatedAt,
              lastAttemptError: null,
            }),
          ),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            remoteId: nextTask.remoteId,
            type: 'upsert',
            payload: nextTask,
            updatedAt: nextTask.updatedAt,
            lastAttemptError: null,
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              taskTitle: nextTask.title,
              actionType: 'updated',
              actor: 'user',
              actorId: currentUser.id,
              actorName: currentUser.name,
              description: translate(language, 'history_task_updated', { title: nextTask.title }),
            },
            ...(current.status !== nextTask.status
              ? [
                  {
                    taskId,
                    taskTitle: nextTask.title,
                    actionType: 'status_changed' as const,
                    actor: 'user' as const,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    description: translate(language, 'history_status_to', {
                      status: translate(language, getStatusTranslationKey(nextTask.status)),
                    }),
                  },
                ]
              : []),
            ...(current.assignedTo.id !== nextTask.assignedTo.id
              ? [
                  {
                    taskId,
                    taskTitle: nextTask.title,
                    actionType: 'assignment_changed' as const,
                    actor: 'user' as const,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    description: translate(language, 'history_assigned_to', {
                      name: nextTask.assignedTo.name,
                    }),
                  },
                ]
              : []),
            ...(attachmentDiff > 0
              ? [
                  {
                    taskId,
                    taskTitle: nextTask.title,
                    actionType: 'attachment_added' as const,
                    actor: 'user' as const,
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    description: translate(language, 'history_attachments_added', { count: attachmentDiff }),
                  },
                ]
              : []),
          ]),
        }));

        return nextTask;
      },
      updateTaskStatus: (taskId, status) => {
        const language = get().settings.language;
        const currentUser = getUserById(get().settings.currentUserId);
        const current = get().tasks.find((item) => item.id === taskId);
        if (!current || current.status === status) {
          return current;
        }

        const nextTask: Task = {
          ...current,
          status,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };

        set((state) => ({
          tasks: reconcileTasksWithPendingChanges(
            state.tasks.map((item) => (item.id === taskId ? nextTask : item)),
            queuePendingChange(state.pendingChanges, {
              taskId,
              remoteId: nextTask.remoteId,
              type: 'upsert',
              payload: nextTask,
              updatedAt: nextTask.updatedAt,
              lastAttemptError: null,
            }),
          ),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            remoteId: nextTask.remoteId,
            type: 'upsert',
            payload: nextTask,
            updatedAt: nextTask.updatedAt,
            lastAttemptError: null,
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              taskTitle: nextTask.title,
              actionType: 'status_changed',
              actor: 'user',
              actorId: currentUser.id,
              actorName: currentUser.name,
              description: translate(language, 'history_status_to', {
                status: translate(language, getStatusTranslationKey(status)),
              }),
            },
          ]),
        }));

        return nextTask;
      },
      deleteTask: (taskId) => {
        const language = get().settings.language;
        const currentUser = getUserById(get().settings.currentUserId);
        const current = get().tasks.find((item) => item.id === taskId);
        if (!current) {
          return;
        }

        set((state) => ({
          tasks: state.tasks.filter((item) => item.id !== taskId),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            remoteId: current.remoteId,
            type: 'delete',
            updatedAt: new Date().toISOString(),
            lastAttemptError: null,
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              taskTitle: current.title,
              actionType: 'deleted',
              actor: 'user',
              actorId: currentUser.id,
              actorName: currentUser.name,
              description: translate(language, 'history_task_deleted', { title: current.title }),
            },
          ]),
        }));
      },
      setTaskNotification: (taskId, notificationId) =>
        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  notificationId: notificationId ?? null,
                }
              : item,
          ),
        })),
      addHistoryItem: (item) =>
        set((state) => ({
          history: appendHistory(state.history, [item]),
        })),
      markTaskSyncStatus: (taskId, syncStatus) =>
        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  syncStatus,
                }
              : item,
          ),
        })),
      setTaskRemoteId: (taskId, remoteId) =>
        set((state) => ({
          tasks: state.tasks.map((item) => (item.id === taskId ? { ...item, remoteId } : item)),
          pendingChanges: state.pendingChanges.map((change) =>
            change.taskId === taskId && change.payload
              ? { ...change, remoteId, payload: { ...change.payload, remoteId } }
              : change.taskId === taskId
                ? { ...change, remoteId }
                : change,
          ),
        })),
      updatePendingChangeAttempt: (taskId, params) =>
        set((state) => {
          const pendingChanges = state.pendingChanges.map((item) =>
            item.taskId === taskId
              ? {
                  ...item,
                  lastAttemptedAt: params.attemptedAt,
                  lastAttemptError: params.error ?? null,
                }
              : item,
          );

          return {
            pendingChanges,
            tasks: reconcileTasksWithPendingChanges(state.tasks, pendingChanges),
          };
        }),
      removePendingChange: (taskId) =>
        set((state) => {
          const pendingChanges = state.pendingChanges.filter((item) => item.taskId !== taskId);
          return {
            pendingChanges,
            tasks: reconcileTasksWithPendingChanges(state.tasks, pendingChanges),
          };
        }),
      mergeRemoteTasks: (remoteTasks) =>
        set((state) => {
          const normalizedRemoteTasks = remoteTasks.map((task) =>
            normalizeTaskUsers(task, state.settings.currentUserId),
          );
          const tasksById = new Map(state.tasks.map((task) => [task.id, task]));
          const taskIdsWithPendingChanges = new Set(state.pendingChanges.map((item) => item.taskId));

          for (const remoteTask of normalizedRemoteTasks) {
            if (taskIdsWithPendingChanges.has(remoteTask.id)) {
              continue;
            }

            const current = tasksById.get(remoteTask.id);
            if (!current || new Date(remoteTask.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
              tasksById.set(remoteTask.id, remoteTask);
            }
          }

          return {
            tasks: reconcileTasksWithPendingChanges(Array.from(tasksById.values()), state.pendingChanges),
          };
        }),
      reconcileSyncStatuses: () =>
        set((state) => ({
          tasks: reconcileTasksWithPendingChanges(state.tasks, state.pendingChanges),
        })),
    }),
    {
      name: 'task-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        history: state.history,
        pendingChanges: state.pendingChanges,
        sortMode: state.sortMode,
        sortDirection: state.sortDirection,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.settings = {
            themeMode: state.settings?.themeMode ?? 'light',
            notificationDemoMode: state.settings?.notificationDemoMode ?? true,
            language: state.settings?.language ?? getDefaultLanguage(),
            currentUserId: getUserById(state.settings?.currentUserId).id,
          };
          state.tasks = (state.tasks ?? []).map((task) =>
            normalizeTaskUsers(task, state.settings.currentUserId),
          );
          state.pendingChanges = (state.pendingChanges ?? []).map((change) => ({
            ...change,
            payload: change.payload
              ? normalizeTaskUsers(change.payload, state.settings.currentUserId)
              : undefined,
          }));
        }
        state?.reconcileSyncStatuses();
        state?.setHasHydrated(true);
      },
    },
  ),
);
