import { darkColors, lightColors } from './colors';
import { useAppStore } from '../storage/useAppStore';

export const useThemeColors = () => {
  const themeMode = useAppStore((state) => state.settings.themeMode);
  return themeMode === 'dark' ? darkColors : lightColors;
};
