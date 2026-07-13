import { ApiError, tasksApi } from '../../../api/tasksApi';
import { useAppStore } from '../../../storage/useAppStore';
import { buildTask, resetAppStore } from '../../../test/storeTestUtils';
import { Task } from '../../../types/task';
import { syncPendingChanges } from '../syncService';

jest.mock('../../../api/tasksApi', () => ({
  ApiError: class ApiError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
  tasksApi: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
  toLocalTask: (task: unknown) => task,
}));

const mockedTasksApi = jest.mocked(tasksApi);

describe('syncPendingChanges', () => {
  beforeEach(async () => {
    resetAppStore();
    await useAppStore.persist.clearStorage();
    useAppStore.getState().setOnlineStatus(true);
  });

  it('creates a new remote task with POST and marks it as synced', async () => {
    const createdTask = useAppStore.getState().createTask({
      title: 'Replace filter',
      description: 'Install a new air filter.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Independence Ave 10, Minsk',
        latitude: 53.9006,
        longitude: 27.559,
      },
      attachments: [],
    });

    mockedTasksApi.getTasks.mockResolvedValue([]);
    mockedTasksApi.createTask.mockImplementation(async (payload: Task) => ({
      ...payload,
      id: 'remote-1',
      clientId: createdTask.id,
      syncStatus: 'synced',
    }));

    const result = await syncPendingChanges();
    const state = useAppStore.getState();

    expect(result).toEqual({ attempted: 1, synced: 1, failed: 0, skipped: 0 });
    expect(mockedTasksApi.createTask).toHaveBeenCalledTimes(1);
    expect(mockedTasksApi.updateTask).not.toHaveBeenCalled();
    expect(state.pendingChanges).toHaveLength(0);
    expect(state.tasks[0]).toMatchObject({
      id: createdTask.id,
      remoteId: 'remote-1',
      syncStatus: 'synced',
    });
  });

  it('updates an existing remote task with PUT when remoteId is known', async () => {
    const task = buildTask({
      id: 'task-remote',
      remoteId: 'remote-7',
      syncStatus: 'pending',
    });

    useAppStore.setState({
      tasks: [task],
      pendingChanges: [
        {
          taskId: task.id,
          remoteId: 'remote-7',
          type: 'upsert',
          payload: task,
          updatedAt: task.updatedAt,
          lastAttemptError: null,
        },
      ],
    });

    mockedTasksApi.getTasks.mockResolvedValue([]);
    mockedTasksApi.updateTask.mockResolvedValue({
      ...task,
      id: 'remote-7',
      clientId: task.id,
      syncStatus: 'synced',
    });

    await syncPendingChanges();

    expect(mockedTasksApi.updateTask).toHaveBeenCalledWith(task, 'remote-7');
    expect(mockedTasksApi.createTask).not.toHaveBeenCalled();
    expect(useAppStore.getState().pendingChanges).toHaveLength(0);
  });

  it('treats delete of a missing remote task as a successful sync', async () => {
    const task = buildTask({
      id: 'task-delete',
      remoteId: 'remote-missing',
      syncStatus: 'pending',
    });

    useAppStore.setState({
      tasks: [],
      pendingChanges: [
        {
          taskId: task.id,
          remoteId: 'remote-missing',
          type: 'delete',
          updatedAt: task.updatedAt,
          lastAttemptError: null,
        },
      ],
    });

    mockedTasksApi.getTasks.mockResolvedValue([]);
    mockedTasksApi.deleteTask.mockRejectedValue(new ApiError('DELETE failed with status 404', 404));

    const result = await syncPendingChanges();

    expect(result).toEqual({ attempted: 1, synced: 1, failed: 0, skipped: 0 });
    expect(useAppStore.getState().pendingChanges).toHaveLength(0);
  });

  it('does not duplicate sync failure history on repeated retries without changes', async () => {
    useAppStore.getState().createTask({
      title: 'Transformer review',
      description: 'Review transformer values.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Brivibas iela 21, Riga',
        latitude: 56.9559,
        longitude: 24.1205,
      },
      attachments: [],
    });

    mockedTasksApi.getTasks.mockRejectedValue(new Error('Server offline'));

    await syncPendingChanges();
    await syncPendingChanges();

    const syncFailedEntries = useAppStore
      .getState()
      .history.filter((item) => item.actionType === 'sync_failed');

    expect(syncFailedEntries).toHaveLength(1);
  });

  it('prevents parallel sync runs from issuing duplicate API requests', async () => {
    useAppStore.getState().createTask({
      title: 'Meter audit',
      description: 'Audit the external meter.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Marszalkowska 100, Warsaw',
        latitude: 52.2298,
        longitude: 21.0118,
      },
      attachments: [],
    });

    mockedTasksApi.getTasks.mockResolvedValue([]);
    mockedTasksApi.createTask.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ...buildTask(),
              id: 'remote-2',
              clientId: 'task-1',
              syncStatus: 'synced',
            });
          }, 10);
        }),
    );

    await Promise.all([syncPendingChanges(), syncPendingChanges()]);

    expect(mockedTasksApi.getTasks).toHaveBeenCalledTimes(1);
    expect(mockedTasksApi.createTask).toHaveBeenCalledTimes(1);
  });
});
