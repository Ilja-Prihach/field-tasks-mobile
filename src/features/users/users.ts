import { AppUser } from '../../types/task';

export const MOCK_USERS: AppUser[] = [
  { id: 'user-1', name: 'User 1' },
  { id: 'user-2', name: 'User 2' },
  { id: 'user-3', name: 'User 3' },
];

export const DEFAULT_USER = MOCK_USERS[0];

export const getUserById = (userId?: string): AppUser =>
  MOCK_USERS.find((user) => user.id === userId) ?? DEFAULT_USER;
