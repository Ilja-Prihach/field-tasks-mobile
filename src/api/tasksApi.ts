import { Platform } from 'react-native';

import { Task } from '../types/task';

export type RemoteTask = Omit<Task, 'id' | 'remoteId'> & {
  id: string;
  clientId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const defaultBaseUrl = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

const configuredBaseUrl = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL_ANDROID ?? process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS ?? process.env.EXPO_PUBLIC_API_BASE_URL,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

export const API_BASE_URL = (configuredBaseUrl ?? defaultBaseUrl).replace(/\/$/, '');

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const method = init?.method ?? 'GET';
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(`Cannot reach ${API_BASE_URL}. Start json-server and check the API URL. ${reason}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed with status ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const responseText = await response.text();

  if (!contentType.includes('application/json')) {
    throw new ApiError(
      `Expected JSON from ${url}, got "${contentType || 'unknown'}". Check json-server URL.`,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new ApiError(`Invalid JSON from ${url}. Check json-server response.`);
  }
};

export const tasksApi = {
  getTasks: () => request<RemoteTask[]>('/tasks'),
  createTask: (task: Task) =>
    request<RemoteTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(toRemoteTask(task)),
    }),
  updateTask: (task: Task, remoteId: string) =>
    request<RemoteTask>(`/tasks/${remoteId}`, {
      method: 'PUT',
      body: JSON.stringify(toRemoteTask(task)),
    }),
  deleteTask: (remoteId: string) =>
    request<void>(`/tasks/${remoteId}`, {
      method: 'DELETE',
    }),
};

const toRemoteTask = (task: Task): Omit<RemoteTask, 'id'> => {
  const { id, remoteId: _remoteId, notificationId: _notificationId, ...rest } = task;
  return {
    ...rest,
    clientId: id,
    syncStatus: 'synced',
  };
};

export const toLocalTask = (task: RemoteTask): Task => {
  const { id: remoteId, clientId, ...rest } = task;
  return {
    ...rest,
    id: clientId ?? remoteId,
    remoteId,
    syncStatus: 'synced',
    notificationId: null,
  };
};
