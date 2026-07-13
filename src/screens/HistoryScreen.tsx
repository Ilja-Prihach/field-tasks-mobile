import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';
import { formatDateTime } from '../utils/date';
import { getHistoryActionLabel } from '../utils/task';

export const HistoryScreen = () => {
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const history = useAppStore((state) => state.history);
  const tasks = useAppStore((state) => state.tasks);
  const visibleHistory = history.filter(
    (item) =>
      item.actionType !== 'sync_started' &&
      item.actionType !== 'synced' &&
      item.actionType !== 'sync_failed',
  );

  return (
    <ScreenContainer>
      <FlatList
        data={visibleHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <EmptyState title={t('no_history_yet')} subtitle={t('history_will_appear')} />
          </View>
        }
        renderItem={({ item }) => (
          <SectionCard>
            <Text style={[styles.action, { color: colors.text }]}>{getHistoryActionLabel(item.actionType, language)}</Text>
            <Text style={[styles.taskTitle, { color: colors.text }]}>
              {item.taskTitle ?? tasks.find((task) => task.id === item.taskId)?.title ?? '—'}
            </Text>
            <Text style={{ color: colors.textMuted }}>{item.description}</Text>
            {item.actorName ? (
              <Text style={[styles.actor, { color: colors.primary }]}>
                {t('changed_by', { name: item.actorName })}
              </Text>
            ) : null}
            <Text style={{ color: colors.textMuted }}>{formatDateTime(item.timestamp)}</Text>
          </SectionCard>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyWrapper: {
    paddingTop: 16,
  },
  action: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actor: {
    fontSize: 12,
    fontWeight: '800',
  },
});
