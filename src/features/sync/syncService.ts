import { ApiError, RemoteTask, tasksApi, toLocalTask } from '../../api/tasksApi';
import { useAppStore } from '../../storage/useAppStore';
import { PendingChange } from '../../types/task';
import { translate } from '../../utils/translations';

let syncRunInFlight: Promise<SyncSummary> | null = null;

export type SyncSummary = {
  attempted: number;
  synced: number;
  failed: number;
  skipped: number;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : translate(useAppStore.getState().settings.language, 'unexpected_sync_error');

const addSyncHistoryEntry = (
  change: PendingChange,
  actionType: 'sync_started' | 'synced' | 'sync_failed',
  description: string,
) => {
  const latestMatchingEntry = useAppStore
    .getState()
    .history.find((item) => item.taskId === change.taskId && item.actionType === actionType);

  // One unchanged queue operation gets at most one event of each sync type.
  if (
    latestMatchingEntry?.description === description &&
    new Date(latestMatchingEntry.timestamp).getTime() >= new Date(change.updatedAt).getTime()
  ) {
    return;
  }

  useAppStore.getState().addHistoryItem({
    taskId: change.taskId,
    taskTitle: change.payload?.title,
    actionType,
    actor: 'system',
    description,
  });
};

const findRemoteId = (change: PendingChange, remoteTasks: RemoteTask[]) => {
  if (change.remoteId ?? change.payload?.remoteId) {
    return change.remoteId ?? change.payload?.remoteId;
  }

  const byClientId = remoteTasks.find((task) => task.clientId === change.taskId);
  if (byClientId) {
    return byClientId.id;
  }

  // Recover records created by the older sync implementation, before clientId was sent.
  const legacyMatch = remoteTasks.find(
    (task) =>
      !task.clientId &&
      task.createdAt === change.payload?.createdAt &&
      task.title === change.payload?.title,
  );
  return legacyMatch?.id;
};

const syncUpsert = async (change: PendingChange, remoteId?: string) => {
  if (!change.payload) {
    throw new Error(
      translate(useAppStore.getState().settings.language, 'local_sync_payload_missing', {
        taskId: change.taskId,
      }),
    );
  }

  if (!remoteId) {
    const created = await tasksApi.createTask(change.payload);
    useAppStore.getState().setTaskRemoteId(change.taskId, created.id);
    return created.id;
  }

  try {
    await tasksApi.updateTask(change.payload, remoteId);
    useAppStore.getState().setTaskRemoteId(change.taskId, remoteId);
    return remoteId;
  } catch (error) {
    // The record may disappear between GET /tasks and PUT /tasks/:id.
    if (error instanceof ApiError && error.status === 404) {
      const created = await tasksApi.createTask(change.payload);
      useAppStore.getState().setTaskRemoteId(change.taskId, created.id);
      return created.id;
    }
    throw error;
  }
};

const syncDelete = async (change: PendingChange, remoteId?: string) => {
  if (!remoteId) {
    return;
  }

  try {
    await tasksApi.deleteTask(remoteId);
  } catch (error) {
    // Delete is idempotent: an already missing server record is a successful result.
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
  }
};

const runSync = async (pullRemote: boolean): Promise<SyncSummary> => {
  const initialState = useAppStore.getState();
  const changes = [...initialState.pendingChanges];

  if (!initialState.isOnline || (!changes.length && !pullRemote)) {
    return { attempted: 0, synced: 0, failed: 0, skipped: changes.length };
  }

  initialState.setSyncing(true);
  const startedAt = new Date().toISOString();

  for (const change of changes) {
    initialState.updatePendingChangeAttempt(change.taskId, { attemptedAt: startedAt, error: null });
    if (!change.lastAttemptedAt || change.lastAttemptedAt < change.updatedAt) {
      addSyncHistoryEntry(
        change,
        'sync_started',
        translate(initialState.settings.language, 'sync_started_for_task', { taskId: change.taskId }),
      );
    }
  }

  let synced = 0;
  let failed = 0;

  try {
    const remoteTasks = await tasksApi.getTasks();
    initialState.setServerStatus('reachable');
    useAppStore.getState().mergeRemoteTasks(remoteTasks.map(toLocalTask));

    for (const change of changes) {
      try {
        const remoteId = findRemoteId(change, remoteTasks);
        if (change.type === 'delete') {
          await syncDelete(change, remoteId);
        } else {
          const syncedRemoteId = await syncUpsert(change, remoteId);
          if (!remoteId) {
            remoteTasks.push({ ...change.payload!, id: syncedRemoteId, clientId: change.taskId });
          }
        }

        const currentChange = useAppStore
          .getState()
          .pendingChanges.find((item) => item.taskId === change.taskId);

        // Do not remove a newer edit that was queued while this request was running.
        if (currentChange?.updatedAt === change.updatedAt) {
          useAppStore.getState().removePendingChange(change.taskId);
          addSyncHistoryEntry(
            change,
            'synced',
            translate(initialState.settings.language, 'task_synced_successfully', { taskId: change.taskId }),
          );
          synced += 1;
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        useAppStore.getState().setServerStatus('reachable', errorMessage);
        const currentChange = useAppStore
          .getState()
          .pendingChanges.find((item) => item.taskId === change.taskId);

        if (currentChange?.updatedAt === change.updatedAt) {
          useAppStore.getState().updatePendingChangeAttempt(change.taskId, {
            attemptedAt: startedAt,
            error: errorMessage,
          });
          addSyncHistoryEntry(change, 'sync_failed', errorMessage);
          failed += 1;
        }
      }
    }

    if (synced > 0) {
      useAppStore.getState().setLastSyncedAt(new Date().toISOString());
    }

    return { attempted: changes.length, synced, failed, skipped: changes.length - synced - failed };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    useAppStore.getState().setServerStatus('unreachable', errorMessage);

    for (const change of changes) {
      const currentChange = useAppStore
        .getState()
        .pendingChanges.find((item) => item.taskId === change.taskId);

      if (currentChange?.updatedAt === change.updatedAt) {
        useAppStore.getState().updatePendingChangeAttempt(change.taskId, {
          attemptedAt: startedAt,
          error: errorMessage,
        });
        addSyncHistoryEntry(change, 'sync_failed', errorMessage);
        failed += 1;
      }
    }

    return { attempted: changes.length, synced: 0, failed, skipped: changes.length - failed };
  } finally {
    useAppStore.getState().setSyncing(false);
  }
};

export const syncPendingChanges = async (
  options: { pullRemote?: boolean } = {},
): Promise<SyncSummary> => {
  if (syncRunInFlight) {
    return syncRunInFlight;
  }

  syncRunInFlight = runSync(options.pullRemote ?? false);
  try {
    return await syncRunInFlight;
  } finally {
    syncRunInFlight = null;
  }
};
