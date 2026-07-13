import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../app/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { TaskMap } from '../features/location/TaskMap';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';

export const MapScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const tasks = useAppStore((state) => state.tasks);

  if (!tasks.length) {
    return (
      <ScreenContainer scroll>
        <EmptyState title={t('no_map_markers')} subtitle={t('create_tasks_with_coordinates')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.mapWrapper}>
        <TaskMap
          tasks={tasks}
          style={StyleSheet.absoluteFill}
          onTaskPress={(task) => navigation.navigate('TaskDetails', { taskId: task.id })}
        />
        <Text pointerEvents="none" style={[styles.hint, { color: colors.text }]}>
          {t('tap_marker_hint')}
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    flex: 1,
  },
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
