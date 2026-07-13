import { useAppStore } from '../storage/useAppStore';
import { translate, TranslationKey } from './translations';

export const useTranslation = () => {
  const language = useAppStore((state) => state.settings.language);

  return {
    language,
    t: (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
  };
};
