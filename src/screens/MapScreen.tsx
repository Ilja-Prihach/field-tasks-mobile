import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../app/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { TaskMap } from '../features/location/TaskMap';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';

export const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const tasks = useAppStore((state) => state.tasks);

  if (!tasks.length) {
    return (
      <ScreenContainer scroll>
        <EmptyState title="No map markers" subtitle="Create tasks with coordinates to see them on the map." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TaskMap
        tasks={tasks}
        style={StyleSheet.absoluteFill}
        onTaskPress={(task) => navigation.navigate('TaskDetails', { taskId: task.id })}
      />
      <Text style={[styles.hint, { color: colors.text }]}>Tap a marker to open task details.</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#fff',
    padding: 12,
    overflow: 'hidden',
  },
});
