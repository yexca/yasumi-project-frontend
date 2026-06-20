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
import { queryIdeaRows } from "@/repositories/local-db/readModels";
import { openQuickAdd } from "@/features/items/openQuickAdd";
import { InlineQuickAdd } from "@/features/items/InlineQuickAdd";

export function IdeaPoolPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const rows = queryIdeaRows(data.items);
  const ready = rows.filter((item) => item.review_date !== null && item.review_date <= data.today);
  const later = rows.filter((item) => item.review_date !== null && item.review_date > data.today);
  const unscheduled = rows.filter((item) => item.review_date === null);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame
      areas={data.areas}
      description={t("page.ideas.description")}
      itemsForDetail={rows}
      title={t("nav.ideas")}
    >
      <InlineQuickAdd
        areas={data.areas}
        defaultCapture={{ taskType: "idea", preserveTaskType: true }}
      />
      {rows.length > 0 ? (
        <>
          <ItemSection
            areas={data.areas}
            items={ready}
            onAction={handleAction}
            title={t("ideas.section.ready")}
          />
          <ItemSection
            areas={data.areas}
            items={later}
            onAction={handleAction}
            title={t("ideas.section.later")}
          />
          <ItemSection
            areas={data.areas}
            items={unscheduled}
            onAction={handleAction}
            title={t("ideas.section.noReviewDate")}
          />
        </>
      ) : (
        <EmptyState
          actionLabel={t("quickAdd.button")}
          description={t("empty.ideas.description")}
          onAction={() => openQuickAdd({ taskType: "idea" })}
          title={t("empty.ideas.title")}
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
