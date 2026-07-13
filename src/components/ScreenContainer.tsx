import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '../theme/useThemeColors';

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
}>;

export const ScreenContainer = ({ children, scroll = false, contentStyle }: Props) => {
  const colors = useThemeColors();
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]}>{children}</ScrollView>
  ) : (
    children
  );

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>{content}</SafeAreaView>;
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
