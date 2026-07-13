import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../app/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';
import { formatDateTime } from '../utils/date';
import { getSyncStatusLabel, getTaskShortLocation, sortTasks } from '../utils/task';

type TaskFilter = 'all' | 'new' | 'in_progress' | 'completed' | 'deadline_soon';

export const TaskListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const rawTasks = useAppStore((state) => state.tasks);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: isFilterOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dropdownAnimation, isFilterOpen]);

  const filterOptions: { value: TaskFilter; label: string }[] = [
    { value: 'all', label: t('filter_all') },
    { value: 'new', label: t('filter_new') },
    { value: 'in_progress', label: t('filter_in_progress') },
    { value: 'completed', label: t('filter_completed') },
    { value: 'deadline_soon', label: t('filter_deadline_soon') },
  ];

  const counts = useMemo(
    () => ({
      all: rawTasks.length,
      new: rawTasks.filter((task) => task.status === 'new').length,
      in_progress: rawTasks.filter((task) => task.status === 'in_progress').length,
      completed: rawTasks.filter((task) => task.status === 'completed').length,
      deadline_soon: rawTasks.filter(
        (task) => task.status !== 'completed' && task.status !== 'cancelled',
      ).length,
    }),
    [rawTasks],
  );

  const tasks = useMemo(() => {
    if (taskFilter === 'deadline_soon') {
      const activeTasks = rawTasks.filter(
        (task) => task.status !== 'completed' && task.status !== 'cancelled',
      );
      return sortTasks(activeTasks, 'dueDate', 'asc');
    }

    const filtered =
      taskFilter === 'all' ? rawTasks : rawTasks.filter((task) => task.status === taskFilter);
    return sortTasks(filtered, 'createdAt', 'desc');
  }, [rawTasks, taskFilter]);

  const activeCount = counts.new + counts.in_progress;
  const activeFilterLabel =
    filterOptions.find((option) => option.value === taskFilter)?.label ?? t('filter_all');
  const dropdownStyle = {
    opacity: dropdownAnimation,
    transform: [
      {
        translateY: dropdownAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
      {
        scaleY: dropdownAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
    ],
  } as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topBar}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>{t('tab_tasks')}</Text>
              <PrimaryButton label={t('add_task')} onPress={() => navigation.navigate('TaskForm')} />
            </View>

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

            <View style={styles.filterBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('filter_menu_label')}</Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                  {t('shown_count', { count: tasks.length })}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isFilterOpen }}
                onPress={() => setIsFilterOpen((current) => !current)}
                style={[styles.filterTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.filterTriggerText}>
                  <Text style={[styles.filterTriggerLabel, { color: colors.textMuted }]}>
                    {t('filter_by_status')}
                  </Text>
                  <Text style={[styles.filterTriggerValue, { color: colors.text }]}>
                    {activeFilterLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.filterChevron,
                    {
                      color: colors.primary,
                      transform: [{ rotate: isFilterOpen ? '180deg' : '0deg' }],
                    },
                  ]}
                >
                  ˅
                </Text>
              </Pressable>

              {isFilterOpen ? (
                <Animated.View
                  style={[
                    styles.dropdownMenu,
                    dropdownStyle,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {filterOptions.map((option) => {
                    const selected = taskFilter === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setTaskFilter(option.value);
                          setIsFilterOpen(false);
                        }}
                        style={[
                          styles.dropdownOption,
                          {
                            backgroundColor: selected ? colors.surfaceMuted : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[styles.dropdownLabel, { color: colors.text }]}>{option.label}</Text>
                        <View
                          style={[
                            styles.countBubble,
                            { backgroundColor: selected ? colors.primary : colors.surfaceMuted },
                          ]}
                        >
                          <Text
                            style={[styles.countText, { color: selected ? '#fff' : colors.textMuted }]}
                          >
                            {counts[option.value]}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={
              rawTasks.length
                ? t('no_filtered_tasks', {
                    status: filterOptions.find((item) => item.value === taskFilter)?.label ?? '',
                  })
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
                  <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                </View>
                <StatusBadge status={item.status} />
                <Text style={[styles.assignee, { color: colors.textMuted }]}>
                  {t('assigned_to')}: {item.assignedTo.name}
                </Text>
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
                  <Text style={[styles.syncText, { color: colors.textMuted }]}>
                    {getSyncStatusLabel(item.syncStatus, language)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 14,
  },
  headerContent: {
    gap: 16,
    marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitle: {
    flex: 1,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
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
  filterBlock: {
    gap: 10,
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
  filterTrigger: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTriggerText: {
    gap: 3,
  },
  filterTriggerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  filterTriggerValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  filterChevron: {
    fontSize: 24,
    fontWeight: '700',
  },
  dropdownMenu: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 8,
    gap: 6,
  },
  dropdownOption: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownLabel: {
    fontSize: 14,
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
  assignee: {
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
