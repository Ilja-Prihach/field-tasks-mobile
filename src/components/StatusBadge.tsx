import { StyleSheet, Text, View } from 'react-native';

import { TaskStatus } from '../types/task';
import { useThemeColors } from '../theme/useThemeColors';
import { getStatusLabel } from '../utils/task';

export const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const colors = useThemeColors();

  const statusColor =
    status === 'completed'
      ? colors.success
      : status === 'cancelled'
        ? colors.danger
        : status === 'in_progress'
          ? colors.warning
          : colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={[styles.text, { color: statusColor }]}>{getStatusLabel(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
