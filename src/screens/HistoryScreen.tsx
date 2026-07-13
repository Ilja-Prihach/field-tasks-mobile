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

  return (
    <ScreenContainer>
      <FlatList
        data={history}
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
            <Text style={{ color: colors.textMuted }}>{item.description}</Text>
            <Text style={{ color: colors.textMuted }}>{formatDateTime(item.timestamp)}</Text>
            {item.taskId ? <Text style={{ color: colors.textMuted }}>{t('task_label')}: {item.taskId}</Text> : null}
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
});
