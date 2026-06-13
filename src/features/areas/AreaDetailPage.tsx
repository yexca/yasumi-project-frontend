import { useState } from "react";
import { useParams } from "react-router";

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
import { queryAreaItemRows } from "@/repositories/local-db/readModels";

export function AreaDetailPage() {
  const { areaId } = useParams();
  const { t } = useTranslation();
  const data = usePlanningData();
  const area = data.areas.find((candidate) => candidate.id === areaId);
  const rows = areaId ? queryAreaItemRows(data.items, areaId) : [];
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame
      description={t("page.areaDetail.description", { areaId: area?.name ?? areaId ?? "" })}
      title={area?.name ?? t("nav.areas")}
    >
      <ItemSection
        areas={data.areas}
        empty={
          <EmptyState
            description={t("empty.areaDetail.description")}
            title={t("empty.areaDetail.title")}
          />
        }
        items={rows}
        onAction={handleAction}
        title={t("area.section.items")}
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
