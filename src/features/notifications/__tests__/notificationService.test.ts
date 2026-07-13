import * as Notifications from 'expo-notifications';

import { scheduleTaskNotification } from '../notificationService';
import { buildTask } from '../../../test/storeTestUtils';

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    HIGH: 'high',
  },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
  },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'notification-1'),
}));

describe('notificationService', () => {
  it('schedules a demo notification in 45 seconds', async () => {
    const result = await scheduleTaskNotification(buildTask(), true);

    expect(result).toEqual({
      notificationId: 'notification-1',
      warning: 'Demo mode is enabled. Notification was scheduled in 45 seconds.',
    });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          seconds: 45,
        }),
      }),
    );
  });

  it('falls back to a short reminder when the deadline is too close', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2030-01-01T09:45:00.000Z').getTime());

    const result = await scheduleTaskNotification(
      buildTask({
        dueDate: '2030-01-01T10:00:00.000Z',
      }),
      false,
    );

    expect(result?.warning).toBe('Due time is too close. Notification was scheduled in 60 seconds instead.');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          seconds: 60,
        }),
      }),
    );
  });

  it('does not schedule notifications for completed tasks', async () => {
    const result = await scheduleTaskNotification(
      buildTask({
        status: 'completed',
      }),
      false,
    );

    expect(result).toBeNull();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
