import { directApiJson } from "@/repositories/direct-api/client";
import { parseWeatherResponseDto, type WeatherResponseDto } from "@/repositories/direct-api/dtos";

export function fetchWeather(accessToken: string, city: string): Promise<WeatherResponseDto> {
  return directApiJson(`/weather?city=${encodeURIComponent(city)}`, {
    accessToken,
    parse: parseWeatherResponseDto,
  });
}
