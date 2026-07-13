import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationScheduleResult, Task } from '../../types/task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return current;
  }

  return Notifications.requestPermissionsAsync();
};

export const configureNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('task-reminders', {
    name: 'Task reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1463FF',
  });
};

export const cancelTaskNotification = async (notificationId?: string | null) => {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const scheduleTaskNotification = async (
  task: Task,
  demoMode: boolean,
): Promise<NotificationScheduleResult | null> => {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return null;
  }

  const dueTime = new Date(task.dueDate).getTime();
  const scheduledFor = dueTime - 30 * 60 * 1000;
  const shouldUseFallback = scheduledFor <= Date.now();
  const warning = demoMode
    ? 'Demo mode is enabled. Notification was scheduled in 45 seconds.'
    : shouldUseFallback
      ? 'Due time is too close. Notification was scheduled in 60 seconds instead.'
      : null;
  const seconds = demoMode
    ? 45
    : shouldUseFallback
      ? 60
      : Math.max(1, Math.floor((scheduledFor - Date.now()) / 1000));

  const trigger: Notifications.TimeIntervalTriggerInput = Platform.OS === 'android'
    ? {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: 'task-reminders',
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Upcoming task: ${task.title}`,
      body: `${task.location.address} at ${new Date(task.dueDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      sound: true,
    },
    trigger,
  });

  return {
    notificationId,
    warning,
  };
};
