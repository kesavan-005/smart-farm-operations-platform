import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { db } from '@/offline/db';
import type { ApiResponse } from '@/types/api';

export interface CurrentWeather {
  time?: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationProbability: number;
  rain: number;
  windSpeed: number;
  weatherCode: number;
}

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  rainSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  precipitationProbability: number;
  rain: number;
  weatherCode: number;
}

export interface WeatherResponseData {
  farmId: string;
  farmName: string;
  latitude: number;
  longitude: number;
  currentWeather: CurrentWeather;
  todayWeather: DailyWeather;
  hourlyForecast: HourlyWeather[];
  dailyForecast: DailyWeather[];
  alerts: string[];
  cachedAt: string;
  stale: boolean;
  isOfflineCache?: boolean;
}

export async function fetchFarmWeather(farmId: string): Promise<WeatherResponseData> {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isOffline) {
    const offlineCached = await db.weatherCache.get(farmId);
    if (offlineCached && offlineCached.weatherData) {
      return {
        ...offlineCached.weatherData,
        isOfflineCache: true,
        cachedAt: offlineCached.updatedAt || offlineCached.weatherData.cachedAt,
      };
    }
    throw new Error('WEATHER_OFFLINE_UNAVAILABLE');
  }

  try {
    const res = await apiClient.get<ApiResponse<WeatherResponseData>>(`/farms/${farmId}/weather`);
    const data = res.data.data;

    // Cache locally in Dexie for offline use
    await db.weatherCache.put({
      farmId,
      weatherData: data,
      updatedAt: new Date().toISOString(),
    });

    return {
      ...data,
      isOfflineCache: false,
    };
  } catch (err: any) {
    // Try fallback to Dexie cache if network or server error occurs
    const offlineCached = await db.weatherCache.get(farmId);
    if (offlineCached && offlineCached.weatherData) {
      return {
        ...offlineCached.weatherData,
        isOfflineCache: true,
        stale: true,
        cachedAt: offlineCached.updatedAt || offlineCached.weatherData.cachedAt,
      };
    }
    throw err;
  }
}

export function useFarmWeather(farmId?: string | null) {
  return useQuery({
    queryKey: ['farm-weather', farmId],
    queryFn: () => fetchFarmWeather(farmId!),
    enabled: !!farmId,
    staleTime: 1000 * 60 * 15, // 15 minutes client stale time
    refetchInterval: 1000 * 60 * 5, // 5 minutes periodic auto-refresh
    retry: (failureCount, error: any) => {
      // Don't retry if farm is 404 Not Found, location is unavailable, or offline without cache
      if (error?.response?.status === 404 || error?.code === 'RESOURCE_NOT_FOUND' || error?.response?.data?.error?.code === 'WEATHER_LOCATION_UNAVAILABLE' || error?.message === 'WEATHER_OFFLINE_UNAVAILABLE') {
        return false;
      }
      return failureCount < 2;
    },
  });
}
