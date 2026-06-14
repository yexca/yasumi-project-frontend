import { useMemo, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Dialog, DialogClose } from "@/components/primitives/Dialog";
import { Select, TextArea, TextInput } from "@/components/primitives/Field";
import type { DateOnly } from "@/domain/time/dateOnly";
import { isDateOnly } from "@/domain/time/dateOnly";
import { usePlanningData, usePlanningMutations } from "@/features/planning/usePlanningData";
import type { AreaDto, LocalItemRow, RecurringTaskTemplateDto } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";
import { parseQuickAdd } from "@/features/quick-add/parser";

import type { ItemAction } from "./itemPresentation";
import styles from "./ItemDialogs.module.css";

type ClassificationTarget = "date_task" | "deadline_task" | "idea" | "recurring_template";

type QuickAddDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function QuickAddDialog({ onOpenChange, open }: QuickAddDialogProps) {
  const { t } = useTranslation();
  const data = usePlanningData();
  const { createCapture } = usePlanningMutations();
  const [sourceText, setSourceText] = useState("");
  const preview = useMemo(
    () =>
      parseQuickAdd(sourceText, {
        locale: data.settings.locale,
        today: data.today,
        untitled: t("quickAdd.untitled"),
      }),
    [data.settings.locale, data.today, sourceText, t],
  );
  const save = (mode: "inbox" | "suggestion") => {
    createCapture({ mode, sourceText });
    setSourceText("");
    onOpenChange(false);
  };

  return (
    <Dialog
      description={t("quickAdd.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("quickAdd.title")}
    >
      <div className={styles.dialogBody}>
        <TextArea
          label={t("quickAdd.source.label")}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder={t("quickAdd.source.placeholder")}
          rows={4}
          value={sourceText}
        />
        <PreviewList
          rows={[
            [t("quickAdd.preview.title"), preview.cleanTitle],
            [t("quickAdd.preview.type"), t(itemTypeToMessageKey(preview.itemTypeSuggestion))],
            [t("quickAdd.preview.confidence"), t(`quickAdd.confidence.${preview.confidence}`)],
            [
              t("quickAdd.preview.fragments"),
              preview.recognizedFragments.map((fragment) => fragment.text).join(", ") || "-",
            ],
          ]}
        />
        <div className={styles.actions}>
          <Button onClick={() => save("inbox")}>{t("quickAdd.saveInbox")}</Button>
          <Button onClick={() => save("suggestion")} variant="primary">
            {t("quickAdd.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

type ItemFlowDialogProps = {
  action: ItemAction | null;
  areas: AreaDto[];
  item: LocalItemRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ItemFlowDialog({ action, areas, item, onOpenChange, open }: ItemFlowDialogProps) {
  const { t } = useTranslation();
  const { runItemAction } = usePlanningMutations();

  if (!item || !action) {
    return null;
  }

  if (action.id === "classify" || action.id === "convert") {
    return (
      <ClassificationDialog action={action} item={item} onOpenChange={onOpenChange} open={open} />
    );
  }

  if (action.id === "postpone" || action.id === "setReviewDate") {
    return <PostponeDialog action={action} item={item} onOpenChange={onOpenChange} open={open} />;
  }

  if (action.id === "edit" || action.id === "review") {
    return (
      <ItemEditorDialog
        areas={areas}
        item={item}
        onOpenChange={onOpenChange}
        open={open}
        title={t(action.id === "review" ? "item.detail.title" : "item.editor.title")}
      />
    );
  }

  return (
    <Dialog
      description={t("item.actionDialog.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t(action.labelKey)}
    >
      <div className={styles.dialogBody}>
        <PreviewList
          rows={[
            [t("item.field.title"), item.title],
            [t("item.field.status"), t(`item.state.${item.status}`)],
          ]}
        />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              runItemAction(item.id, action.id);
              onOpenChange(false);
            }}
            variant={action.id === "delete" || action.id === "abandon" ? "danger" : "primary"}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ClassificationDialog({
  action,
  item,
  onOpenChange,
  open,
}: Omit<ItemFlowDialogProps, "areas"> & { action: ItemAction; item: LocalItemRow }) {
  const { t } = useTranslation();
  const data = usePlanningData();
  const { classifyItem } = usePlanningMutations();
  const [target, setTarget] = useState<ClassificationTarget>("date_task");
  const [scheduledDate, setScheduledDate] = useState(data.today);
  const [deadlineDate, setDeadlineDate] = useState(data.today);

  return (
    <Dialog
      description={t("classification.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t(action.id === "classify" ? "classification.title" : "classification.convertTitle")}
    >
      <div className={styles.dialogBody}>
        <TextInput label={t("item.field.title")} readOnly value={item.title} />
        <Select
          label={t("classification.target.label")}
          onChange={(event) => setTarget(event.target.value as ClassificationTarget)}
          value={target}
        >
          <option value="date_task">{t("item.type.dateTask")}</option>
          <option value="deadline_task">{t("item.type.deadlineTask")}</option>
          <option value="idea">{t("item.type.idea")}</option>
          <option value="recurring_template">{t("item.type.recurringTemplate")}</option>
        </Select>
        {target === "date_task" ? (
          <TextInput
            label={t("item.field.scheduledDate")}
            onChange={(event) => setScheduledDate(event.target.value)}
            type="date"
            value={scheduledDate}
          />
        ) : null}
        {target === "deadline_task" ? (
          <TextInput
            label={t("item.field.deadlineDate")}
            onChange={(event) => setDeadlineDate(event.target.value)}
            type="date"
            value={deadlineDate}
          />
        ) : null}
        {target === "recurring_template" ? (
          <TextInput label={t("recurrence.field.startDate")} type="date" />
        ) : null}
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              classifyItem(item.id, {
                deadlineDate: toDateOnly(deadlineDate),
                scheduledDate: toDateOnly(scheduledDate),
                targetType: target,
              });
              onOpenChange(false);
            }}
            variant="primary"
          >
            {t("classification.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function PostponeDialog({
  action,
  item,
  onOpenChange,
  open,
}: Omit<ItemFlowDialogProps, "areas"> & { action: ItemAction; item: LocalItemRow }) {
  const { t } = useTranslation();
  const data = usePlanningData();
  const { postponeItem } = usePlanningMutations();
  const [targetDate, setTargetDate] = useState(data.today);
  const targetLabel =
    item.item_type === "deadline_task"
      ? t("item.field.plannedWorkDate")
      : action.id === "setReviewDate"
        ? t("item.field.reviewDate")
        : t("item.field.scheduledDate");

  return (
    <Dialog
      description={t(
        action.id === "setReviewDate" ? "reviewDate.description" : "postpone.description",
      )}
      onOpenChange={onOpenChange}
      open={open}
      title={t(action.id === "setReviewDate" ? "reviewDate.title" : "postpone.title")}
    >
      <div className={styles.dialogBody}>
        <TextInput
          label={targetLabel}
          onChange={(event) => setTargetDate(event.target.value)}
          type="date"
          value={targetDate}
        />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              const date = toDateOnly(targetDate);
              if (date !== null) {
                postponeItem(item.id, { targetDate: date });
              }
              onOpenChange(false);
            }}
            variant="primary"
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

type ItemEditorDialogProps = {
  areas: AreaDto[];
  item: LocalItemRow;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function ItemEditorDialog({
  areas,
  item,
  onOpenChange,
  open,
  title,
}: ItemEditorDialogProps) {
  const { t } = useTranslation();
  const { editItem } = usePlanningMutations();
  const [titleValue, setTitleValue] = useState(item.title);
  const [areaId, setAreaId] = useState(item.area_id ?? "");
  const [note, setNote] = useState(item.note ?? "");

  return (
    <Dialog
      description={t("item.editor.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className={styles.dialogBody}>
        <TextInput
          label={t("item.field.title")}
          onChange={(event) => setTitleValue(event.target.value)}
          required
          value={titleValue}
        />
        <Select
          label={t("area.picker.label")}
          onChange={(event) => setAreaId(event.target.value)}
          value={areaId}
        >
          <option value="">{t("area.picker.none")}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        <TextArea
          label={t("item.field.note")}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          value={note}
        />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              editItem(item.id, {
                areaId: areaId === "" ? null : areaId,
                note: note.trim().length > 0 ? note : null,
                title: titleValue,
              });
              onOpenChange(false);
            }}
            variant="primary"
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

type AreaDeleteDialogProps = {
  activeCount: number;
  areaId: string;
  areaName: string;
  completedCount: number;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AreaDeleteDialog({
  activeCount,
  areaId,
  areaName,
  completedCount,
  onOpenChange,
  open,
}: AreaDeleteDialogProps) {
  const { t } = useTranslation();
  const { deleteArea } = usePlanningMutations();

  return (
    <Dialog
      description={t("area.delete.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("area.delete.title")}
    >
      <div className={styles.dialogBody}>
        <PreviewList
          rows={[
            [t("area.field.name"), areaName],
            [t("area.delete.activeAffected"), activeCount],
            [t("area.delete.completedAffected"), completedCount],
          ]}
        />
        <p className={styles.copy}>{t("area.delete.consequence")}</p>
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              deleteArea(areaId, "area_only");
              onOpenChange(false);
            }}
          >
            {t("area.delete.areaOnly")}
          </Button>
          <Button
            onClick={() => {
              deleteArea(areaId, "area_and_items");
              onOpenChange(false);
            }}
            variant="danger"
          >
            {t("area.delete.areaAndItems")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function toDateOnly(value: string): DateOnly | null {
  return isDateOnly(value) ? value : null;
}

type RecurringTemplateDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  templates: RecurringTaskTemplateDto[];
};

export function RecurringTemplateDialog({
  onOpenChange,
  open,
  templates,
}: RecurringTemplateDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      description={t("recurrence.list.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("recurrence.list.title")}
    >
      <div className={styles.templateList}>
        {templates.map((template) => (
          <article className={styles.templateRow} key={template.id}>
            <div>
              <h3>{template.title}</h3>
              <p>
                {t(`recurrence.frequency.${template.frequency}`)} ·{" "}
                {t(`recurrence.status.${template.status}`)}
              </p>
            </div>
            <Button>{t("item.action.edit")}</Button>
          </article>
        ))}
      </div>
    </Dialog>
  );
}

function PreviewList({ rows }: { rows: [string, string | number][] }) {
  return (
    <dl className={styles.previewList}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
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
