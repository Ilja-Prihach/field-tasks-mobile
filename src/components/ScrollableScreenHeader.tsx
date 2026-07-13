import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme/useThemeColors';
import { useTranslation } from '../utils/useTranslation';

type Props = {
  title: string;
  onBack: () => void;
};

export const ScrollableScreenHeader = ({ title, onBack }: Props) => {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        onPress={onBack}
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.backIcon, { color: colors.primary }]}>‹</Text>
        <Text style={[styles.backText, { color: colors.text }]}>{t('back')}</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 14,
    paddingBottom: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
});
