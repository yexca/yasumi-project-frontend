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
import { queryArchiveRows } from "@/repositories/local-db/readModels";

export function ArchivePage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const rows = queryArchiveRows(data.items);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame description={t("page.archive.description")} title={t("nav.archive")}>
      <ItemSection
        areas={data.areas}
        empty={
          <EmptyState
            description={t("empty.archive.description")}
            title={t("empty.archive.title")}
          />
        }
        items={rows}
        onAction={handleAction}
        title={t("archive.section.recoverable")}
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
