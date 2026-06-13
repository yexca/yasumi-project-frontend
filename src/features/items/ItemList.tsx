import { useMemo, type ReactNode } from "react";

import { DenseItemRow, type DenseItemRowState } from "@/components/items/DenseItemRow";
import { Button } from "@/components/primitives/Button";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import type { TodayReasonKey } from "@/domain/constants/shared";
import type { AreaDto, LocalItemRow } from "@/domain/items/schemas";
import { usePlanningMutations } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";

import { ItemOverflowActions } from "./ItemActions";
import {
  getDeadlineLabel,
  getItemDateLabel,
  getPrimaryAction,
  getPrimaryActionIcon,
  getStateKey,
  getTypeMarker,
  reasonKeyToMessageKey,
  type ItemAction,
} from "./itemPresentation";
import styles from "./ItemList.module.css";

export type ItemActionHandler = (action: ItemAction, item: LocalItemRow) => void;

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, description, onAction, title }: EmptyStateProps) {
  return (
    <section className={styles.emptyState}>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}

type PageFrameProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
};

export function PageFrame({ actions, children, description, title }: PageFrameProps) {
  return (
    <ContentColumn>
      <PageHeader actions={actions} description={description} title={title} />
      {children}
    </ContentColumn>
  );
}

type ItemSectionProps = {
  areas: AreaDto[];
  empty?: React.ReactNode;
  items: LocalItemRow[];
  onAction: ItemActionHandler;
  reasonsByItemId?: Record<string, TodayReasonKey[]>;
  state?: DenseItemRowState;
  title: string;
};

export function ItemSection({
  areas,
  empty,
  items,
  onAction,
  reasonsByItemId = {},
  state,
  title,
}: ItemSectionProps) {
  if (items.length === 0) {
    return empty ?? null;
  }

  return (
    <section className={styles.section}>
      <SectionHeader count={items.length} title={title} />
      <div className={styles.list}>
        {items.map((item) => (
          <PlanningItemRow
            areas={areas}
            item={item}
            key={item.id}
            onAction={onAction}
            reasons={reasonsByItemId[item.id]}
            state={state}
          />
        ))}
      </div>
    </section>
  );
}

type PlanningItemRowProps = {
  areas: AreaDto[];
  item: LocalItemRow;
  onAction: ItemActionHandler;
  reasons?: TodayReasonKey[];
  state?: DenseItemRowState;
};

export function PlanningItemRow({ areas, item, onAction, reasons, state }: PlanningItemRowProps) {
  const { t } = useTranslation();
  const { getItemSyncState } = usePlanningMutations();
  const areaName = useMemo(
    () => areas.find((area) => area.id === item.area_id)?.name,
    [areas, item.area_id],
  );
  const primary = getPrimaryAction(item);
  const primaryLabel = t(primary.labelKey);
  const stateKey = getStateKey(item.status);
  const syncState = getItemSyncState(item.id);
  const rowState = syncState ?? state ?? itemStatusToRowState(item);
  const date = buildDateMetadata(item, t);

  return (
    <DenseItemRow
      actions={<ItemOverflowActions item={item} onAction={onAction} />}
      area={areaName}
      date={date}
      leading={getTypeMarker(item.item_type)}
      moreActionLabel={t("item.action.more")}
      onPrimaryAction={() => onAction(primary, item)}
      primaryActionLabel={primaryLabel}
      primaryIcon={getPrimaryActionIcon(primary.id)}
      reasons={reasons?.map((reason) => t(reasonKeyToMessageKey(reason)))}
      state={rowState}
      stateLabel={
        syncState === "pending"
          ? t("sync.itemPending")
          : syncState === "rejected"
            ? t("sync.itemRejected")
            : stateKey
              ? t(stateKey)
              : undefined
      }
      title={item.title}
    />
  );
}

function itemStatusToRowState(item: LocalItemRow): DenseItemRowState {
  if (item.deleted_at !== null || item.archived_at !== null) {
    return "archived";
  }

  if (item.status === "completed") {
    return "completed";
  }

  if (item.status === "on_hold") {
    return "held";
  }

  if (item.status === "abandoned") {
    return "archived";
  }

  return "normal";
}

function buildDateMetadata(item: LocalItemRow, t: (key: string) => string): string | undefined {
  const deadline = getDeadlineLabel(item);
  const date = getItemDateLabel(item);

  if (deadline !== null && item.planned_work_date !== null) {
    return `${t("item.meta.work")} ${item.planned_work_date} · ${t("item.meta.deadline")} ${deadline}`;
  }

  if (deadline !== null) {
    return `${t("item.meta.deadline")} ${deadline}`;
  }

  return date ?? undefined;
}
