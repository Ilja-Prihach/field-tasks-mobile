import { getVisibleHistoryItems } from '../task';
import { Task, TaskHistoryItem } from '../../types/task';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Inspect Gomel site',
  description: 'Check equipment',
  dueDate: '2026-07-20T12:00:00.000Z',
  status: 'new',
  location: {
    address: 'Gomel',
    latitude: 52.4345,
    longitude: 30.9754,
  },
  attachments: [],
  createdBy: { id: 'user-1', name: 'User 1' },
  assignedTo: { id: 'user-2', name: 'User 2' },
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T10:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});

const makeHistoryItem = (overrides: Partial<TaskHistoryItem> = {}): TaskHistoryItem => ({
  id: 'history-1',
  taskId: 'task-1',
  taskTitle: 'Inspect Gomel site',
  timestamp: '2026-07-14T10:00:00.000Z',
  actionType: 'created',
  description: 'Task was created.',
  ...overrides,
});

describe('getVisibleHistoryItems', () => {
  it('hides sync-only events from the main history feed', () => {
    const tasks = [makeTask()];
    const history = [
      makeHistoryItem({ id: '1', actionType: 'created' }),
      makeHistoryItem({ id: '2', actionType: 'sync_started' }),
      makeHistoryItem({ id: '3', actionType: 'sync_failed' }),
      makeHistoryItem({ id: '4', actionType: 'synced' }),
    ];

    const result = getVisibleHistoryItems(history, tasks, '', 'all');

    expect(result.map((item) => item.id)).toEqual(['1']);
  });

  it('filters by event type and finds tasks by title, description or actor name', () => {
    const tasks = [
      makeTask(),
      makeTask({
        id: 'task-2',
        title: 'Repair Warsaw line',
      }),
    ];
    const history = [
      makeHistoryItem({
        id: 'created',
        actionType: 'created',
        actorName: 'User 1',
      }),
      makeHistoryItem({
        id: 'assigned',
        taskId: 'task-2',
        taskTitle: 'Repair Warsaw line',
        actionType: 'assignment_changed',
        actorName: 'User 3',
        description: 'Task assigned to User 2.',
      }),
    ];

    expect(getVisibleHistoryItems(history, tasks, 'warsaw', 'all').map((item) => item.id)).toEqual([
      'assigned',
    ]);
    expect(
      getVisibleHistoryItems(history, tasks, 'user 3', 'assignment_changed').map((item) => item.id),
    ).toEqual(['assigned']);
    expect(getVisibleHistoryItems(history, tasks, '', 'created').map((item) => item.id)).toEqual([
      'created',
    ]);
  });
});
