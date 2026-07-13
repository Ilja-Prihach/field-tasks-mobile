import { useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { syncPendingChanges } from '../features/sync/syncService';
import { useAppStore } from '../storage/useAppStore';

export const useAppBootstrap = () => {
  const netInfo = useNetInfo();
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);

  useEffect(() => {
    setOnlineStatus(Boolean(netInfo.isConnected));
  }, [netInfo.isConnected, setOnlineStatus]);

  useEffect(() => {
    if (netInfo.isConnected) {
      void syncPendingChanges();
    }
  }, [netInfo.isConnected]);
};
