import { useEffect, useMemo, useState } from "react";

import { NAV_ITEMS, ROUTE_PATHS, type NavItem } from "@/app/router/routes";

export type MobileNavPath = (typeof NAV_ITEMS)[number]["path"];

const STORAGE_KEY = "yasumi:mobile-nav-slots";
const DEFAULT_SLOTS: MobileNavPath[] = [ROUTE_PATHS.today, ROUTE_PATHS.inbox, ROUTE_PATHS.upcoming];
const VALID_PATHS = new Set<MobileNavPath>(NAV_ITEMS.map((item) => item.path));

export function useMobileNavSlots() {
  const [slots, setSlots] = useState<MobileNavPath[]>(readMobileNavSlots);

  useEffect(() => {
    function syncFromStorage() {
      setSlots(readMobileNavSlots());
    }

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

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
    setSlots((current) => {
      const next = [...current];
      next[index] = path;
      const normalized = normalizeMobileNavSlots(next);
      persistMobileNavSlots(normalized);
      return normalized;
    });
  }

  function resetSlots() {
    persistMobileNavSlots(DEFAULT_SLOTS);
    setSlots(DEFAULT_SLOTS);
  }

  return {
    mobileNavItems,
    moreNavItems,
    resetSlots,
    slots,
    updateSlot,
  };
}

export function getMobileNavSlotOptions(slotIndex: number, slots: MobileNavPath[]) {
  const current = slots[slotIndex];
  const selected = new Set(slots.filter((_, index) => index !== slotIndex));

  return NAV_ITEMS.filter((item) => !selected.has(item.path) || item.path === current);
}

function readMobileNavSlots(): MobileNavPath[] {
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

function persistMobileNavSlots(slots: MobileNavPath[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
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
