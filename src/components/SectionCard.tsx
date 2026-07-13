import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme/useThemeColors';

type Props = PropsWithChildren<{
  title?: string;
}>;

export const SectionCard = ({ children, title }: Props) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
