import { Plus, WifiOff } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";

import { NAV_ITEMS, ROUTE_PATHS } from "@/app/router/routes";
import { useTranslation } from "@/i18n/I18nProvider";
import { usePowerSyncPlaceholder } from "@/repositories/powersync/PowerSyncPlaceholderProvider";

import styles from "./AppShell.module.css";

export function AppShell() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const syncState = usePowerSyncPlaceholder();
  const pageTitleKey =
    NAV_ITEMS.find((item) => item.path !== ROUTE_PATHS.areas && pathname.startsWith(item.path))
      ?.labelKey ?? (pathname.startsWith(ROUTE_PATHS.areas) ? "nav.areas" : "nav.today");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label={t("shell.primaryNavigation")}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Y</span>
          <span>Yasumi</span>
        </div>
        <nav className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive || (item.path === ROUTE_PATHS.areas && pathname.startsWith("/areas"))
                  ? `${styles.navLink} ${styles.activeNavLink}`
                  : styles.navLink
              }
              key={item.path}
              to={item.path}
            >
              <item.icon aria-hidden="true" size={18} strokeWidth={2} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <SyncStatus label={t(syncState.labelKey)} />
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div>
            <p className={styles.dateContext}>{formatDateOnly(new Date())}</p>
            <h1>{t(pageTitleKey)}</h1>
          </div>
          <div className={styles.topActions}>
            <SyncStatus compact label={t(syncState.labelKey)} />
            <button className={styles.quickAddButton} type="button">
              <Plus aria-hidden="true" size={18} />
              <span>{t("quickAdd.button")}</span>
            </button>
          </div>
        </header>

        <main className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

type SyncStatusProps = {
  compact?: boolean;
  label: string;
};

function SyncStatus({ compact = false, label }: SyncStatusProps) {
  return (
    <button className={compact ? styles.syncStatusCompact : styles.syncStatus} type="button">
      <WifiOff aria-hidden="true" size={16} />
      <span>{compact ? label : label}</span>
    </button>
  );
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
