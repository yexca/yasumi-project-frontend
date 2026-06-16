const DEVICE_ID_STORAGE_KEY = "yasumi:device-id";
const FALLBACK_DEVICE_ID = "fixture-device";

export function getOrCreateSyncDeviceId(): string {
  if (typeof localStorage === "undefined") {
    return FALLBACK_DEVICE_ID;
  }

  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const deviceId = createId("device");
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
