import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { InfoRow } from '../components/InfoRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScrollableScreenHeader } from '../components/ScrollableScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { RootStackParamList } from '../app/AppNavigator';
import { TaskMap } from '../features/location/TaskMap';
import { cancelTaskNotification, scheduleTaskNotification } from '../features/notifications/notificationService';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';
import { formatDateTime } from '../utils/date';
import { getHistoryActionLabel, getSyncStatusLabel } from '../utils/task';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;

export const TaskDetailsScreen = ({ navigation, route }: Props) => {
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const [brokenPreviewIds, setBrokenPreviewIds] = useState<string[]>([]);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const tasks = useAppStore((state) => state.tasks);
  const allHistory = useAppStore((state) => state.history);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const setTaskNotification = useAppStore((state) => state.setTaskNotification);
  const task = useMemo(
    () => tasks.find((item) => item.id === route.params.taskId),
    [route.params.taskId, tasks],
  );
  const history = useMemo(
    () =>
      allHistory.filter(
        (item) =>
          item.taskId === route.params.taskId &&
          item.actionType !== 'sync_started' &&
          item.actionType !== 'synced' &&
          item.actionType !== 'sync_failed',
      ),
    [allHistory, route.params.taskId],
  );

  if (!task) {
    return (
      <ScreenContainer scroll edges={['top']} contentStyle={styles.screenContent}>
        <ScrollableScreenHeader title={t('task_details')} onBack={() => navigation.goBack()} />
        <SectionCard>
          <Text style={{ color: colors.text }}>{t('task_not_found')}</Text>
        </SectionCard>
      </ScreenContainer>
    );
  }

  const handleStatusChange = async (status: typeof task.status) => {
    const updated = updateTaskStatus(task.id, status);
    if (!updated) {
      return;
    }

    try {
      await cancelTaskNotification(task.notificationId);
      const result = await scheduleTaskNotification(updated, notificationDemoMode);
      setTaskNotification(task.id, result?.notificationId ?? null);
      if (result?.warning) {
        Alert.alert(t('reminder_adjusted'), result.warning);
      }
    } catch (error) {
      Alert.alert(t('notification_error'), error instanceof Error ? error.message : t('unexpected_error'));
    }
  };

  const handleDelete = () => {
    Alert.alert(t('delete_task'), t('delete_task_confirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelTaskNotification(task.notificationId);
          } catch {
            // Notification cleanup must not block local deletion.
          }
          deleteTask(task.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const statusActions: Array<{ value: typeof task.status; label: string }> = [
    { value: 'in_progress', label: t('in_progress') },
    { value: 'completed', label: t('completed') },
    { value: 'cancelled', label: t('cancelled') },
  ];

  return (
    <ScreenContainer scroll edges={['top']} contentStyle={styles.screenContent}>
      <ScrollableScreenHeader title={t('task_details')} onBack={() => navigation.goBack()} />
      <SectionCard>
        <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
        <StatusBadge status={task.status} />
        <InfoRow label={t('description')} value={task.description} />
        <InfoRow label={t('due')} value={formatDateTime(task.dueDate)} />
        <InfoRow label={t('created_by')} value={task.createdBy.name} />
        <InfoRow label={t('assigned_to')} value={task.assignedTo.name} />
        <InfoRow label={t('sync')} value={getSyncStatusLabel(task.syncStatus, language)} />
      </SectionCard>

      <SectionCard title={t('location')}>
        <InfoRow label={t('address')} value={task.location.address} />
        <TaskMap
          tasks={[task]}
          style={styles.map}
          interactive={false}
        />
      </SectionCard>

      <SectionCard title={t('actions')}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('TaskForm', { taskId: task.id })}
          style={[styles.actionListRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
        >
          <View style={styles.statusActionCopy}>
            <Text style={[styles.statusActionLabel, { color: colors.text }]}>{t('edit_task_button')}</Text>
            <Text style={[styles.statusActionHint, { color: colors.textMuted }]}>{t('action_edit_hint')}</Text>
          </View>
          <Text style={[styles.actionChevron, { color: colors.textMuted }]}>›</Text>
        </Pressable>

        <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>{t('action_status_section')}</Text>
        <View style={styles.statusActions}>
          {statusActions.map((action) => {
            const isCurrent = task.status === action.value;

            return (
              <Pressable
                key={action.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent, disabled: isCurrent }}
                disabled={isCurrent}
                onPress={() => void handleStatusChange(action.value)}
                style={[
                  styles.statusActionRow,
                  {
                    backgroundColor: isCurrent ? `${colors.primary}16` : colors.surfaceMuted,
                    borderColor: isCurrent ? colors.primary : colors.border,
                    opacity: isCurrent ? 1 : 0.96,
                  },
                ]}
              >
                <View style={styles.statusActionCopy}>
                  <Text style={[styles.statusActionLabel, { color: colors.text }]}>{action.label}</Text>
                  <Text style={[styles.statusActionHint, { color: colors.textMuted }]}>
                    {isCurrent ? t('status_current') : t('status_tap_to_change')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusActionDot,
                    { backgroundColor: isCurrent ? colors.primary : colors.textMuted },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleDelete}
          style={[styles.actionListRow, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}33` }]}
        >
          <View style={styles.statusActionCopy}>
            <Text style={[styles.statusActionLabel, { color: colors.danger }]}>{t('delete')}</Text>
            <Text style={[styles.statusActionHint, { color: colors.textMuted }]}>{t('action_delete_hint')}</Text>
          </View>
          <Text style={[styles.actionChevron, { color: colors.danger }]}>›</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title={t('attachments')}>
        {task.attachments.length ? (
          <View style={styles.attachmentsGrid}>
            {task.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentItem}>
                {brokenPreviewIds.includes(attachment.id) ? (
                  <View style={[styles.attachmentFallback, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.attachmentFallbackText, { color: colors.textMuted }]}>
                      {t('preview_unavailable')}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentImage}
                    onError={() =>
                      setBrokenPreviewIds((current) =>
                        current.includes(attachment.id) ? current : [...current, attachment.id],
                      )
                    }
                  />
                )}
                <Text
                  style={[styles.attachmentName, { color: colors.textMuted }]}
                  numberOfLines={1}
                  onPress={() => void Linking.openURL(attachment.uri)}
                >
                  {attachment.fileName}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.textMuted }}>{t('no_attachments')}</Text>
        )}
      </SectionCard>

      <SectionCard title={t('task_history')}>
        {history.length ? (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                {getHistoryActionLabel(entry.actionType, language)}
              </Text>
              <Text style={{ color: colors.textMuted }}>{entry.description}</Text>
              {entry.actorName ? (
                <Text style={[styles.historyActor, { color: colors.primary }]}>
                  {t('changed_by', { name: entry.actorName })}
                </Text>
              ) : null}
              <Text style={{ color: colors.textMuted }}>{formatDateTime(entry.timestamp)}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.textMuted }}>{t('no_history_entries')}</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: 10,
    paddingBottom: 0,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusActions: {
    gap: 8,
  },
  sectionCaption: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionListRow: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusActionRow: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusActionCopy: {
    flex: 1,
    gap: 2,
  },
  statusActionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusActionHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionChevron: {
    fontSize: 24,
    lineHeight: 24,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  attachmentItem: {
    width: 100,
    gap: 6,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  attachmentFallback: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  attachmentFallbackText: {
    fontSize: 11,
    textAlign: 'center',
  },
  attachmentName: {
    fontSize: 11,
  },
  historyItem: {
    gap: 4,
    paddingBottom: 8,
  },
  historyTitle: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyActor: {
    fontSize: 12,
    fontWeight: '800',
  },
});
