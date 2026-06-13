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
import { useTranslation } from "@/i18n/I18nProvider";
import { queryInboxRows } from "@/repositories/local-db/readModels";
import type { LocalItemRow } from "@/domain/items/schemas";

export function InboxPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const rows = queryInboxRows(data.items);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame description={t("page.inbox.description")} title={t("nav.inbox")}>
      <ItemSection
        areas={data.areas}
        empty={
          <EmptyState
            actionLabel={t("quickAdd.button")}
            description={t("empty.inbox.description")}
            onAction={() => window.dispatchEvent(new CustomEvent("yasumi:quick-add"))}
            title={t("empty.inbox.title")}
          />
        }
        items={rows}
        onAction={handleAction}
        title={t("inbox.section.captures")}
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
