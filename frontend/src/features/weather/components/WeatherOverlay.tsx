import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFarmWeather } from '../api/weatherApi';
import { getWeatherInfoByCode } from '../utils/weatherUtils';
import { Button } from '@/components/ui/button';
import {
  Droplets, CloudRain, Wind, AlertTriangle, RefreshCw,
  MapPinOff, WifiOff, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';

interface WeatherOverlayProps {
  farmId?: string;
  className?: string;
}

export function WeatherOverlay({ farmId, className = '' }: WeatherOverlayProps) {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  const [showForecast, setShowForecast] = useState(false);

  const { data: weather, isLoading, isError, error, refetch, isFetching } = useFarmWeather(farmId);

  if (!farmId) {
    return null;
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className={`p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3 w-full sm:max-w-sm ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted animate-pulse rounded w-24" />
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
        </div>
        <div className="h-10 bg-muted animate-pulse rounded-xl w-32" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  // Location Unavailable Error
  const errorCode = (error as any)?.response?.data?.error?.code || (error as any)?.message;
  if (errorCode === 'WEATHER_LOCATION_UNAVAILABLE') {
    return (
      <div className={`p-4 rounded-2xl bg-card border border-amber-500/20 bg-amber-500/5 text-card-foreground shadow-sm space-y-2 w-full sm:max-w-sm ${className}`}>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
          <MapPinOff className="w-4 h-4 shrink-0" />
          <span>{t('weather.locationUnavailable', 'Farm location is not available.')}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isTa ? 'வானிலையை பார்க்க உங்கள் பண்ணை சுயவிவரத்தில் அட்சரேகை & தீர்க்கரேகையை சேர்க்கவும்.' : 'Please add coordinates to your farm profile to view weather.'}
        </p>
      </div>
    );
  }

  // Offline Unavailable Error (No Cache)
  if (errorCode === 'WEATHER_OFFLINE_UNAVAILABLE') {
    return (
      <div className={`p-4 rounded-2xl bg-card border border-border text-card-foreground shadow-sm space-y-2 w-full sm:max-w-sm ${className}`}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            {t('weather.offlineUnavailable', 'Weather unavailable offline.')}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-6 px-2 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> {t('weather.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  // General Error State
  if (isError || !weather) {
    return (
      <div className={`p-4 rounded-2xl bg-card border border-destructive/20 text-card-foreground shadow-sm space-y-3 w-full sm:max-w-sm ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-destructive">{t('weather.unavailable', 'Weather unavailable.')}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-7 text-xs">
            <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> {t('weather.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  const { currentWeather, todayWeather, dailyForecast, alerts, isOfflineCache, cachedAt } = weather;
  const currWeatherInfo = getWeatherInfoByCode(currentWeather?.weatherCode);
  const CurrIcon = currWeatherInfo.icon;

  const formattedTime = cachedAt ? new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4 w-full sm:max-w-sm transition-all ${className}`}>
      {/* Offline / Stale Header */}
      {(isOfflineCache || weather.stale) && (
        <div className="flex items-center justify-between text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
          <span className="flex items-center gap-1 font-medium">
            <WifiOff className="w-3 h-3 shrink-0" />
            {t('weather.offline', 'Showing last available weather.')}
          </span>
          {formattedTime && <span className="opacity-80 font-mono">{formattedTime}</span>}
        </div>
      )}

      {/* Main Weather Card Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
              {Math.round(currentWeather?.temperature ?? 0)}°C
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {t(currWeatherInfo.translationKey)}
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate max-w-[200px]">
            {weather.farmName}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <CurrIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Basic Weather Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-1 pt-1">
          {alerts.map((alertKey, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{t(`weather.${alertKey}`)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Row: Humidity, Rain Prob, Wind */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border">
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 text-center">
          <Droplets className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{t('weather.humidity', 'Humidity')}</span>
          <span className="text-xs font-bold text-foreground mt-0.5">{currentWeather?.humidity ?? 0}%</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 text-center">
          <CloudRain className="w-4 h-4 text-sky-500 mb-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{t('weather.rainProb', 'Rain')}</span>
          <span className="text-xs font-bold text-foreground mt-0.5">{currentWeather?.precipitationProbability ?? 0}%</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 text-center">
          <Wind className="w-4 h-4 text-teal-500 mb-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{t('weather.wind', 'Wind')}</span>
          <span className="text-xs font-bold text-foreground mt-0.5">{Math.round(currentWeather?.windSpeed ?? 0)} <span className="text-[9px] font-normal">km/h</span></span>
        </div>
      </div>

      {/* Today High/Low */}
      {todayWeather && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {t('weather.today', 'Today')}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{Math.round(todayWeather.tempMax)}°</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{Math.round(todayWeather.tempMin)}°</span>
          </div>
        </div>
      )}

      {/* 7-Day Forecast Accordion Toggle */}
      {dailyForecast && dailyForecast.length > 0 && (
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForecast(!showForecast)}
            className="w-full flex justify-between items-center h-8 text-xs font-semibold text-primary hover:bg-primary/5 px-2"
          >
            <span>{t('weather.forecast', '7-Day Forecast')}</span>
            {showForecast ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

          {showForecast && (
            <div className="space-y-1.5 pt-2 mt-1 border-t border-border">
              {dailyForecast.map((day, idx) => {
                const dayInfo = getWeatherInfoByCode(day.weatherCode);
                const DayIcon = dayInfo.icon;
                const dateObj = new Date(day.date);
                const dayName = dateObj.toLocaleDateString(i18n.language, { weekday: 'short' });

                return (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 px-1.5 rounded-lg hover:bg-muted/50">
                    <span className="w-12 font-medium text-foreground capitalize">{dayName}</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DayIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[10px] w-14 truncate">{t(dayInfo.translationKey)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-semibold text-foreground">{Math.round(day.tempMax)}°</span>
                      <span className="text-muted-foreground/60">/</span>
                      <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
                    </div>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold w-7 text-right">
                      {day.precipitationProbabilityMax}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer Timestamp */}
      {!isOfflineCache && formattedTime && (
        <div className="flex justify-end text-[10px] text-muted-foreground opacity-75">
          {t('weather.updated', 'Updated')} {formattedTime}
        </div>
      )}
    </div>
  );
}
