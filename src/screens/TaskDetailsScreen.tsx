import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';

import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { RootStackParamList } from '../app/AppNavigator';
import { cancelTaskNotification, scheduleTaskNotification } from '../features/notifications/notificationService';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { formatDateTime } from '../utils/date';
import { getSyncStatusLabel } from '../utils/task';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;

export const TaskDetailsScreen = ({ navigation, route }: Props) => {
  const colors = useThemeColors();
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
    () => allHistory.filter((item) => item.taskId === route.params.taskId),
    [allHistory, route.params.taskId],
  );

  if (!task) {
    return (
      <ScreenContainer scroll>
        <SectionCard>
          <Text style={{ color: colors.text }}>Task not found. It may have been deleted.</Text>
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
        Alert.alert('Reminder adjusted', result.warning);
      }
    } catch (error) {
      Alert.alert('Notification error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete task', 'This action keeps the history entry but removes the task from the list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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

  return (
    <ScreenContainer scroll>
      <SectionCard>
        <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
        <StatusBadge status={task.status} />
        <InfoRow label="Description" value={task.description} />
        <InfoRow label="Due" value={formatDateTime(task.dueDate)} />
        <InfoRow label="Sync" value={getSyncStatusLabel(task.syncStatus)} />
      </SectionCard>

      <SectionCard title="Location">
        <InfoRow label="Address" value={task.location.address} />
        <MapView
          style={styles.map}
          pointerEvents="none"
          initialRegion={{
            latitude: task.location.latitude,
            longitude: task.location.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
        >
          <Marker
            coordinate={{
              latitude: task.location.latitude,
              longitude: task.location.longitude,
            }}
            title={task.title}
            description={task.location.address}
          />
        </MapView>
      </SectionCard>

      <SectionCard title="Actions">
        <PrimaryButton label="Edit task" onPress={() => navigation.navigate('TaskForm', { taskId: task.id })} />
        <View style={styles.actionRow}>
          <PrimaryButton label="In Progress" onPress={() => void handleStatusChange('in_progress')} variant="secondary" />
          <PrimaryButton label="Completed" onPress={() => void handleStatusChange('completed')} variant="secondary" />
        </View>
        <View style={styles.actionRow}>
          <PrimaryButton label="Cancelled" onPress={() => void handleStatusChange('cancelled')} variant="secondary" />
          <PrimaryButton label="Delete" onPress={handleDelete} variant="danger" />
        </View>
      </SectionCard>

      <SectionCard title="Attachments">
        {task.attachments.length ? (
          <View style={styles.attachmentsGrid}>
            {task.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentItem}>
                {brokenPreviewIds.includes(attachment.id) ? (
                  <View style={[styles.attachmentFallback, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.attachmentFallbackText, { color: colors.textMuted }]}>
                      Preview unavailable
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
          <Text style={{ color: colors.textMuted }}>No attachments.</Text>
        )}
      </SectionCard>

      <SectionCard title="Task history">
        {history.length ? (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{entry.actionType}</Text>
              <Text style={{ color: colors.textMuted }}>{entry.description}</Text>
              <Text style={{ color: colors.textMuted }}>{formatDateTime(entry.timestamp)}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.textMuted }}>No history entries yet.</Text>
        )}
      </SectionCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
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
});
