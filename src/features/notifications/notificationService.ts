import * as Notifications from 'expo-notifications';

import { Task } from '../../types/task';

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

export const cancelTaskNotification = async (notificationId?: string | null) => {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const scheduleTaskNotification = async (task: Task, demoMode: boolean) => {
  const dueTime = new Date(task.dueDate).getTime();
  const fallbackSeconds = demoMode ? 45 : 60;
  const scheduledFor = dueTime - 30 * 60 * 1000;
  const warning =
    scheduledFor <= Date.now()
      ? `Due time is too close. Notification was scheduled in ${fallbackSeconds} seconds instead.`
      : null;

  const seconds = warning ? fallbackSeconds : Math.max(1, Math.floor((scheduledFor - Date.now()) / 1000));

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Upcoming task: ${task.title}`,
      body: `${task.location.address} at ${new Date(task.dueDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  return {
    notificationId,
    warning,
  };
};
