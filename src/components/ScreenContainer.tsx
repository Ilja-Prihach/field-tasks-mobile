import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '../theme/useThemeColors';

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: Edge[];
}>;

export const ScreenContainer = ({ children, scroll = false, contentStyle, edges }: Props) => {
  const colors = useThemeColors();
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]}>{children}</ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: colors.background }]}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
});
