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
import { getTaskShortLocation, sortTasks } from '../utils/task';

const sortOptions = ['createdAt', 'dueDate', 'status'] as const;

export const TaskListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const tasks = useAppStore((state) => sortTasks(state.tasks, state.sortMode));
  const sortMode = useAppStore((state) => state.sortMode);
  const setSortMode = useAppStore((state) => state.setSortMode);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <SectionCard title="Sorting">
          <View style={styles.sortRow}>
            {sortOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setSortMode(option)}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: sortMode === option ? colors.primary : colors.surfaceMuted,
                  },
                ]}
              >
                <Text style={{ color: sortMode === option ? '#fff' : colors.text, fontWeight: '700' }}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
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
                  Sync: {item.syncStatus}
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
