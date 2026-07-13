import { useAppStore } from '../../storage/useAppStore';
import { translate } from '../../utils/translations';

const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 8000;

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export type GeocodedLocation = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export const geocodeAddress = async (address: string): Promise<GeocodedLocation | null> => {
  const language = useAppStore.getState().settings.language;
  const query = address.trim();
  if (!query) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEOCODING_URL}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'ru,en;q=0.8',
          'User-Agent': 'FieldTasksMVP-SA-RN-4827/1.0',
        },
      },
    );

    if (!response.ok) {
      throw new Error(translate(language, 'address_service_returned', { status: response.status }));
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);

    if (!first?.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      displayName: first.display_name,
      latitude,
      longitude,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(translate(language, 'address_search_timeout'));
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
