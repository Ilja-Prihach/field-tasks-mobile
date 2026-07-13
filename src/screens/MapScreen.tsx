import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';

import { RootStackParamList } from '../app/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
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
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: tasks[0].location.latitude,
          longitude: tasks[0].location.longitude,
          latitudeDelta: 8,
          longitudeDelta: 8,
        }}
      >
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.location.latitude,
              longitude: task.location.longitude,
            }}
            title={task.title}
            description={task.location.address}
            pinColor={task.status === 'completed' ? 'green' : task.status === 'cancelled' ? 'red' : undefined}
            onCalloutPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
          />
        ))}
      </MapView>
      <Text style={[styles.hint, { color: colors.text }]}>Tap a marker callout to open task details.</Text>
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
