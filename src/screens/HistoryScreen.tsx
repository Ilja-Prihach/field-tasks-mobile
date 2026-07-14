import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { FormField } from '../components/FormField';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';
import { formatDateTime } from '../utils/date';
import { getHistoryActionLabel, getVisibleHistoryItems, HistoryFilter } from '../utils/task';

export const HistoryScreen = () => {
  const colors = useThemeColors();
  const { language, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const history = useAppStore((state) => state.history);
  const tasks = useAppStore((state) => state.tasks);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: isFilterOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dropdownAnimation, isFilterOpen]);

  const filterOptions: { value: HistoryFilter; label: string }[] = useMemo(
    () => [
      { value: 'all', label: t('history_filter_all') },
      { value: 'created', label: getHistoryActionLabel('created', language) },
      { value: 'updated', label: getHistoryActionLabel('updated', language) },
      { value: 'status_changed', label: getHistoryActionLabel('status_changed', language) },
      { value: 'assignment_changed', label: getHistoryActionLabel('assignment_changed', language) },
      { value: 'attachment_added', label: getHistoryActionLabel('attachment_added', language) },
      { value: 'deleted', label: getHistoryActionLabel('deleted', language) },
    ],
    [language, t],
  );

  const visibleHistory = useMemo(
    () => getVisibleHistoryItems(history, tasks, searchQuery, historyFilter),
    [history, tasks, searchQuery, historyFilter],
  );

  const activeFilterLabel =
    filterOptions.find((option) => option.value === historyFilter)?.label ?? t('history_filter_all');
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
    <ScreenContainer edges={['top']}>
      <FlatList
        data={visibleHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>{t('tab_history')}</Text>
            <FormField
              label={t('history_search_label')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('history_search_placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            <View style={styles.filterBlock}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>{t('history_filter_label')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isFilterOpen }}
                onPress={() => setIsFilterOpen((current) => !current)}
                style={[styles.filterTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.filterValue, { color: colors.text }]}>{activeFilterLabel}</Text>
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
                    const selected = historyFilter === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setHistoryFilter(option.value);
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
                      </Pressable>
                    );
                  })}
                </Animated.View>
              ) : null}
            </View>
          </View>
        }
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
    paddingTop: 10,
    paddingBottom: 28,
    gap: 12,
  },
  headerContent: {
    gap: 14,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  filterBlock: {
    gap: 8,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterTrigger: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterChevron: {
    fontSize: 18,
    fontWeight: '800',
  },
  dropdownMenu: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
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
