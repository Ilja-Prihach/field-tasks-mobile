import { tasksApi } from '../../api/tasksApi';
import { useAppStore } from '../../storage/useAppStore';

export const syncPendingChanges = async () => {
  const store = useAppStore.getState();
  if (store.isSyncing || !store.isOnline || !store.pendingChanges.length) {
    return;
  }

  store.setSyncing(true);

  try {
    for (const change of useAppStore.getState().pendingChanges) {
      useAppStore.getState().addHistoryItem({
        taskId: change.taskId,
        actionType: 'sync_started',
        description: `Sync started for task ${change.taskId}.`,
      });

      try {
        if (change.type === 'delete') {
          try {
            await tasksApi.deleteTask(change.taskId);
          } catch (error) {
            if (!(error instanceof Error) || !error.message.includes('404')) {
              throw error;
            }
          }
        } else if (change.payload) {
          try {
            await tasksApi.getTask(change.taskId);
            await tasksApi.updateTask(change.payload);
          } catch {
            await tasksApi.createTask(change.payload);
          }
        }

        useAppStore.getState().markTaskSyncStatus(change.taskId, 'synced');
        useAppStore.getState().removePendingChange(change.taskId);
        useAppStore.getState().addHistoryItem({
          taskId: change.taskId,
          actionType: 'synced',
          description: `Task ${change.taskId} synced successfully.`,
        });
      } catch (error) {
        useAppStore.getState().markTaskSyncStatus(change.taskId, 'failed');
        useAppStore.getState().addHistoryItem({
          taskId: change.taskId,
          actionType: 'sync_failed',
          description:
            error instanceof Error ? error.message : `Sync failed for task ${change.taskId}.`,
        });
      }
    }

    const remoteTasks = await tasksApi.getTasks();
    useAppStore.getState().mergeRemoteTasks(remoteTasks);
  } finally {
    useAppStore.getState().setSyncing(false);
  }
};
