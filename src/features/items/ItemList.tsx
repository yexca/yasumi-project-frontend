import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DenseItemRow, type DenseItemRowState } from "@/components/items/DenseItemRow";
import { Button, IconButton } from "@/components/primitives/Button";
import { Dialog } from "@/components/primitives/Dialog";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import type { TodayReasonKey } from "@/domain/constants/shared";
import type { AreaDto, LocalItemRow } from "@/domain/items/schemas";
import { usePlanningMutations } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";

import { ItemOverflowActions } from "./ItemActions";
import {
  getDeadlineLabel,
  getItemDateLabel,
  getStateKey,
  getTypeMarker,
  reasonKeyToMessageKey,
  type ItemAction,
} from "./itemPresentation";
import styles from "./ItemList.module.css";

export type ItemActionHandler = (action: ItemAction, item: LocalItemRow) => void;

type ItemListSelectionContextValue = {
  areas: AreaDto[];
  selectedItem: LocalItemRow | null;
  selectItem: (item: LocalItemRow) => void;
  showCompletionUndo: (item: LocalItemRow) => void;
};

const ItemListSelectionContext = createContext<ItemListSelectionContextValue | null>(null);

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
  areas?: AreaDto[];
  children: ReactNode;
  description?: string;
  itemsForDetail?: LocalItemRow[];
  title: string;
};

