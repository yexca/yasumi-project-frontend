import { ChevronDown, Plus, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";

import { NAV_ITEMS, ROUTE_PATHS } from "@/app/router/routes";
import { QuickAddDialog } from "@/features/items/ItemDialogs";
import { usePlanningData, useSyncUiState } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";

import styles from "./AppShell.module.css";

export function AppShell() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { areas } = usePlanningData();
  const syncState = useSyncUiState();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(true);
  const pageTitleKey =
    NAV_ITEMS.find((item) => item.path !== ROUTE_PATHS.areas && pathname.startsWith(item.path))
      ?.labelKey ?? (pathname.startsWith(ROUTE_PATHS.areas) ? "nav.areas" : "nav.today");

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
          label={t(syncState.labelKey)}
          mode={syncState.mode}
        />
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div>
            <p className={styles.dateContext}>{formatDateOnly(new Date())}</p>
            <h1>{t(pageTitleKey)}</h1>
          </div>
          <div className={styles.topActions}>
            <SyncStatus
              compact
              count={syncState.rejectedCount || syncState.pendingCount}
              label={t(syncState.labelKey)}
              mode={syncState.mode}
            />
            <button
              className={styles.quickAddButton}
              onClick={() => setQuickAddOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              <span>{t("quickAdd.button")}</span>
            </button>
          </div>
        </header>

        <main className={styles.content} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <QuickAddDialog onOpenChange={setQuickAddOpen} open={quickAddOpen} />
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
  return (
    <button
      className={compact ? styles.syncStatusCompact : styles.syncStatus}
      data-sync-mode={mode}
      type="button"
    >
      <WifiOff aria-hidden="true" size={16} />
      <span>{count > 0 ? `${label} (${count})` : label}</span>
    </button>
  );
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
