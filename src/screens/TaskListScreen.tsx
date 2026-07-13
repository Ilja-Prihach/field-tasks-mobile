import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { RootStackParamList } from '../app/AppNavigator';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { formatDateTime } from '../utils/date';
import { getSyncStatusLabel, getTaskShortLocation, sortTasks } from '../utils/task';

const sortOptions = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'dueDate', label: 'Deadline' },
  { value: 'status', label: 'Status' },
] as const;

const getDirectionLabel = (sortMode: (typeof sortOptions)[number]['value'], direction: 'asc' | 'desc') => {
  if (sortMode === 'createdAt') {
    return direction === 'asc' ? 'Oldest first' : 'Newest first';
  }
  if (sortMode === 'dueDate') {
    return direction === 'asc' ? 'Soonest first' : 'Latest first';
  }
  return direction === 'asc' ? 'New to Cancelled' : 'Cancelled to New';
};

export const TaskListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const rawTasks = useAppStore((state) => state.tasks);
  const sortMode = useAppStore((state) => state.sortMode);
  const sortDirection = useAppStore((state) => state.sortDirection);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const toggleSortDirection = useAppStore((state) => state.toggleSortDirection);
  const tasks = useMemo(
    () => sortTasks(rawTasks, sortMode, sortDirection),
    [rawTasks, sortDirection, sortMode],
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <SectionCard title="Sort tasks">
          <View style={styles.sortRow}>
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: sortMode === option.value }}
                onPress={() => setSortMode(option.value)}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: sortMode === option.value ? colors.primary : colors.surfaceMuted,
                  },
                ]}
              >
                <Text style={{ color: sortMode === option.value ? '#fff' : colors.text, fontWeight: '700' }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={toggleSortDirection}
            style={[styles.directionButton, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.textMuted }}>Order</Text>
            <Text style={[styles.directionLabel, { color: colors.text }]}>
              {getDirectionLabel(sortMode, sortDirection)} - Change
            </Text>
          </Pressable>
        </SectionCard>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="No tasks yet"
              subtitle="Create your first field task from the Add button in the header."
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}>
              <SectionCard>
                <View style={styles.itemHeader}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDateTime(item.dueDate)}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {getTaskShortLocation(item.location.address)}
                </Text>
                <Text
                  style={[
                    styles.syncText,
                    {
                      color:
                        item.syncStatus === 'failed'
                          ? colors.danger
                          : item.syncStatus === 'pending'
                            ? colors.warning
                            : colors.success,
                    },
                  ]}
                >
                  {getSyncStatusLabel(item.syncStatus)}
                </Text>
              </SectionCard>
            </Pressable>
          )}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  directionButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  directionLabel: {
    fontWeight: '700',
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  itemHeader: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
