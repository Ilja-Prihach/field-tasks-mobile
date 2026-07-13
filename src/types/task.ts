export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type SortMode = 'createdAt' | 'dueDate' | 'status';
export type ThemeMode = 'light' | 'dark';

export type TaskAttachment = {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  size?: number;
};

export type TaskLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  location: TaskLocation;
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  notificationId?: string | null;
};

export type HistoryActionType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'attachment_added'
  | 'deleted'
  | 'sync_started'
  | 'synced'
  | 'sync_failed';

export type TaskHistoryItem = {
  id: string;
  taskId?: string;
  timestamp: string;
  actionType: HistoryActionType;
  description: string;
};

export type PendingChange = {
  taskId: string;
  type: 'upsert' | 'delete';
  payload?: Task;
  updatedAt: string;
};

export type TaskPayload = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  location: TaskLocation;
  attachments: TaskAttachment[];
};

export type AppSettings = {
  themeMode: ThemeMode;
  notificationDemoMode: boolean;
};
