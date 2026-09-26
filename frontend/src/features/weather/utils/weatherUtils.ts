import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning, type LucideIcon } from 'lucide-react';

export interface WeatherInfo {
  translationKey: string;
  icon: LucideIcon;
}

export function getWeatherInfoByCode(code?: number): WeatherInfo {
  if (code === undefined || code === null) {
    return { translationKey: 'weather.partlyCloudy', icon: CloudSun };
  }

  switch (code) {
    case 0:
      return { translationKey: 'weather.clearSky', icon: Sun };

    case 1:
    case 2:
      return { translationKey: 'weather.partlyCloudy', icon: CloudSun };

    case 3:
      return { translationKey: 'weather.cloudy', icon: Cloud };

    case 45:
    case 48:
      return { translationKey: 'weather.fog', icon: CloudFog };

    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { translationKey: 'weather.drizzle', icon: CloudDrizzle };

    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { translationKey: 'weather.rainy', icon: CloudRain };

    case 71:
    case 73:
    case 75:
    case 77:
      return { translationKey: 'weather.snow', icon: Snowflake };

    case 80:
    case 81:
    case 82:
      return { translationKey: 'weather.showers', icon: CloudRain };

    case 95:
    case 96:
    case 99:
      return { translationKey: 'weather.thunderstorm', icon: CloudLightning };

    default:
      return { translationKey: 'weather.partlyCloudy', icon: CloudSun };
  }
}
