import { useEffect, useState } from "react";

import type { WeatherResponseDto } from "@/repositories/direct-api/dtos";

type UseWeatherSummaryInput = {
  accessToken: string | null;
  enabled: boolean;
  weatherCity: string;
};

export function useWeatherSummary({
  accessToken,
  enabled,
  weatherCity,
}: UseWeatherSummaryInput): WeatherResponseDto | null {
  const [weather, setWeather] = useState<WeatherResponseDto | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken || !weatherCity.trim()) {
      return;
    }

    let active = true;

    import("@/features/weather/weatherApi")
      .then(({ fetchWeather }) => fetchWeather(accessToken, weatherCity))
      .then((nextWeather) => {
        if (active) {
          setWeather(nextWeather);
        }
      })
      .catch(() => {
        if (active) {
          setWeather(null);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, enabled, weatherCity]);

  return enabled ? weather : null;
}
