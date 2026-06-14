import {
  ChevronDown,
  CloudSun,
  Languages,
  LogOut,
  Moon,
  Plus,
  RotateCw,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";

import { NAV_ITEMS, ROUTE_PATHS } from "@/app/router/routes";
import { IconButton } from "@/components/primitives/Button";
import { getDateOnlyInTimeZone } from "@/domain/time/dateOnly";
import { useAuth } from "@/features/auth/AuthProvider";
import { QuickAddDialog } from "@/features/items/ItemDialogs";
import {
  usePlanningData,
  usePlanningMutations,
  useSyncSnapshot,
  useSyncUiState,
} from "@/features/planning/usePlanningData";
import { flushLocalSync } from "@/features/sync/syncApi";
import { useTranslation } from "@/i18n/I18nProvider";
import { getDefaultLocale } from "@/i18n/messages";
import { useTheme } from "@/styles/ThemeProvider";
import { fetchWeather } from "@/features/weather/weatherApi";
import type { WeatherResponseDto } from "@/repositories/direct-api/dtos";

import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { logout, session, status } = useAuth();
  const { areas, settings, today } = usePlanningData();
  const { updateSettings } = usePlanningMutations();
  const syncSnapshot = useSyncSnapshot();
  const { resolvedMode, setThemeMode, themeMode } = useTheme();
  const syncState = useSyncUiState();
  const lastSyncAttemptKey = useRef("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherResponseDto | null>(null);
  const effectiveWeather = session?.accessToken && status !== "offline" ? weather : null;
  const effectiveSyncMode = status === "blocked" ? "blocked" : syncState.mode;
  const effectiveSyncLabel =
    status === "blocked"
      ? t("sync.authBlocked")
      : status === "offline"
        ? t("sync.offline")
        : t(syncState.labelKey);
  const quickAddDefault = useMemo(
    () =>
      pathname === ROUTE_PATHS.today
        ? { defaultItemType: "date_task" as const, defaultScheduledDate: today }
        : undefined,
    [pathname, today],
  );

  useEffect(() => {
    function openQuickAdd() {
      setQuickAddOpen(true);
    }

    window.addEventListener("yasumi:quick-add", openQuickAdd);
    return () => window.removeEventListener("yasumi:quick-add", openQuickAdd);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session?.accessToken || status !== "signed_in") {
      return;
    }
    if (syncSnapshot.pendingMutations.length === 0) {
      return;
    }

    const attemptKey = syncSnapshot.pendingMutations
      .map((mutation) => mutation.localMutationId)
      .join(":");
    if (attemptKey === lastSyncAttemptKey.current) {
      return;
    }
    lastSyncAttemptKey.current = attemptKey;

    let active = true;
    flushLocalSync(session.accessToken, syncSnapshot.deviceId)
      .then(() => {
        if (!active) {
          return;
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [session?.accessToken, status, syncSnapshot.deviceId, syncSnapshot.pendingMutations]);

  useEffect(() => {
    if (!session?.accessToken || !settings.weather_city.trim() || status === "offline") {
      return;
    }

    let active = true;
    fetchWeather(session.accessToken, settings.weather_city)
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
  }, [session?.accessToken, settings.weather_city, status]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label={t("shell.primaryNavigation")}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Y</span>
          <span>Yasumi</span>
        </div>
        <button className={styles.navQuickAdd} onClick={() => setQuickAddOpen(true)} type="button">
          <Plus aria-hidden="true" size={17} />
          <span>{t("quickAdd.button")}</span>
        </button>
        <nav className={styles.navList}>
          {NAV_ITEMS.map((item) =>
            item.path === ROUTE_PATHS.areas ? (
              <div className={styles.navGroup} key={item.path}>
                <div className={styles.navGroupRow}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive || pathname.startsWith("/areas")
                        ? `${styles.navLink} ${styles.activeNavLink}`
                        : styles.navLink
                    }
                    to={item.path}
                  >
                    <item.icon aria-hidden="true" size={18} strokeWidth={2} />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                  <button
                    aria-expanded={areasOpen}
                    aria-label={t("area.nav.toggle")}
                    className={styles.navGroupToggle}
                    onClick={() => setAreasOpen((open) => !open)}
                    type="button"
                  >
                    <ChevronDown aria-hidden="true" size={15} />
                  </button>
                </div>
                {areasOpen && areas.length > 0 ? (
                  <div className={styles.areaNavList}>
                    {areas.map((area) => (
                      <NavLink
                        className={styles.areaNavLink}
                        key={area.id}
                        to={`/areas/${area.id}`}
                      >
                        {area.name}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.activeNavLink}` : styles.navLink
                }
                key={item.path}
                to={item.path}
              >
                <item.icon aria-hidden="true" size={18} strokeWidth={2} />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ),
          )}
        </nav>
        <SyncStatus
          count={syncState.rejectedCount || syncState.pendingCount}
          label={effectiveSyncLabel}
          mode={effectiveSyncMode}
        />
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <p className={styles.dateContext}>
            {getDateOnlyInTimeZone(now, settings.time_zone)} ·{" "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className={styles.topActions}>
            {effectiveWeather ? (
              <span className={styles.weather} aria-label={t("weather.header.label")}>
                <CloudSun aria-hidden="true" size={16} />
                <span>
                  {effectiveWeather.city} {effectiveWeather.temperature}°{effectiveWeather.unit}
                </span>
              </span>
            ) : null}
            <SyncStatus
              compact
              count={syncState.rejectedCount || syncState.pendingCount}
              label={effectiveSyncLabel}
              mode={effectiveSyncMode}
            />
            <label className={styles.utilitySelect}>
              <Languages aria-hidden="true" size={16} />
              <span className="visually-hidden">{t("settings.language.label")}</span>
              <select
                aria-label={t("settings.language.label")}
                onChange={(event) => {
                  const language = event.target.value as typeof settings.language;
                  updateSettings({ language, locale: getDefaultLocale(language) });
                }}
                value={settings.language}
              >
                <option value="en">{t("settings.language.en")}</option>
                <option value="zh-Hans">{t("settings.language.zhHans")}</option>
                <option value="ja">{t("settings.language.ja")}</option>
              </select>
            </label>
            <IconButton
              aria-label={t("settings.theme.label")}
              icon={resolvedMode === "dark" ? <Moon size={17} /> : <Sun size={17} />}
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              tooltip={t("settings.theme.label")}
            />
            <button className={styles.userButton} type="button">
              {session?.user.display_name ?? session?.user.username}
            </button>
            <IconButton
              aria-label={t("auth.logout")}
              icon={<LogOut size={17} />}
              onClick={() => void logout()}
              tooltip={t("auth.logout")}
            />
          </div>
        </header>

        <main className={styles.content} tabIndex={-1}>
          {children}
        </main>
      </div>
      <button
        aria-label={t("quickAdd.button")}
        className={styles.mobileAddButton}
        onClick={() => setQuickAddOpen(true)}
        type="button"
      >
        <Plus aria-hidden="true" size={22} />
      </button>
      <QuickAddDialog
        defaultCapture={quickAddDefault}
        onOpenChange={setQuickAddOpen}
        open={quickAddOpen}
      />
    </div>
  );
}

type SyncStatusProps = {
  compact?: boolean;
  count: number;
  label: string;
  mode: string;
};

function SyncStatus({ compact = false, count, label, mode }: SyncStatusProps) {
  const icon =
    mode === "synced" ? (
      <Wifi aria-hidden="true" size={16} />
    ) : mode === "pending" ? (
      <RotateCw aria-hidden="true" size={16} />
    ) : (
      <WifiOff aria-hidden="true" size={16} />
    );

  return (
    <button
      className={compact ? styles.syncStatusCompact : styles.syncStatus}
      data-sync-mode={mode}
      type="button"
    >
      {icon}
      <span>{count > 0 ? `${label} (${count})` : label}</span>
    </button>
  );
}
