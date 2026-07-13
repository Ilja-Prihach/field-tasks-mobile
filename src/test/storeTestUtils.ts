import { useAppStore } from '../storage/useAppStore';
import { Task } from '../types/task';

export const resetAppStore = () => {
  useAppStore.setState({
    hasHydrated: true,
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
      language: 'en',
      currentUserId: 'user-1',
    },
  });
};

export const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Check generator',
  description: 'Inspect the backup generator on site.',
  dueDate: '2030-01-01T10:00:00.000Z',
  status: 'new',
  location: {
    address: 'Independence Ave 10, Minsk',
    latitude: 53.9006,
    longitude: 27.559,
  },
  attachments: [],
  createdBy: { id: 'user-1', name: 'User 1' },
  assignedTo: { id: 'user-1', name: 'User 1' },
  createdAt: '2030-01-01T08:00:00.000Z',
  updatedAt: '2030-01-01T08:00:00.000Z',
  syncStatus: 'pending',
  notificationId: null,
  ...overrides,
});
