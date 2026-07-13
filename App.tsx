import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { AppNavigator } from './src/app/AppNavigator';
import { useAppBootstrap } from './src/app/useAppBootstrap';
import { useAppStore } from './src/storage/useAppStore';
import { darkNavigationTheme, lightNavigationTheme } from './src/theme/navigationTheme';

export default function App() {
  useAppBootstrap();

  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const navigationTheme = themeMode === 'dark' ? darkNavigationTheme : lightNavigationTheme;

  if (!hasHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: navigationTheme.colors.background,
        }}
      >
        <ActivityIndicator color={navigationTheme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}
