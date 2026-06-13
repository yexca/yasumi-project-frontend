const DEFAULT_BACKEND_URL = "http://127.0.0.1:7655";
const DEFAULT_POWERSYNC_URL = "http://127.0.0.1:8081";

export function getBackendBaseUrl(): string {
  const configured = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined;
  return trimTrailingSlash(configured ?? DEFAULT_BACKEND_URL);
}

export function getPowerSyncEndpoint(): string {
  const configured = import.meta.env.VITE_POWERSYNC_ENDPOINT as string | undefined;
  return trimTrailingSlash(configured ?? DEFAULT_POWERSYNC_URL);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
