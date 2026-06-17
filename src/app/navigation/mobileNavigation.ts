import { useMemo, useSyncExternalStore } from "react";

import { NAV_ITEMS, ROUTE_PATHS, type NavItem } from "@/app/router/routes";

export type MobileNavPath = (typeof NAV_ITEMS)[number]["path"];

const STORAGE_KEY = "yasumi:mobile-nav-slots";
const STORAGE_EVENT = "yasumi:mobile-nav-slots-updated";
const DEFAULT_SLOTS: MobileNavPath[] = [ROUTE_PATHS.today, ROUTE_PATHS.inbox, ROUTE_PATHS.upcoming];
const VALID_PATHS = new Set<MobileNavPath>(NAV_ITEMS.map((item) => item.path));
const DEFAULT_SLOTS_SERIALIZED = JSON.stringify(DEFAULT_SLOTS);

let cachedSlots = DEFAULT_SLOTS;
let cachedSerializedSlots = DEFAULT_SLOTS_SERIALIZED;

export function useMobileNavSlots() {
  const slots = useSyncExternalStore(
    subscribeToMobileNavSlots,
    readMobileNavSlots,
    () => DEFAULT_SLOTS,
  );

  const mobileNavItems = useMemo(
    () =>
      slots
        .map((path) => NAV_ITEMS.find((item) => item.path === path))
        .filter((item): item is NavItem => item !== undefined),
    [slots],
  );

  const moreNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !slots.includes(item.path)),
    [slots],
  );

  function updateSlot(index: number, path: MobileNavPath) {
    const next = [...slots];
    next[index] = path;
    persistMobileNavSlots(normalizeMobileNavSlots(next));
  }

  function resetSlots() {
    persistMobileNavSlots(DEFAULT_SLOTS);
  }

  return {
    mobileNavItems,
    moreNavItems,
    resetSlots,
    slots,
    updateSlot,
  };
}

function subscribeToMobileNavSlots(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== localStorage) {
      return;
    }

    if (event.key !== null && event.key !== STORAGE_KEY) {
      return;
    }

    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

export function getMobileNavSlotOptions(slotIndex: number, slots: MobileNavPath[]) {
  const current = slots[slotIndex];
  const selected = new Set(slots.filter((_, index) => index !== slotIndex));

  return NAV_ITEMS.filter((item) => !selected.has(item.path) || item.path === current);
}

function readMobileNavSlots(): MobileNavPath[] {
  const slots = readMobileNavSlotsSnapshot();
  const serialized = JSON.stringify(slots);

  if (serialized === cachedSerializedSlots) {
    return cachedSlots;
  }

  cachedSlots = slots;
  cachedSerializedSlots = serialized;
  return slots;
}

function persistMobileNavSlots(slots: MobileNavPath[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

function normalizeMobileNavSlots(value: unknown[]): MobileNavPath[] {
  const next = value.filter(
    (entry): entry is MobileNavPath => typeof entry === "string" && VALID_PATHS.has(entry as MobileNavPath),
  );
  const unique: MobileNavPath[] = [];

  for (const path of next) {
    if (!unique.includes(path)) {
      unique.push(path);
    }
  }

  if (unique.length !== 3) {
    return DEFAULT_SLOTS;
  }

  return unique;
}

function readMobileNavSlotsSnapshot(): MobileNavPath[] {
  if (typeof localStorage === "undefined") {
    return DEFAULT_SLOTS;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return DEFAULT_SLOTS;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return DEFAULT_SLOTS;
    }

    return normalizeMobileNavSlots(parsed);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SLOTS;
  }
}