export function PageFrame({
  actions,
  areas = [],
  children,
  description,
  itemsForDetail = [],
  title,
}: PageFrameProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<LocalItemRow | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 760 : false,
  );
  const { restoreItemSnapshot } = usePlanningMutations();
  const { t } = useTranslation();
  const selectedItem = itemsForDetail.find((item) => item.id === selectedItemId) ?? null;

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth <= 760);
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return (
    <ItemListSelectionContext.Provider
      value={{
        areas,
        selectedItem,
        selectItem: (item) => setSelectedItemId(item.id),
        showCompletionUndo: setUndoItem,
      }}
    >
      <div className={styles.pageGrid}>
        <ContentColumn>
          <PageHeader actions={actions} description={description} title={title} />
          {children}
        </ContentColumn>
        {selectedItem && !isMobile ? (
          <ItemDetailPane
            areas={areas}
            item={selectedItem}
            key={selectedItem.id}
            onClose={() => setSelectedItemId(null)}
          />
        ) : null}
      </div>
      {selectedItem && isMobile ? (
        <MobileItemDetailSheet
          areas={areas}
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
        />
      ) : null}
      {undoItem ? (
        <div className={styles.toast} role="status">
          <span>{t("item.completionToast.completed")}</span>
          <Button
            onClick={() => {
              restoreItemSnapshot(undoItem);
              setUndoItem(null);
            }}
            variant="quiet"
          >
            {t("item.completionToast.undo")}
          </Button>
        </div>
      ) : null}
    </ItemListSelectionContext.Provider>
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
    <section className={styles.section} data-item-section>
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
  const selection = useContext(ItemListSelectionContext);
  const { getItemSyncState, runItemAction } = usePlanningMutations();
  const areaName = useMemo(
    () => areas.find((area) => area.id === item.area_id)?.name,
    [areas, item.area_id],
  );
  const stateKey = getStateKey(item.status);
  const syncState = getItemSyncState(item.id);
  const rowState = syncState ?? state ?? itemStatusToRowState(item);
  const date = buildDateMetadata(item, t);
  const canComplete =
    item.status !== "abandoned" &&
    item.deleted_at === null &&
    item.archived_at === null &&
    item.hidden_reason === null;

  function toggleCompletion() {
    if (!canComplete) {
      return;
    }

    if (item.status === "completed") {
      runItemAction(item.id, "reopen");
      return;
    }

    const previous = item;
    const result = runItemAction(item.id, "complete");

    if (result.ok) {
      selection?.showCompletionUndo(previous);
    }
  }

  return (
    <DenseItemRow
      actions={<ItemOverflowActions item={item} onAction={onAction} />}
      area={areaName}
      date={date}
      isSelected={selection?.selectedItem?.id === item.id}
      leading={getTypeMarker(item.item_type)}
      moreActionLabel={t("item.action.more")}
      onComplete={toggleCompletion}
      onSelect={() => selection?.selectItem(item)}
      completeActionLabel={t(
        item.status === "completed" ? "item.action.reopen" : "item.action.complete",
      )}
      completeDisabled={!canComplete}
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

function ItemDetailPane({
  areas,
  item,
  onClose,
}: {
  areas: AreaDto[];
  item: LocalItemRow;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { editItem, getItemSyncState } = usePlanningMutations();
  const [note, setNote] = useState(item.note ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const areaName = areas.find((area) => area.id === item.area_id)?.name ?? t("area.picker.none");
  const syncState = getItemSyncState(item.id);
  const content = useItemDetailContent({
    areaName,
    editItem,
    item,
    note,
    saveState,
    setNote,
    setSaveState,
    syncState,
  });

  return (
    <aside className={styles.detailPane} aria-label={t("item.detail.title")}>
      <div className={styles.detailHeader}>
        <p className={styles.detailEyebrow}>{t(itemTypeToMessageKey(item.item_type))}</p>
        <IconButton
          aria-label={t("common.close")}
          icon={<X aria-hidden="true" size={17} />}
          onClick={onClose}
          tooltip={t("common.close")}
        />
      </div>
      {content.body}
    </aside>
  );
}

function MobileItemDetailSheet({
  areas,
  item,
  onClose,
}: {
  areas: AreaDto[];
  item: LocalItemRow;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { editItem, getItemSyncState } = usePlanningMutations();
  const [note, setNote] = useState(item.note ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const areaName = areas.find((area) => area.id === item.area_id)?.name ?? t("area.picker.none");
  const syncState = getItemSyncState(item.id);
  const content = useItemDetailContent({
    areaName,
    editItem,
    item,
    note,
    saveState,
    setNote,
    setSaveState,
    syncState,
  });

  return (
    <Dialog
      className={styles.mobileDetailDialog}
      description={t("item.detail.description")}
      hideHeader
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open
      title={item.title}
    >
      <div className={styles.mobileDetailHeader}>
        <p className={styles.detailEyebrow}>{t(itemTypeToMessageKey(item.item_type))}</p>
        <IconButton
          aria-label={t("common.close")}
          icon={<X aria-hidden="true" size={17} />}
          onClick={onClose}
          tooltip={t("common.close")}
        />
      </div>
      {content.body}
    </Dialog>
  );
}

function useItemDetailContent({
  areaName,
  editItem,
  item,
  note,
  saveState,
  setNote,
  setSaveState,
  syncState,
}: {
  areaName: string;
  editItem: ReturnType<typeof usePlanningMutations>["editItem"];
  item: LocalItemRow;
  note: string;
  saveState: "idle" | "saving" | "saved";
  setNote: (value: string) => void;
  setSaveState: (value: "idle" | "saving" | "saved") => void;
  syncState: "pending" | "rejected" | null;
}) {
  const { t } = useTranslation();
  const lastSavedNote = useRef(item.note ?? "");
  const savedTimer = useRef<number | null>(null);

  const persistNote = useCallback(
    (nextValue = note) => {
      const nextNote = nextValue.trim().length > 0 ? nextValue : null;
      const normalized = nextNote ?? "";

      if (lastSavedNote.current === normalized) {
        return;
      }

      if (savedTimer.current !== null) {
        window.clearTimeout(savedTimer.current);
      }

      setSaveState("saving");
      editItem(item.id, {
        areaId: item.area_id,
        note: nextNote,
        title: item.title,
      });
      lastSavedNote.current = normalized;
      savedTimer.current = window.setTimeout(() => setSaveState("saved"), 240);
    },
    [editItem, item.area_id, item.id, item.title, note, setSaveState],
  );

  useEffect(() => {
    if (note === lastSavedNote.current) {
      return;
    }

    const timer = window.setTimeout(() => persistNote(note), 700);
    return () => window.clearTimeout(timer);
  }, [note, persistNote]);

  useEffect(
    () => () => {
      if (savedTimer.current !== null) {
        window.clearTimeout(savedTimer.current);
      }
    },
    [],
  );

  return {
    body: (
      <>
        <div className={styles.markdownBody}>{renderMarkdown(`# ${item.title}`)}</div>
        <label className={styles.noteEditor}>
          <span>{t("item.field.note")}</span>
          <textarea
            onBlur={() => persistNote()}
            onChange={(event) => {
              setNote(event.target.value);
              setSaveState("idle");
            }}
            placeholder={t("item.detail.notePlaceholder")}
            rows={5}
            value={note}
          />
        </label>
        <div className={styles.noteFeedback} data-save-state={saveState}>
          <span />
        </div>
        {saveState === "saved" ? <p className={styles.noteState}>{t("item.detail.saved")}</p> : null}
        <dl className={styles.detailList}>
          <DetailRow label={t("item.field.status")} value={t(`item.state.${item.status}`)} />
          <DetailRow label={t("area.picker.label")} value={areaName} />
          <DetailRow label={t("item.field.scheduledDate")} value={item.scheduled_date ?? "-"} />
          <DetailRow label={t("item.field.deadlineDate")} value={item.deadline_date ?? "-"} />
          <DetailRow label={t("item.field.reviewDate")} value={item.review_date ?? "-"} />
          <DetailRow
            label={t("item.detail.syncState")}
            value={
              syncState === "pending"
                ? t("sync.itemPending")
                : syncState === "rejected"
                  ? t("sync.itemRejected")
                  : t("sync.synced")
            }
          />
        </dl>
      </>
    ),
    persistNote,
  };
}

function renderMarkdown(markdown: string): ReactNode[] {
  return markdown
    .split(/\n{2,}/)
    .map((block, index) => renderMarkdownBlock(block.trim(), index))
    .filter((node): node is ReactNode => node !== null);
}

function renderMarkdownBlock(block: string, index: number): ReactNode | null {
  if (!block) {
    return null;
  }

  if (block.startsWith("# ")) {
    return <h3 key={index}>{renderInlineMarkdown(block.slice(2))}</h3>;
  }

  if (block.startsWith("## ")) {
    return <h4 key={index}>{renderInlineMarkdown(block.slice(3))}</h4>;
  }

  const lines = block.split("\n");
  if (lines.every((line) => line.trim().startsWith("- "))) {
    return (
      <ul key={index}>
        {lines.map((line) => (
          <li key={line}>{renderInlineMarkdown(line.trim().slice(2))}</li>
        ))}
      </ul>
    );
  }

  return <p key={index}>{renderInlineMarkdown(block)}</p>;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${match.index}-${token}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`${match.index}-${token}`}>{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
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

function itemTypeToMessageKey(itemType: string) {
  switch (itemType) {
    case "date_task":
      return "item.type.dateTask";
    case "deadline_task":
      return "item.type.deadlineTask";
    case "idea":
      return "item.type.idea";
    default:
      return "item.type.inbox";
  }
}
