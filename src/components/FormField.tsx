import { Text, TextInput, View, StyleSheet, TextInputProps } from 'react-native';

import { useThemeColors } from '../theme/useThemeColors';

type Props = TextInputProps & {
  label: string;
  error?: string;
  multiline?: boolean;
};

export const FormField = ({ label, error, multiline, ...props }: Props) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
        ]}
        placeholderTextColor={colors.textMuted}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
  },
});
