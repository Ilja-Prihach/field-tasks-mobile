import { useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { configureNotificationChannel } from '../features/notifications/notificationService';
import { syncPendingChanges } from '../features/sync/syncService';
import { useAppStore } from '../storage/useAppStore';

export const useAppBootstrap = () => {
  const netInfo = useNetInfo();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const pendingRevision = useAppStore((state) =>
    state.pendingChanges.map((change) => `${change.taskId}:${change.updatedAt}`).join('|'),
  );
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);

  useEffect(() => {
    const hasInternet = netInfo.isConnected === true && netInfo.isInternetReachable !== false;
    setOnlineStatus(hasInternet);
  }, [netInfo.isConnected, netInfo.isInternetReachable, setOnlineStatus]);

  useEffect(() => {
    void configureNotificationChannel().catch(() => undefined);
  }, []);

  useEffect(() => {
    const hasInternet = netInfo.isConnected === true && netInfo.isInternetReachable !== false;
    if (hasHydrated && hasInternet && pendingRevision) {
      void syncPendingChanges().catch(() => undefined);
    }
  }, [hasHydrated, netInfo.isConnected, netInfo.isInternetReachable, pendingRevision]);
};
