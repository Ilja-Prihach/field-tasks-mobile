import {
  HistoryActionType,
  LanguageCode,
  SortDirection,
  SortMode,
  SyncStatus,
  Task,
  TaskHistoryItem,
  TaskStatus,
} from '../types/task';
import {
  getHistoryActionTranslationKey,
  getStatusTranslationKey,
  getSyncStatusTranslationKey,
  translate,
} from './translations';

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

export const getStatusLabel = (status: TaskStatus, language: LanguageCode) =>
  translate(language, getStatusTranslationKey(status));

export const getSyncStatusLabel = (status: SyncStatus, language: LanguageCode) =>
  translate(language, getSyncStatusTranslationKey(status));

export const getHistoryActionLabel = (actionType: HistoryActionType, language: LanguageCode) =>
  translate(language, getHistoryActionTranslationKey(actionType));

const hiddenHistoryActions: HistoryActionType[] = ['sync_started', 'synced', 'sync_failed'];

export type HistoryFilter = 'all' | Exclude<HistoryActionType, 'sync_started' | 'synced' | 'sync_failed'>;

export const getVisibleHistoryItems = (
  history: TaskHistoryItem[],
  tasks: Task[],
  searchQuery: string,
  filter: HistoryFilter,
) => {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  return history.filter((item) => {
    if (hiddenHistoryActions.includes(item.actionType)) {
      return false;
    }

    if (filter !== 'all' && item.actionType !== filter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const taskTitle = item.taskTitle ?? tasks.find((task) => task.id === item.taskId)?.title ?? '';
    const haystack = `${taskTitle} ${item.description} ${item.actorName ?? ''}`.toLocaleLowerCase();

    return haystack.includes(normalizedQuery);
  });
};
