import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { API_BASE_URL } from '../api/tasksApi';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { syncPendingChanges } from '../features/sync/syncService';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';

export const SettingsScreen = () => {
  const colors = useThemeColors();
  const isOnline = useAppStore((state) => state.isOnline);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const pendingChanges = useAppStore((state) => state.pendingChanges.length);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setNotificationDemoMode = useAppStore((state) => state.setNotificationDemoMode);

  return (
    <ScreenContainer scroll>
      <SectionCard title="Appearance">
        <View style={styles.row}>
          <Text style={{ color: colors.text }}>Dark mode</Text>
          <Switch value={themeMode === 'dark'} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
        </View>
      </SectionCard>

      <SectionCard title="Notifications">
        <View style={styles.row}>
          <Text style={{ color: colors.text }}>Demo mode (45 sec reminder)</Text>
          <Switch value={notificationDemoMode} onValueChange={setNotificationDemoMode} />
        </View>
        <Text style={{ color: colors.textMuted }}>
          If a deadline is too close, the app uses a fallback reminder instead of skipping the notification.
        </Text>
      </SectionCard>

      <SectionCard title="Sync">
        <Text style={{ color: colors.textMuted }}>Server: {API_BASE_URL}</Text>
        <Text style={{ color: colors.textMuted }}>Online: {String(isOnline)}</Text>
        <Text style={{ color: colors.textMuted }}>Syncing: {String(isSyncing)}</Text>
        <Text style={{ color: colors.textMuted }}>Pending changes: {pendingChanges}</Text>
        <PrimaryButton
          label="Run sync now"
          onPress={() =>
            void syncPendingChanges().catch((error) =>
              Alert.alert('Sync failed', error instanceof Error ? error.message : 'Unexpected error'),
            )
          }
        />
      </SectionCard>

      <SectionCard title="About">
        <Text style={[styles.aboutTitle, { color: colors.text }]}>Field Tasks MVP</Text>
        <Text style={{ color: colors.textMuted }}>Candidate code: SA-RN-4827</Text>
        <Text style={{ color: colors.textMuted }}>
          Offline-first Android-oriented Expo app for task planning, reminders and mock sync.
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
