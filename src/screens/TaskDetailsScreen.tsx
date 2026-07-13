import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;

export const TaskDetailsScreen = ({ navigation, route }: Props) => {
  const colors = useThemeColors();
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const task = useAppStore((state) => state.tasks.find((item) => item.id === route.params.taskId));
  const history = useAppStore((state) => state.history.filter((item) => item.taskId === route.params.taskId));
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const setTaskNotification = useAppStore((state) => state.setTaskNotification);

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
      setTaskNotification(task.id, result.notificationId);
      if (result.warning) {
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
          await cancelTaskNotification(task.notificationId);
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
        <InfoRow label="Address" value={task.location.address} />
        <InfoRow
          label="Coordinates"
          value={`${task.location.latitude.toFixed(4)}, ${task.location.longitude.toFixed(4)}`}
        />
        <InfoRow label="Sync" value={task.syncStatus} />
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
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.attachmentImage}
                  onError={() => undefined}
                />
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
  attachmentItem: {
    width: 100,
    gap: 6,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
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
