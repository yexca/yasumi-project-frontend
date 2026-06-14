import { CalendarClock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/primitives/Button";
import { ItemFlowDialog, RecurringTemplateDialog } from "@/features/items/ItemDialogs";
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
import { queryUpcomingRows } from "@/repositories/local-db/readModels";

export function UpcomingPage() {
  const { t } = useTranslation();
  const data = usePlanningData();
  const rows = queryUpcomingRows(data.items, data.today);
  const groups = groupByPlanningDate(rows);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [activeFlow, setActiveFlow] = useState<{
    action: ItemAction;
    item: LocalItemRow;
  } | null>(null);
  const handleAction: ItemActionHandler = (action, item) => setActiveFlow({ action, item });

  return (
    <PageFrame
      actions={
        <Button
          icon={<CalendarClock aria-hidden="true" size={16} />}
          onClick={() => setRecurringOpen(true)}
        >
          {t("recurrence.list.title")}
        </Button>
      }
      areas={data.areas}
      description={t("page.upcoming.description")}
      itemsForDetail={rows}
      title={t("nav.upcoming")}
    >
      {groups.length > 0 ? (
        groups.map(([date, items]) => (
          <ItemSection
            areas={data.areas}
            items={items}
            key={date}
            onAction={handleAction}
            title={date}
          />
        ))
      ) : (
        <EmptyState
          actionLabel={t("quickAdd.button")}
          description={t("empty.upcoming.description")}
          onAction={() => window.dispatchEvent(new CustomEvent("yasumi:quick-add"))}
          title={t("empty.upcoming.title")}
        />
      )}
      <RecurringTemplateDialog
        onOpenChange={setRecurringOpen}
        open={recurringOpen}
        templates={data.recurringTemplates}
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

function groupByPlanningDate(rows: LocalItemRow[]): [string, LocalItemRow[]][] {
  const groups = new Map<string, LocalItemRow[]>();

  for (const row of rows) {
    const date = row.item_type === "date_task" ? row.scheduled_date : row.planned_work_date;

    if (date === null) {
      continue;
    }

    groups.set(date, [...(groups.get(date) ?? []), row]);
  }

  return Array.from(groups.entries());
}
