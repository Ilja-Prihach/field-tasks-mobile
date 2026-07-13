import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme/useThemeColors';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export const PrimaryButton = ({ label, onPress, variant = 'primary', disabled = false }: Props) => {
  const colors = useThemeColors();
  const backgroundColor =
    variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.surfaceMuted : colors.primary;
  const textColor = variant === 'secondary' ? colors.text : '#fff';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
