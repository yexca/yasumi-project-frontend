import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, IconButton } from "@/components/primitives/Button";
import { AreaDeleteDialog, ItemFlowDialog } from "@/features/items/ItemDialogs";
import {
  EmptyState,
  ItemSection,
  PageFrame,
  type ItemActionHandler,
} from "@/features/items/ItemList";
import type { ItemAction } from "@/features/items/itemPresentation";
import { usePlanningData } from "@/features/planning/usePlanningData";
import type { AreaDto, LocalItemRow } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";
import { queryAreaItemRows, queryAreaRows } from "@/repositories/local-db/readModels";

import styles from "./AreasPage.module.css";

export function AreasPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const areas = queryAreaRows(data.areas);
  const [deleteArea, setDeleteArea] = useState<AreaDto | null>(null);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame
      actions={
        <Button icon={<Plus aria-hidden="true" size={16} />}>{t("area.action.create")}</Button>
      }
      description={t("page.areas.description")}
      title={t("nav.areas")}
    >
      {areas.length > 0 ? (
        <div className={styles.areaStack}>
          {areas.map((area) => {
            const rows = queryAreaItemRows(data.items, area.id);
            const completedCount = data.items.filter(
              (item) => item.area_id === area.id && item.status === "completed",
            ).length;

            return (
              <section className={styles.areaGroup} key={area.id}>
                <header className={styles.areaHeader}>
                  <div>
                    <h3>{area.name}</h3>
                    <p>{t("area.itemCount", { count: rows.length })}</p>
                  </div>
                  <IconButton
                    aria-label={t("area.action.delete")}
                    icon={<Trash2 aria-hidden="true" size={16} />}
                    onClick={() => setDeleteArea(area)}
                    tooltip={t("area.action.delete")}
                    variant="quiet"
                  />
                </header>
                <ItemSection
                  areas={data.areas}
                  items={rows}
                  onAction={handleAction}
                  title={t("area.section.items")}
                />
                <AreaDeleteDialog
                  activeCount={rows.length}
                  areaName={area.name}
                  completedCount={completedCount}
                  onOpenChange={(open) => {
                    if (!open) {
                      setDeleteArea(null);
                    }
                  }}
                  open={deleteArea?.id === area.id}
                />
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          actionLabel={t("area.action.create")}
          description={t("empty.areas.description")}
          title={t("empty.areas.title")}
        />
      )}
      <ItemFlowDialog
        action={activeFlow?.action ?? null}
        areas={data.areas}
        item={activeFlow?.item ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveFlow(null);
          }
        }}
        open={activeFlow !== null}
      />
    </PageFrame>
  );
}
