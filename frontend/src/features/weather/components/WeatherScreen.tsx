import { useTranslation } from 'react-i18next';
import { useFarmStore } from '@/store/farmStore';
import { useFarmWeather } from '../api/weatherApi';
import { getWeatherInfoByCode } from '../utils/weatherUtils';
import { format, parseISO } from 'date-fns';
import { 
  CloudRain, 
  MapPinOff, 
  RefreshCw, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WeatherScreen() {
  const { t } = useTranslation(['weather', 'common']);
  const { activeFarmId } = useFarmStore();

  const { data, isLoading, isError, error, refetch, isFetching } = useFarmWeather(activeFarmId);

  if (!activeFarmId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground p-8">
        <CloudRain className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg">Please select a farm to view weather information.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 sf-fade-in h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-muted animate-pulse rounded w-64" />
          <div className="h-10 bg-muted animate-pulse rounded w-24" />
        </div>
        <div className="h-48 bg-muted animate-pulse rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error/Empty state when no data and API failed
  const errorCode = (error as any)?.response?.data?.error?.code || (error as any)?.message;
  if (isError && !data) {
    if (errorCode === 'WEATHER_LOCATION_UNAVAILABLE') {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center max-w-md mx-auto">
          <MapPinOff className="w-16 h-16 mb-4 text-amber-500 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Location Not Set</h2>
          <p className="text-muted-foreground mb-6">
            The selected farm does not have a valid location set. Weather data cannot be fetched without GPS coordinates.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-16 h-16 mb-4 text-destructive opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Weather Unavailable</h2>
        <p className="text-muted-foreground mb-6">
          Failed to load weather data. Please try again later.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const currentInfo = getWeatherInfoByCode(data.currentWeather.weatherCode);

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 sf-fade-in h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudRain className="w-6 h-6 text-primary" />
            7-Day Farm Weather
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            {data.farmName}
            {data.stale && (
              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-medium border border-amber-500/20">
                Offline Mode (Cached)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Updated {format(parseISO(data.cachedAt), 'h:mm a')}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Weather Main Card */}
        <div className="md:col-span-2 bg-[#56BBED] text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] opacity-20 pointer-events-none transform scale-150">
            <currentInfo.icon className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-medium opacity-90 mb-2">Current Weather</h2>
            <div className="flex items-end gap-4 mb-2">
              <span className="text-7xl font-bold tracking-tighter">
                {Math.round(data.currentWeather.temperature)}°
              </span>
              <div className="mb-2 text-xl font-medium opacity-90">
                {t(currentInfo.translationKey)}
              </div>
            </div>
            <div className="text-sm opacity-80 flex gap-4">
              <span>H: {Math.round(data.todayWeather.tempMax)}°</span>
              <span>L: {Math.round(data.todayWeather.tempMin)}°</span>
            </div>
          </div>
        </div>

        {/* Current Weather Details */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm grid grid-cols-2 gap-4 place-content-center">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 text-center">
            <Thermometer className="w-6 h-6 mb-2 text-primary/70" />
            <span className="text-sm text-muted-foreground">Feels Like</span>
            <span className="font-semibold text-lg">{Math.round(data.currentWeather.apparentTemperature)}°</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 text-center">
            <Droplets className="w-6 h-6 mb-2 text-blue-500/70" />
            <span className="text-sm text-muted-foreground">Humidity</span>
            <span className="font-semibold text-lg">{data.currentWeather.humidity}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 text-center">
            <CloudRain className="w-6 h-6 mb-2 text-indigo-500/70" />
            <span className="text-sm text-muted-foreground">Rain Prob.</span>
            <span className="font-semibold text-lg">{data.currentWeather.precipitationProbability}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/50 text-center">
            <Wind className="w-6 h-6 mb-2 text-slate-500/70" />
            <span className="text-sm text-muted-foreground">Wind</span>
            <span className="font-semibold text-lg">{Math.round(data.currentWeather.windSpeed)} km/h</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">7-Day Forecast</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {data.dailyForecast.map((day, idx) => {
          const info = getWeatherInfoByCode(day.weatherCode);
          const isToday = idx === 0;
          const dayName = isToday ? 'Today' : format(parseISO(day.date), 'EEE');
          
          return (
            <div 
              key={day.date} 
              className={`flex flex-col items-center p-4 rounded-2xl border ${isToday ? 'bg-[#56BBED]/10 border-[#56BBED]/30' : 'bg-card border-border'} shadow-sm`}
            >
              <span className={`font-semibold mb-1 ${isToday ? 'text-[#56BBED]' : ''}`}>{dayName}</span>
              <span className="text-xs text-muted-foreground mb-3">{format(parseISO(day.date), 'MMM d')}</span>
              
              <info.icon className="w-10 h-10 mb-3 text-[#56BBED]" />
              
              <div className="flex items-center gap-3 text-sm font-medium w-full justify-center">
                <span>{Math.round(day.tempMax)}°</span>
                <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
              </div>
              
              {day.precipitationProbabilityMax > 10 && (
                <div className="mt-2 text-xs text-blue-500 font-medium flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {day.precipitationProbabilityMax}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
