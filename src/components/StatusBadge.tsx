import { StyleSheet, Text, View } from 'react-native';

import { TaskStatus } from '../types/task';
import { useThemeColors } from '../theme/useThemeColors';
import { getStatusLabel } from '../utils/task';

export const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const colors = useThemeColors();

  const backgroundColor =
    status === 'completed'
      ? colors.success
      : status === 'cancelled'
        ? colors.danger
        : status === 'in_progress'
          ? colors.warning
          : colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{getStatusLabel(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
