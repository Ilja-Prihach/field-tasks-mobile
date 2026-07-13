import { resetAppStore } from '../../test/storeTestUtils';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(async () => {
    resetAppStore();
    await useAppStore.persist.clearStorage();
  });

  it('creates a task with pending sync and history entries', () => {
    const task = useAppStore.getState().createTask({
      title: 'Replace sensor',
      description: 'Swap the broken sensor in zone B.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Brivibas iela 21, Riga',
        latitude: 56.9559,
        longitude: 24.1205,
      },
      attachments: [
        {
          id: 'attachment-1',
          uri: 'file:///sensor.jpg',
          fileName: 'sensor.jpg',
          mimeType: 'image/jpeg',
        },
      ],
    });

    const state = useAppStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].id).toBe(task.id);
    expect(state.tasks[0].syncStatus).toBe('pending');
    expect(state.pendingChanges).toHaveLength(1);
    expect(state.pendingChanges[0]).toMatchObject({
      taskId: task.id,
      type: 'upsert',
    });
    expect(state.history.map((item) => item.actionType)).toEqual(['attachment_added', 'created']);
  });

  it('updates status and records a status_changed history event', () => {
    const task = useAppStore.getState().createTask({
      title: 'Pump check',
      description: 'Check pressure in the main pump.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Marszalkowska 100, Warsaw',
        latitude: 52.2298,
        longitude: 21.0118,
      },
      attachments: [],
    });

    const updated = useAppStore.getState().updateTaskStatus(task.id, 'completed');
    const state = useAppStore.getState();

    expect(updated?.status).toBe('completed');
    expect(state.tasks[0].status).toBe('completed');
    expect(state.pendingChanges).toHaveLength(1);
    expect(state.history[0]).toMatchObject({
      taskId: task.id,
      actionType: 'status_changed',
      description: 'Status changed to "completed".',
    });
  });

  it('deletes a task locally and queues a delete operation for sync', () => {
    const task = useAppStore.getState().createTask({
      title: 'Valve cleanup',
      description: 'Clean the old valve assembly.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Independence Ave 10, Minsk',
        latitude: 53.9006,
        longitude: 27.559,
      },
      attachments: [],
    });

    useAppStore.getState().setTaskRemoteId(task.id, 'remote-77');
    useAppStore.getState().deleteTask(task.id);

    const state = useAppStore.getState();
    expect(state.tasks).toHaveLength(0);
    expect(state.pendingChanges).toHaveLength(1);
    expect(state.pendingChanges[0]).toMatchObject({
      taskId: task.id,
      type: 'delete',
      remoteId: 'remote-77',
    });
    expect(state.history[0]).toMatchObject({
      taskId: task.id,
      actionType: 'deleted',
    });
  });

  it('reconciles sync status to failed after a sync attempt error', () => {
    const task = useAppStore.getState().createTask({
      title: 'Boiler check',
      description: 'Review the boiler output values.',
      dueDate: '2030-04-01T09:00:00.000Z',
      status: 'new',
      location: {
        address: 'Brivibas iela 21, Riga',
        latitude: 56.9559,
        longitude: 24.1205,
      },
      attachments: [],
    });

    useAppStore.getState().updatePendingChangeAttempt(task.id, {
      attemptedAt: '2030-04-01T08:30:00.000Z',
      error: 'Server offline',
    });

    expect(useAppStore.getState().tasks[0].syncStatus).toBe('failed');
  });
});
