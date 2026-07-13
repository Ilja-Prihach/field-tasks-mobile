import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../app/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { TaskStatus } from '../types/task';
import { useTranslation } from '../utils/useTranslation';
import { formatDateTime } from '../utils/date';
import { getSyncStatusLabel, getTaskShortLocation, sortTasks } from '../utils/task';

type StatusFilter = 'all' | TaskStatus;

const getDirectionLabel = (
  sortMode: 'createdAt' | 'dueDate' | 'status',
  direction: 'asc' | 'desc',
  t: ReturnType<typeof useTranslation>['t'],
) => {
  if (sortMode === 'createdAt') {
    return direction === 'asc' ? t('direction_oldest_first') : t('direction_newest_first');
  }
  if (sortMode === 'dueDate') {
    return direction === 'asc' ? t('direction_due_soon') : t('direction_due_later');
  }
  return direction === 'asc' ? t('direction_new_first') : t('direction_cancelled_first');
};

export const TaskListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const rawTasks = useAppStore((state) => state.tasks);
  const sortMode = useAppStore((state) => state.sortMode);
  const sortDirection = useAppStore((state) => state.sortDirection);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const toggleSortDirection = useAppStore((state) => state.toggleSortDirection);
  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('filter_all') },
    { value: 'new', label: t('filter_new') },
    { value: 'in_progress', label: t('filter_in_progress') },
    { value: 'completed', label: t('filter_completed') },
    { value: 'cancelled', label: t('filter_cancelled') },
  ];
  const sortOptions = [
    { value: 'createdAt', label: t('sort_added') },
    { value: 'dueDate', label: t('sort_deadline') },
    { value: 'status', label: t('sort_status') },
  ] as const;
  const counts = useMemo(
    () => ({
      all: rawTasks.length,
      new: rawTasks.filter((task) => task.status === 'new').length,
      in_progress: rawTasks.filter((task) => task.status === 'in_progress').length,
      completed: rawTasks.filter((task) => task.status === 'completed').length,
      cancelled: rawTasks.filter((task) => task.status === 'cancelled').length,
    }),
    [rawTasks],
  );
  const tasks = useMemo(() => {
    const filtered = statusFilter === 'all' ? rawTasks : rawTasks.filter((task) => task.status === statusFilter);
    return sortTasks(filtered, sortMode, sortDirection);
  }, [rawTasks, sortDirection, sortMode, statusFilter]);
  const activeCount = counts.new + counts.in_progress;

  return (
    <ScreenContainer>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={[styles.hero, { backgroundColor: colors.accent }]}>
              <Text style={styles.eyebrow}>{t('field_overview')}</Text>
              <Text style={styles.heroTitle}>
                {t('active_tasks', {
                  count: activeCount,
                  suffix: activeCount === 1 ? t('active_tasks_suffix_one') : t('active_tasks_suffix_many'),
                })}
              </Text>
              <Text style={styles.heroSubtitle}>
                {t('hero_subtitle', { inProgress: counts.in_progress, completed: counts.completed })}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('filter_by_status')}</Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>{t('shown_count', { count: tasks.length })}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filterOptions.map((option) => {
                const selected = statusFilter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setStatusFilter(option.value)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? colors.text : colors.surface,
                        borderColor: selected ? colors.text : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterLabel, { color: selected ? colors.background : colors.text }]}>
                      {option.label}
                    </Text>
                    <View style={[styles.countBubble, { backgroundColor: selected ? colors.primary : colors.surfaceMuted }]}>
                      <Text style={[styles.countText, { color: selected ? '#fff' : colors.textMuted }]}>
                        {counts[option.value]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.sortPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sortTopRow}>
                <Text style={[styles.sortTitle, { color: colors.text }]}>{t('sort')}</Text>
                <Pressable onPress={toggleSortDirection} hitSlop={8}>
                  <Text style={[styles.directionText, { color: colors.primary }]}>
                    {getDirectionLabel(sortMode, sortDirection, t)}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.sortRow}>
                {sortOptions.map((option) => {
                  const selected = sortMode === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSortMode(option.value)}
                      style={[styles.sortButton, { backgroundColor: selected ? colors.accent : colors.surfaceMuted }]}
                    >
                      <Text style={[styles.sortLabel, { color: selected ? '#fff' : colors.text }]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={
              rawTasks.length
                ? t('no_filtered_tasks', { status: filterOptions.find((item) => item.value === statusFilter)?.label ?? '' })
                : t('no_tasks_yet')
            }
            subtitle={rawTasks.length ? t('choose_another_status_filter') : t('create_first_task')}
          />
        }
        renderItem={({ item }) => {
          const accentColor =
            item.status === 'completed'
              ? colors.success
              : item.status === 'cancelled'
                ? colors.danger
                : item.status === 'in_progress'
                  ? colors.warning
                  : colors.accent;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${getSyncStatusLabel(item.syncStatus, language)}, ${formatDateTime(item.dueDate)}`}
              onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
              style={({ pressed }) => [
                styles.taskCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <View style={[styles.statusRail, { backgroundColor: accentColor }]} />
              <View style={styles.taskBody}>
                <View style={styles.taskTopRow}>
                  <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                </View>
                <StatusBadge status={item.status} />
                <View style={[styles.metaGrid, { borderTopColor: colors.border }]}>
                  <View style={styles.metaBlock}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('deadline')}</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{formatDateTime(item.dueDate)}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('location')}</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={2}>
                      {getTaskShortLocation(item.location.address)}
                    </Text>
                  </View>
                </View>
                <View style={styles.syncRow}>
                  <View
                    style={[
                      styles.syncDot,
                      {
                        backgroundColor:
                          item.syncStatus === 'synced'
                            ? colors.success
                            : item.syncStatus === 'failed'
                              ? colors.danger
                              : colors.warning,
                      },
                    ]}
                  />
                  <Text style={[styles.syncText, { color: colors.textMuted }]}>{getSyncStatusLabel(item.syncStatus, language)}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  headerContent: {
    gap: 16,
    marginBottom: 4,
  },
  hero: {
    minHeight: 142,
    borderRadius: 26,
    padding: 22,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    gap: 9,
    paddingRight: 12,
  },
  filterChip: {
    minHeight: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    paddingLeft: 13,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  countBubble: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '900',
  },
  sortPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  sortTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  directionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  taskCard: {
    minHeight: 220,
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    overflow: 'hidden',
  },
  statusRail: {
    width: 6,
  },
  taskBody: {
    flex: 1,
    padding: 18,
    gap: 12,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 28,
  },
  metaGrid: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 13,
    flexDirection: 'row',
    gap: 18,
  },
  metaBlock: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
