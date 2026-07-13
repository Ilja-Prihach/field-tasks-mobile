import { SortDirection, SortMode, SyncStatus, Task, TaskStatus } from '../types/task';

const statusOrder: Record<TaskStatus, number> = {
  new: 0,
  in_progress: 1,
  completed: 2,
  cancelled: 3,
};

export const sortTasks = (tasks: Task[], sortMode: SortMode, direction: SortDirection) => {
  const list = [...tasks];
  const directionMultiplier = direction === 'asc' ? 1 : -1;

  switch (sortMode) {
    case 'dueDate':
      return list.sort(
        (a, b) =>
          directionMultiplier *
          (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      );
    case 'status':
      return list.sort(
        (a, b) =>
          directionMultiplier * (statusOrder[a.status] - statusOrder[b.status]) ||
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
    case 'createdAt':
    default:
      return list.sort(
        (a, b) =>
          directionMultiplier *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
  }
};

export const getTaskShortLocation = (address: string) => {
  if (address.length <= 36) {
    return address;
  }

  return `${address.slice(0, 33)}...`;
};

export const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
};

export const getSyncStatusLabel = (status: SyncStatus) => {
  switch (status) {
    case 'pending':
      return 'Waiting for sync';
    case 'failed':
      return 'Sync failed';
    case 'synced':
      return 'Synced';
  }
};
