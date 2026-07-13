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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: '#10211F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
