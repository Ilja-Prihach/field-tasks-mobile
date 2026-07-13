import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '../utils/id';
import {
  AppSettings,
  PendingChange,
  SortMode,
  SyncStatus,
  Task,
  TaskHistoryItem,
  TaskPayload,
  TaskStatus,
} from '../types/task';

type AppState = {
  hasHydrated: boolean;
  tasks: Task[];
  history: TaskHistoryItem[];
  pendingChanges: PendingChange[];
  isOnline: boolean;
  isSyncing: boolean;
  sortMode: SortMode;
  settings: AppSettings;
  setHasHydrated: (value: boolean) => void;
  setOnlineStatus: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
  setSortMode: (value: SortMode) => void;
  setThemeMode: (value: AppSettings['themeMode']) => void;
  setNotificationDemoMode: (value: boolean) => void;
  createTask: (payload: TaskPayload) => Task;
  editTask: (taskId: string, payload: TaskPayload) => Task | undefined;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Task | undefined;
  deleteTask: (taskId: string) => void;
  setTaskNotification: (taskId: string, notificationId?: string | null) => void;
  addHistoryItem: (item: Omit<TaskHistoryItem, 'id' | 'timestamp'> & Partial<Pick<TaskHistoryItem, 'timestamp'>>) => void;
  markTaskSyncStatus: (taskId: string, syncStatus: SyncStatus) => void;
  removePendingChange: (taskId: string) => void;
  mergeRemoteTasks: (tasks: Task[]) => void;
};

const queuePendingChange = (pendingChanges: PendingChange[], nextChange: PendingChange) => {
  const withoutTask = pendingChanges.filter((item) => item.taskId !== nextChange.taskId);
  return [...withoutTask, nextChange].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      tasks: [],
      history: [],
      pendingChanges: [],
      isOnline: true,
      isSyncing: false,
      sortMode: 'createdAt',
      settings: {
        themeMode: 'light',
        notificationDemoMode: true,
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOnlineStatus: (value) => set({ isOnline: value }),
      setSyncing: (value) => set({ isSyncing: value }),
      setSortMode: (value) => set({ sortMode: value }),
      setThemeMode: (value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            themeMode: value,
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
        const now = new Date().toISOString();
        const task: Task = {
          id: createId('task'),
          ...payload,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
          notificationId: null,
        };

        set((state) => ({
          tasks: [task, ...state.tasks],
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId: task.id,
            type: 'upsert',
            payload: task,
            updatedAt: task.updatedAt,
          }),
          history: appendHistory(state.history, [
            {
              taskId: task.id,
              actionType: 'created',
              description: `Task "${task.title}" was created.`,
            },
            ...(task.attachments.length
              ? [
                  {
                    taskId: task.id,
                    actionType: 'attachment_added' as const,
                    description: `${task.attachments.length} attachment(s) added.`,
                  },
                ]
              : []),
          ]),
        }));

        return task;
      },
      editTask: (taskId, payload) => {
        const current = get().tasks.find((item) => item.id === taskId);
        if (!current) {
          return undefined;
        }

        const nextTask: Task = {
          ...current,
          ...payload,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };
        const attachmentDiff = nextTask.attachments.length - current.attachments.length;

        set((state) => ({
          tasks: state.tasks.map((item) => (item.id === taskId ? nextTask : item)),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            type: 'upsert',
            payload: nextTask,
            updatedAt: nextTask.updatedAt,
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              actionType: 'updated',
              description: `Task "${nextTask.title}" was updated.`,
            },
            ...(attachmentDiff > 0
              ? [
                  {
                    taskId,
                    actionType: 'attachment_added' as const,
                    description: `${attachmentDiff} attachment(s) added.`,
                  },
                ]
              : []),
          ]),
        }));

        return nextTask;
      },
      updateTaskStatus: (taskId, status) => {
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
          tasks: state.tasks.map((item) => (item.id === taskId ? nextTask : item)),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            type: 'upsert',
            payload: nextTask,
            updatedAt: nextTask.updatedAt,
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              actionType: 'status_changed',
              description: `Status changed to "${status}".`,
            },
          ]),
        }));

        return nextTask;
      },
      deleteTask: (taskId) => {
        const current = get().tasks.find((item) => item.id === taskId);
        if (!current) {
          return;
        }

        set((state) => ({
          tasks: state.tasks.filter((item) => item.id !== taskId),
          pendingChanges: queuePendingChange(state.pendingChanges, {
            taskId,
            type: 'delete',
            updatedAt: new Date().toISOString(),
          }),
          history: appendHistory(state.history, [
            {
              taskId,
              actionType: 'deleted',
              description: `Task "${current.title}" was deleted.`,
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
      removePendingChange: (taskId) =>
        set((state) => ({
          pendingChanges: state.pendingChanges.filter((item) => item.taskId !== taskId),
        })),
      mergeRemoteTasks: (remoteTasks) =>
        set((state) => {
          const tasksById = new Map(state.tasks.map((task) => [task.id, task]));
          const taskIdsWithPendingChanges = new Set(state.pendingChanges.map((item) => item.taskId));

          for (const remoteTask of remoteTasks) {
            if (taskIdsWithPendingChanges.has(remoteTask.id)) {
              continue;
            }

            const current = tasksById.get(remoteTask.id);
            if (!current || new Date(remoteTask.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
              tasksById.set(remoteTask.id, remoteTask);
            }
          }

          return {
            tasks: Array.from(tasksById.values()),
          };
        }),
    }),
    {
      name: 'task-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        history: state.history,
        pendingChanges: state.pendingChanges,
        sortMode: state.sortMode,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
