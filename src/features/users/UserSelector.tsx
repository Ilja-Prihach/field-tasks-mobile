import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme/useThemeColors';
import { MOCK_USERS } from './users';

type Props = {
  value: string;
  onChange: (userId: string) => void;
};

export const UserSelector = ({ value, onChange }: Props) => {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      {MOCK_USERS.map((user) => {
        const selected = user.id === value;
        return (
          <Pressable
            key={user.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(user.id)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: selected ? '#FFFFFF33' : colors.surface }]}>
              <Text style={[styles.initial, { color: selected ? '#fff' : colors.primary }]}>
                {user.name.slice(-1)}
              </Text>
            </View>
            <Text style={[styles.name, { color: selected ? '#fff' : colors.text }]}>{user.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 13,
    fontWeight: '900',
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
  },
});
