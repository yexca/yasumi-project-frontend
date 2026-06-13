import { useMemo, useState } from "react";

import { Button } from "@/components/primitives/Button";
import { Dialog, DialogClose } from "@/components/primitives/Dialog";
import { Select, TextArea, TextInput } from "@/components/primitives/Field";
import type { AreaDto, LocalItemRow, RecurringTaskTemplateDto } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";

import type { ItemAction } from "./itemPresentation";
import styles from "./ItemDialogs.module.css";

type QuickAddDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function QuickAddDialog({ onOpenChange, open }: QuickAddDialogProps) {
  const { t } = useTranslation();
  const [sourceText, setSourceText] = useState("");
  const preview = useMemo(
    () => buildQuickAddPreview(sourceText, t("quickAdd.untitled")),
    [sourceText, t],
  );

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
            [t("quickAdd.preview.title"), preview.title],
            [t("quickAdd.preview.type"), t(preview.itemTypeKey)],
            [t("quickAdd.preview.confidence"), t(preview.confidenceKey)],
            [t("quickAdd.preview.fragments"), preview.fragments],
          ]}
        />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("quickAdd.saveInbox")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">{t("quickAdd.confirm")}</Button>
          </DialogClose>
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
          <DialogClose asChild>
            <Button
              variant={action.id === "delete" || action.id === "abandon" ? "danger" : "primary"}
            >
              {t("common.confirm")}
            </Button>
          </DialogClose>
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
  const [target, setTarget] = useState("date_task");

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
          onChange={(event) => setTarget(event.target.value)}
          value={target}
        >
          <option value="date_task">{t("item.type.dateTask")}</option>
          <option value="deadline_task">{t("item.type.deadlineTask")}</option>
          <option value="idea">{t("item.type.idea")}</option>
          <option value="recurring_template">{t("item.type.recurringTemplate")}</option>
        </Select>
        {target === "date_task" ? (
          <TextInput label={t("item.field.scheduledDate")} type="date" />
        ) : null}
        {target === "deadline_task" ? (
          <TextInput label={t("item.field.deadlineDate")} type="date" />
        ) : null}
        {target === "recurring_template" ? (
          <TextInput label={t("recurrence.field.startDate")} type="date" />
        ) : null}
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">{t("classification.confirm")}</Button>
          </DialogClose>
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
        <TextInput label={targetLabel} type="date" />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">{t("common.save")}</Button>
          </DialogClose>
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

  return (
    <Dialog
      description={t("item.editor.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      <div className={styles.dialogBody}>
        <TextInput label={t("item.field.title")} defaultValue={item.title} required />
        <Select defaultValue={item.area_id ?? ""} label={t("area.picker.label")}>
          <option value="">{t("area.picker.none")}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        <TextArea defaultValue={item.note ?? ""} label={t("item.field.note")} rows={5} />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">{t("common.save")}</Button>
          </DialogClose>
        </div>
      </div>
    </Dialog>
  );
}

type AreaDeleteDialogProps = {
  activeCount: number;
  areaName: string;
  completedCount: number;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AreaDeleteDialog({
  activeCount,
  areaName,
  completedCount,
  onOpenChange,
  open,
}: AreaDeleteDialogProps) {
  const { t } = useTranslation();

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
          <DialogClose asChild>
            <Button>{t("area.delete.areaOnly")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger">{t("area.delete.areaAndItems")}</Button>
          </DialogClose>
        </div>
      </div>
    </Dialog>
  );
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

function buildQuickAddPreview(sourceText: string, untitled: string) {
  const trimmed = sourceText.trim();
  const hasDate = /\d{4}-\d{2}-\d{2}|tomorrow|today|明日|今日|今天|明天/i.test(trimmed);
  const hasDeadline = /deadline|due|截止|締切/i.test(trimmed);

  return {
    title: trimmed.length > 0 ? trimmed.replace(/\s+/g, " ") : untitled,
    itemTypeKey: hasDeadline
      ? "item.type.deadlineTask"
      : hasDate
        ? "item.type.dateTask"
        : "item.type.inbox",
    confidenceKey:
      hasDate || hasDeadline ? "quickAdd.confidence.medium" : "quickAdd.confidence.low",
    fragments:
      hasDate || hasDeadline
        ? (sourceText
            .match(/\d{4}-\d{2}-\d{2}|tomorrow|today|deadline|due|明日|今日|今天|明天|截止|締切/gi)
            ?.join(", ") ?? "-")
        : "-",
  };
}
