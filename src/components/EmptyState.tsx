import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme/useThemeColors';

export const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
