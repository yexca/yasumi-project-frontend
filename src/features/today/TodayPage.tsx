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
import { buildTodayViewModel } from "@/repositories/local-db/readModels";
import type { LocalItemRow } from "@/domain/items/schemas";

export function TodayPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const today = buildTodayViewModel({
    date: data.today,
    items: data.items,
    operationHistory: data.operationHistory,
    settings: data.settings,
    timeZone: data.settings.time_zone,
  });
  const itemsById = new Map(data.items.map((item) => [item.id, item]));
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });
  const visibleSections = today.sections
    .map((section) => ({
      ...section,
      items: section.itemIds
        .map((itemId) => itemsById.get(itemId))
        .filter((item): item is LocalItemRow => item !== undefined),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <PageFrame
      areas={data.areas}
      description={t("page.today.description")}
      itemsForDetail={visibleSections.flatMap((section) => section.items)}
      title={t("nav.today")}
    >
      {visibleSections.length > 0 ? (
        visibleSections.map((section) => (
          <ItemSection
            areas={data.areas}
            items={section.items}
            key={section.id}
            onAction={handleAction}
            reasonsByItemId={
              section.id === "primaryRecommendations" ? section.reasonsByItemId : undefined
            }
            state={section.id === "primaryRecommendations" ? "recommended" : undefined}
            title={t(`today.section.${section.id}`)}
          />
        ))
      ) : (
        <EmptyState
          actionLabel={t("quickAdd.button")}
          description={t("empty.today.description")}
          onAction={() => window.dispatchEvent(new CustomEvent("yasumi:quick-add"))}
          title={t("empty.today.title")}
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
