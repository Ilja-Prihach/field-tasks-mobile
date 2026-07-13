import { useState } from 'react';
import { Image, LayoutChangeEvent, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useThemeColors } from '../../theme/useThemeColors';
import { Task } from '../../types/task';

type Props = {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TILE_SIZE = 256;

const projectLocation = (latitude: number, longitude: number, zoom: number) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const boundedLatitude = Math.max(-85.0511, Math.min(85.0511, latitude));
  const latitudeRadians = (boundedLatitude * Math.PI) / 180;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + Math.sin(latitudeRadians)) / (1 - Math.sin(latitudeRadians))) / (4 * Math.PI)) *
      scale,
  };
};

const getMapViewport = (tasks: Task[], width: number, height: number) => {
  const availableWidth = Math.max(width * 0.72, 240);
  const availableHeight = Math.max(height * 0.72, 140);
  let zoom = tasks.length === 1 ? 14 : 12;

  if (tasks.length > 1) {
    for (; zoom > 2; zoom -= 1) {
      const points = tasks.map((task) =>
        projectLocation(task.location.latitude, task.location.longitude, zoom),
      );
      const spanX = Math.max(...points.map((point) => point.x)) - Math.min(...points.map((point) => point.x));
      const spanY = Math.max(...points.map((point) => point.y)) - Math.min(...points.map((point) => point.y));

      if (spanX <= availableWidth && spanY <= availableHeight) {
        break;
      }
    }
  }

  const points = tasks.map((task) => projectLocation(task.location.latitude, task.location.longitude, zoom));
  return {
    zoom,
    centerX: (Math.min(...points.map((point) => point.x)) + Math.max(...points.map((point) => point.x))) / 2,
    centerY: (Math.min(...points.map((point) => point.y)) + Math.max(...points.map((point) => point.y))) / 2,
  };
};

const AndroidTileMap = ({ tasks, onTaskPress, interactive, style }: Required<Pick<Props, 'tasks' | 'interactive'>> & Pick<Props, 'onTaskPress' | 'style'>) => {
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 360, height: 500 });
  const viewport = getMapViewport(tasks, size.width, size.height);
  const minTileX = Math.floor((viewport.centerX - size.width / 2) / TILE_SIZE) - 1;
  const maxTileX = Math.floor((viewport.centerX + size.width / 2) / TILE_SIZE) + 1;
  const minTileY = Math.floor((viewport.centerY - size.height / 2) / TILE_SIZE) - 1;
  const maxTileY = Math.floor((viewport.centerY + size.height / 2) / TILE_SIZE) + 1;
  const tileCount = 2 ** viewport.zoom;
  const tiles = [];

  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) {
      continue;
    }
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({ tileX, tileY, wrappedTileX });
    }
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== size.width || height !== size.height)) {
      setSize({ width, height });
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.tileMap, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }, style]}
    >
      {tiles.map(({ tileX, tileY, wrappedTileX }) => (
        <Image
          key={`${viewport.zoom}-${tileX}-${tileY}`}
          source={{
            uri: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${viewport.zoom}/${wrappedTileX}/${tileY}.png`,
          }}
          style={[
            styles.tile,
            {
              left: tileX * TILE_SIZE - viewport.centerX + size.width / 2,
              top: tileY * TILE_SIZE - viewport.centerY + size.height / 2,
            },
          ]}
        />
      ))}
      {tasks.map((task, index) => {
        const point = projectLocation(task.location.latitude, task.location.longitude, viewport.zoom);
        const duplicates = tasks.filter(
          (item) =>
            item.location.latitude === task.location.latitude && item.location.longitude === task.location.longitude,
        );
        const duplicateIndex = duplicates.findIndex((item) => item.id === task.id);
        const angle = (duplicateIndex / Math.max(duplicates.length, 1)) * Math.PI * 2;
        const duplicateOffset = duplicates.length > 1 ? 20 : 0;
        const markerColor =
          task.status === 'completed' ? colors.success : task.status === 'cancelled' ? colors.danger : colors.primary;

        return (
          <Pressable
            key={task.id}
            accessibilityRole={interactive ? 'button' : undefined}
            accessibilityLabel={`${task.title}, ${task.location.address}`}
            disabled={!interactive}
            onPress={() => onTaskPress?.(task)}
            style={[
              styles.marker,
              {
                left: size.width / 2 + point.x - viewport.centerX + Math.cos(angle) * duplicateOffset,
                top: size.height / 2 + point.y - viewport.centerY + Math.sin(angle) * duplicateOffset,
                backgroundColor: markerColor,
              },
            ]}
          >
            <Text style={styles.markerText}>{index + 1}</Text>
          </Pressable>
        );
      })}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>© OpenStreetMap © CARTO</Text>
      </View>
    </View>
  );
};

export const TaskMap = ({ tasks, onTaskPress, interactive = true, style }: Props) => {
  if (Platform.OS !== 'android') {
    const firstTask = tasks[0];

    return (
      <MapView
        style={style}
        pointerEvents={interactive ? 'auto' : 'none'}
        initialRegion={{
          latitude: firstTask.location.latitude,
          longitude: firstTask.location.longitude,
          latitudeDelta: tasks.length === 1 ? 0.08 : 8,
          longitudeDelta: tasks.length === 1 ? 0.08 : 8,
        }}
      >
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{ latitude: task.location.latitude, longitude: task.location.longitude }}
            title={task.title}
            description={task.location.address}
            pinColor={task.status === 'completed' ? 'green' : task.status === 'cancelled' ? 'red' : undefined}
            onPress={() => onTaskPress?.(task)}
          />
        ))}
      </MapView>
    );
  }

  return <AndroidTileMap tasks={tasks} onTaskPress={onTaskPress} interactive={interactive} style={style} />;
};

const styles = StyleSheet.create({
  tileMap: {
    minHeight: 180,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  marker: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  attribution: {
    position: 'absolute',
    right: 4,
    bottom: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  attributionText: {
    color: '#2f3b45',
    fontSize: 9,
  },
});
