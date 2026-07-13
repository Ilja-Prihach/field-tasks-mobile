import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { API_BASE_URL } from '../api/tasksApi';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { syncPendingChanges } from '../features/sync/syncService';
import { UserSelector } from '../features/users/UserSelector';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';
import { getServerStatusTranslationKey, translate } from '../utils/translations';
import { formatDateTime } from '../utils/date';

export const SettingsScreen = () => {
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const isOnline = useAppStore((state) => state.isOnline);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const serverStatus = useAppStore((state) => state.serverStatus);
  const lastSyncError = useAppStore((state) => state.lastSyncError);
  const lastSyncedAt = useAppStore((state) => state.lastSyncedAt);
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const currentUserId = useAppStore((state) => state.settings.currentUserId);
  const pendingChanges = useAppStore((state) => state.pendingChanges.length);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setNotificationDemoMode = useAppStore((state) => state.setNotificationDemoMode);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  return (
    <ScreenContainer scroll edges={['top']} contentStyle={styles.screenContent}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>{t('tab_settings')}</Text>

      <SectionCard title={t('appearance')}>
        <View style={styles.row}>
          <Text style={{ color: colors.text }}>{t('dark_mode')}</Text>
          <Switch value={themeMode === 'dark'} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
        </View>
        <View style={styles.languageBlock}>
          <Text style={{ color: colors.text }}>{t('language')}</Text>
          <View style={styles.languageButtons}>
            <PrimaryButton label={t('english')} onPress={() => setLanguage('en')} variant={language === 'en' ? 'primary' : 'secondary'} />
            <PrimaryButton label={t('russian')} onPress={() => setLanguage('ru')} variant={language === 'ru' ? 'primary' : 'secondary'} />
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('current_user')}>
        <Text style={{ color: colors.textMuted }}>{t('current_user_help')}</Text>
        <UserSelector value={currentUserId} onChange={setCurrentUser} />
      </SectionCard>

      <SectionCard title={t('notifications')}>
        <View style={styles.settingBlock}>
          <View style={styles.settingHeader}>
            <Text style={[styles.rowText, { color: colors.text }]}>{t('demo_mode_45')}</Text>
            <Switch value={notificationDemoMode} onValueChange={setNotificationDemoMode} />
          </View>
          <Text style={{ color: colors.textMuted }}>
            {t('notifications_fallback_help')}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title={t('sync')}>
        <Text style={{ color: colors.textMuted }}>{t('server')}: {API_BASE_URL}</Text>
        <Text style={{ color: colors.textMuted }}>{t('network')}: {isOnline ? t('network_available') : t('network_offline')}</Text>
        <Text
          style={{
            color:
              serverStatus === 'reachable'
                ? colors.success
                : serverStatus === 'unreachable'
                  ? colors.danger
                  : colors.textMuted,
          }}
        >
          {t('mock_server')}: {translate(language, getServerStatusTranslationKey(serverStatus))}
        </Text>
        <Text style={{ color: colors.textMuted }}>{t('sync_state')}: {isSyncing ? t('sync_in_progress') : t('sync_idle')}</Text>
        <Text style={{ color: colors.textMuted }}>{t('pending_changes')}: {pendingChanges}</Text>
        {lastSyncedAt ? (
          <Text style={{ color: colors.textMuted }}>{t('last_successful_sync')}: {formatDateTime(lastSyncedAt)}</Text>
        ) : null}
        {lastSyncError ? <Text style={{ color: colors.danger }}>{lastSyncError}</Text> : null}
        <PrimaryButton
          label={isSyncing ? t('syncing') : t('run_sync_now')}
          disabled={isSyncing || !isOnline}
          onPress={() =>
            void syncPendingChanges({ pullRemote: true })
              .then((summary) => {
                if (!summary.attempted && !summary.failed) {
                  Alert.alert(
                    t('sync_status'),
                    isOnline ? t('nothing_waiting_for_sync') : t('no_internet_connection'),
                  );
                  return;
                }

                if (!summary.failed) {
                  Alert.alert(t('sync_completed'), t('tasks_synced_successfully', { count: summary.synced }));
                  return;
                }

                Alert.alert(
                  t('sync_finished_with_issues'),
                  t('sync_summary_with_failures', { synced: summary.synced, failed: summary.failed }),
                );
              })
              .catch((error) =>
                Alert.alert(t('sync_failed_title'), error instanceof Error ? error.message : t('unexpected_error')),
              )
          }
        />
      </SectionCard>

      <SectionCard title={t('about')}>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>{t('field_tasks_mvp')}</Text>
        <Text style={{ color: colors.textMuted }}>{t('candidate_code')}: SA-RN-4827</Text>
        <Text style={{ color: colors.textMuted }}>
          {t('about_description')}
        </Text>
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 10,
    paddingBottom: 28,
    gap: 12,
  },
  screenTitle: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    paddingRight: 6,
  },
  settingBlock: {
    gap: 10,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  languageBlock: {
    gap: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
