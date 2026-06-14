import { useState } from "react";

import { ItemFlowDialog } from "@/features/items/ItemDialogs";
import {
  EmptyState,
  ItemSection,
  PageFrame,
  type ItemActionHandler,
} from "@/features/items/ItemList";
import type { ItemAction } from "@/features/items/itemPresentation";
import { usePlanningData } from "@/features/planning/usePlanningData";
import type { LocalItemRow } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";
import { queryDeadlineRows } from "@/repositories/local-db/readModels";

export function DeadlinesPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const rows = queryDeadlineRows(data.items);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame
      areas={data.areas}
      description={t("page.deadlines.description")}
      itemsForDetail={rows}
      title={t("nav.deadlines")}
    >
      <ItemSection
        areas={data.areas}
        empty={
          <EmptyState
            actionLabel={t("quickAdd.button")}
            description={t("empty.deadlines.description")}
            onAction={() => window.dispatchEvent(new CustomEvent("yasumi:quick-add"))}
            title={t("empty.deadlines.title")}
          />
        }
        items={rows}
        onAction={handleAction}
        title={t("deadlines.section.active")}
      />
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
