import {
  ChevronDown,
  CloudSun,
  Ellipsis,
  Languages,
  LogOut,
  Moon,
  Plus,
  RotateCw,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";

import { useMobileNavSlots } from "@/app/navigation/mobileNavigation";
import { NAV_ITEMS, ROUTE_PATHS } from "@/app/router/routes";
import { IconButton } from "@/components/primitives/Button";
import { Menu, MenuItem } from "@/components/primitives/Menu";
import { getDateOnlyInTimeZone } from "@/domain/time/dateOnly";
import { useAuth } from "@/features/auth/AuthProvider";
import { QuickAddDialog } from "@/features/items/ItemDialogs";
import { usePlanningData, usePlanningMutations } from "@/features/planning/PlanningDataProvider";
import { useSyncStatus } from "@/features/sync/useSyncStatus";
import { useTranslation } from "@/i18n/I18nProvider";
import { getDefaultLocale } from "@/i18n/messages";
import { useTheme } from "@/styles/ThemeProvider";

import styles from "./AppShell.module.css";
import { useShellClock } from "./useShellClock";
import { useWeatherSummary } from "./useWeatherSummary";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout, session, status } = useAuth();
  const { areas, settings, today } = usePlanningData();
  const { updateSettings } = usePlanningMutations();
  const { resolvedMode, setThemeMode, themeMode } = useTheme();
  const syncStatus = useSyncStatus();
  const [areasOpen, setAreasOpen] = useState(true);
  const now = useShellClock();
  const weather = useWeatherSummary({
    accessToken: session?.accessToken ?? null,
    enabled: Boolean(session?.accessToken && status !== "offline"),
    weatherCity: settings.weather_city,
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { mobileNavItems, moreNavItems } = useMobileNavSlots();
  const isTodayRoute = pathname === ROUTE_PATHS.today;

  useEffect(() => {
    function openQuickAdd() {
      setQuickAddOpen(true);
    }

    window.addEventListener("yasumi:quick-add", openQuickAdd);
    return () => window.removeEventListener("yasumi:quick-add", openQuickAdd);
  }, []);

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
        <SyncStatus count={syncStatus.count} label={syncStatus.label} mode={syncStatus.mode} />
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.topMeta}>
            <p className={styles.dateContext}>
              {getDateOnlyInTimeZone(now, settings.time_zone)} ·{" "}
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
            {weather ? (
              <span className={styles.weather} aria-label={t("weather.header.label")}>
                <CloudSun aria-hidden="true" size={16} />
                <span>
                  {weather.city} {weather.temperature}°{weather.unit}
                </span>
              </span>
            ) : null}
          </div>
          <div className={styles.topActions}>
            <SyncStatus
              compact
              count={syncStatus.count}
              label={syncStatus.label}
              mode={syncStatus.mode}
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

      <nav className={styles.mobileNav} aria-label={t("shell.mobileNavigation")}>
        {mobileNavItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              item.path === ROUTE_PATHS.areas
                ? pathname.startsWith("/areas")
                  ? `${styles.mobileNavLink} ${styles.activeMobileNavLink}`
                  : styles.mobileNavLink
                : isActive
                  ? `${styles.mobileNavLink} ${styles.activeMobileNavLink}`
                  : styles.mobileNavLink
            }
            key={item.path}
            to={item.path}
          >
            <item.icon aria-hidden="true" size={18} strokeWidth={2} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
        <Menu
          trigger={
            <button className={styles.mobileNavLink} type="button">
              <Ellipsis aria-hidden="true" size={18} strokeWidth={2} />
              <span>{t("nav.more")}</span>
            </button>
          }
        >
          {moreNavItems.map((item) => (
            <MenuItem
              key={item.path}
              onSelect={() => {
                void navigate(item.path);
              }}
            >
              <span
                className={
                  item.path === ROUTE_PATHS.areas
                    ? pathname.startsWith("/areas")
                      ? styles.mobileMoreLinkActive
                      : styles.mobileMoreLink
                    : pathname === item.path
                      ? styles.mobileMoreLinkActive
                      : styles.mobileMoreLink
                }
              >
                <item.icon aria-hidden="true" size={16} />
                <span>{t(item.labelKey)}</span>
              </span>
            </MenuItem>
          ))}
        </Menu>
      </nav>

      <button
        aria-label={t("quickAdd.button")}
        className={styles.mobileQuickAdd}
        onClick={() => setQuickAddOpen(true)}
        type="button"
      >
        <Plus aria-hidden="true" size={22} />
        <span className="visually-hidden">{t("quickAdd.button")}</span>
      </button>

      {quickAddOpen ? (
        <QuickAddDialog
          defaultCapture={
            isTodayRoute ? { defaultItemType: "date_task", defaultScheduledDate: today } : undefined
          }
          onOpenChange={setQuickAddOpen}
          open={quickAddOpen}
        />
      ) : null}
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
