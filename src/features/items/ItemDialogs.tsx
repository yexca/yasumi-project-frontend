import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/primitives/Button";
import { Dialog, DialogClose } from "@/components/primitives/Dialog";
import { Select, TextArea, TextInput } from "@/components/primitives/Field";
import type { DateOnly } from "@/domain/time/dateOnly";
import { isDateOnly } from "@/domain/time/dateOnly";
import { usePlanningData, usePlanningMutations } from "@/features/planning/usePlanningData";
import type { AreaDto, LocalItemRow, RecurringTaskTemplateDto } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";
import { parseQuickAdd, type QuickAddFragment } from "@/features/quick-add/parser";

import type { ItemAction } from "./itemPresentation";
import styles from "./ItemDialogs.module.css";

type ClassificationTarget = "date_task" | "deadline_task" | "idea" | "recurring_template";
type QuickAddTaskType = "none" | "date_task" | "deadline_task" | "idea";
type QuickAddTaskTypeSelection = "auto" | QuickAddTaskType;

export type QuickAddDefaultCapture = {
  areaId?: string | null;
  taskType?: QuickAddTaskType;
  scheduledDate?: DateOnly;
};

type QuickAddDialogProps = {
  areas?: AreaDto[];
  defaultCapture?: QuickAddDefaultCapture;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function QuickAddDialog({
  areas = [],
  defaultCapture,
  onOpenChange,
  open,
}: QuickAddDialogProps) {
  const { t } = useTranslation();
  const data = usePlanningData();
  const { createCapture } = usePlanningMutations();
  const [taskName, setTaskName] = useState("");
  const [note, setNote] = useState("");
  const defaultTaskType: QuickAddTaskTypeSelection = defaultCapture?.taskType ?? "auto";
  const defaultScheduledDate = defaultCapture?.scheduledDate ?? null;
  const defaultAreaId = defaultCapture?.areaId ?? "";
  const [taskType, setTaskType] = useState<QuickAddTaskTypeSelection>(defaultTaskType);
  const [manualScheduledDate, setManualScheduledDate] = useState<string | null>(null);
  const [plannedWorkDate, setPlannedWorkDate] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null);
  const [areaId, setAreaId] = useState(defaultAreaId);
  const [ignoredFragments, setIgnoredFragments] = useState<QuickAddFragment[]>([]);
  const preview = useMemo(
    () =>
      parseQuickAdd(taskName, {
        ignoredFragments,
        locale: data.settings.locale,
        today: data.today,
        untitled: t("quickAdd.untitled"),
      }),
    [data.settings.locale, data.today, ignoredFragments, taskName, t],
  );

  const effectiveTaskType = resolveEffectiveQuickAddType(taskType, preview.itemTypeSuggestion);
  const resolvedScheduledDate =
    effectiveTaskType === "date_task"
      ? (manualScheduledDate ?? preview.fields.scheduled_date ?? defaultScheduledDate ?? "")
      : "";
  const resolvedDeadlineDate =
    effectiveTaskType === "deadline_task"
      ? (deadlineDate ?? preview.fields.deadline_date ?? "")
      : "";
  const resolvedPlannedWorkDate =
    effectiveTaskType === "deadline_task" ? (plannedWorkDate ?? "") : "";
  const areaFallbackLabel =
    effectiveTaskType === "idea" ? t("quickAdd.area.ideaPool") : t("nav.inbox");
  const previewTitle =
    effectiveTaskType === "inbox" ? normalizeTaskName(taskName) : preview.cleanTitle;
  const canSave =
    taskName.trim().length > 0 &&
    (effectiveTaskType !== "date_task" || toDateOnly(resolvedScheduledDate) !== null) &&
    (effectiveTaskType !== "deadline_task" || toDateOnly(resolvedDeadlineDate) !== null);

  const save = () => {
    if (!canSave) {
      return;
    }

    createCapture({
      areaId: areaId === "" ? null : areaId,
      ignoredFragments,
      note: note.trim().length > 0 ? note : null,
      plannedWorkDate:
        effectiveTaskType === "deadline_task" ? toDateOnly(resolvedPlannedWorkDate) : null,
      deadlineDate: effectiveTaskType === "deadline_task" ? toDateOnly(resolvedDeadlineDate) : null,
      scheduledDate: effectiveTaskType === "date_task" ? toDateOnly(resolvedScheduledDate) : null,
      sourceText: taskName,
      targetItemType: effectiveTaskType,
    });
    setTaskName("");
    setNote("");
    setTaskType(defaultTaskType);
    setManualScheduledDate(null);
    setPlannedWorkDate(null);
    setDeadlineDate(null);
    setAreaId(defaultAreaId);
    setIgnoredFragments([]);
    onOpenChange(false);
  };

  return (
    <Dialog
      description={t("quickAdd.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("quickAdd.title")}
    >
      <form
        className={styles.dialogBody}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <HighlightedTaskNameInput
          fragments={preview.recognizedFragments}
          label={t("quickAdd.taskName.label")}
          onCancelFragment={(fragment) =>
            setIgnoredFragments((current) => appendIgnoredFragment(current, fragment))
          }
          onChange={(value) => {
            setTaskName(value);
            setIgnoredFragments((current) =>
              current.filter((fragment) => value.includes(fragment.text)),
            );
          }}
          placeholder={t("quickAdd.taskName.placeholder")}
          value={taskName}
        />
        <TextArea
          label={t("quickAdd.description.label")}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("quickAdd.description.placeholder")}
          rows={3}
          value={note}
        />
        <div className={styles.quickAddSelectRow}>
          <Select
            label={t("quickAdd.taskType.label")}
            onChange={(event) => {
              const nextTaskType = event.target.value as QuickAddTaskType;
              setTaskType(nextTaskType);
              if (nextTaskType !== "date_task") {
                setManualScheduledDate(null);
              }
              if (nextTaskType !== "deadline_task") {
                setDeadlineDate(null);
                setPlannedWorkDate(null);
              }
            }}
            value={taskType === "auto" ? "none" : taskType}
          >
            <option value="none">{t("quickAdd.taskType.none")}</option>
            <option value="date_task">{t("item.type.dateTask")}</option>
            <option value="deadline_task">{t("item.type.deadlineTask")}</option>
            <option value="idea">{t("item.type.idea")}</option>
          </Select>
          <Select
            label={t("area.picker.label")}
            onChange={(event) => setAreaId(event.target.value)}
            value={areaId}
          >
            <option value="">{areaFallbackLabel}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </div>
        {effectiveTaskType === "date_task" ? (
          <TextInput
            label={t("item.field.scheduledDate")}
            onChange={(event) => setManualScheduledDate(event.target.value)}
            type="date"
            value={resolvedScheduledDate}
          />
        ) : null}
        {effectiveTaskType === "deadline_task" ? (
          <div className={styles.quickAddSelectRow}>
            <TextInput
              label={t("item.field.plannedWorkDate")}
              onChange={(event) => setPlannedWorkDate(event.target.value)}
              type="date"
              value={resolvedPlannedWorkDate}
            />
            <TextInput
              label={t("item.field.deadlineDate")}
              onChange={(event) => setDeadlineDate(event.target.value)}
              type="date"
              value={resolvedDeadlineDate}
            />
          </div>
        ) : null}
        <PreviewList
          rows={[
            [t("quickAdd.preview.title"), previewTitle || t("quickAdd.untitled")],
            [
              t("quickAdd.preview.type"),
              effectiveTaskType === "inbox"
                ? t("quickAdd.taskType.none")
                : t(itemTypeToMessageKey(effectiveTaskType)),
            ],
            [
              t("area.picker.label"),
              areaId === ""
                ? areaFallbackLabel
                : (areas.find((area) => area.id === areaId)?.name ?? areaFallbackLabel),
            ],
            [
              t("quickAdd.preview.fragments"),
              preview.recognizedFragments.map((fragment) => fragment.text).join(", ") || "-",
            ],
          ]}
        />
        <div className={styles.actions}>
          <Button disabled={!canSave} type="submit" variant="primary">
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function HighlightedTaskNameInput({
  fragments,
  label,
  onCancelFragment,
  onChange,
  placeholder,
  value,
}: {
  fragments: QuickAddFragment[];
  label: string;
  onCancelFragment: (fragment: QuickAddFragment) => void;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const inputId = useId();
  const ranges = useMemo(() => buildFragmentRanges(value, fragments), [fragments, value]);

  return (
    <div className={styles.highlightField}>
      <label className={styles.highlightLabel} htmlFor={inputId}>
        {label}
      </label>
      <span className={styles.highlightInputFrame}>
        <span aria-hidden="true" className={styles.highlightMirror}>
          {renderHighlightedValue(value, ranges, placeholder)}
        </span>
        <input
          autoComplete="off"
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Backspace") {
              return;
            }

            const input = event.currentTarget;
            if (input.selectionStart === null || input.selectionStart !== input.selectionEnd) {
              return;
            }

            const range = findRangeAtCursor(ranges, input.selectionStart);
            if (!range) {
              return;
            }

            event.preventDefault();
            onCancelFragment(range.fragment);
          }}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </span>
    </div>
  );
}

type FragmentRange = {
  end: number;
  fragment: QuickAddFragment;
  start: number;
};

function buildFragmentRanges(value: string, fragments: QuickAddFragment[]): FragmentRange[] {
  const ranges: FragmentRange[] = [];
  let searchStart = 0;

  for (const fragment of fragments) {
    const start = value.indexOf(fragment.text, searchStart);
    if (start < 0) {
      continue;
    }

    const end = start + fragment.text.length;
    ranges.push({ end, fragment, start });
    searchStart = end;
  }

  return ranges.sort((left, right) => left.start - right.start);
}

function findRangeAtCursor(ranges: FragmentRange[], cursor: number): FragmentRange | null {
  return (
    ranges.find((range) => cursor > range.start && cursor <= range.end) ??
    ranges.find((range) => cursor === range.start) ??
    null
  );
}

function renderHighlightedValue(value: string, ranges: FragmentRange[], placeholder: string) {
  if (value.length === 0) {
    return <span className={styles.highlightPlaceholder}>{placeholder}</span>;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      nodes.push(value.slice(cursor, range.start));
    }
    nodes.push(
      <mark key={`${range.start}-${range.end}`}>{value.slice(range.start, range.end)}</mark>,
    );
    cursor = range.end;
  }

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }

  return nodes;
}

function appendIgnoredFragment(
  fragments: QuickAddFragment[],
  nextFragment: QuickAddFragment,
): QuickAddFragment[] {
  if (
    fragments.some(
      (fragment) =>
        fragment.text === nextFragment.text &&
        fragment.normalizedValue === nextFragment.normalizedValue,
    )
  ) {
    return fragments;
  }

  return [...fragments, nextFragment];
}

function resolveEffectiveQuickAddType(
  taskType: QuickAddTaskTypeSelection,
  suggestion: "date_task" | "deadline_task" | "idea" | "inbox",
) {
  if (taskType === "auto") {
    return suggestion;
  }

  return taskType === "none" ? "inbox" : taskType;
}

function normalizeTaskName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

type AreaCreateDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AreaCreateDialog({ onOpenChange, open }: AreaCreateDialogProps) {
  const { t } = useTranslation();
  const { createArea } = usePlanningMutations();
  const [name, setName] = useState("");
  const save = () => {
    const result = createArea({ name });
    if (result.ok) {
      setName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      description={t("area.create.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("area.create.title")}
    >
      <form
        className={styles.dialogBody}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <TextInput
          label={t("area.field.name")}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button type="submit" variant="primary">
            {t("area.create.confirm")}
          </Button>
        </div>
      </form>
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
        key={item.id}
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const lastSavedNote = useRef(item.note ?? "");
  const savedTimer = useRef<number | null>(null);

  const saveItem = useCallback(
    (nextNote = note) => {
      const normalizedNote = nextNote.trim().length > 0 ? nextNote : null;

      editItem(item.id, {
        areaId: areaId === "" ? null : areaId,
        note: normalizedNote,
        title: titleValue,
      });
      lastSavedNote.current = normalizedNote ?? "";
    },
    [areaId, editItem, item.id, note, titleValue],
  );

  const persistNote = useCallback(
    (nextNote = note) => {
      const normalizedNote = nextNote.trim().length > 0 ? nextNote : null;
      const normalized = normalizedNote ?? "";

      if (lastSavedNote.current === normalized) {
        return;
      }

      if (savedTimer.current !== null) {
        window.clearTimeout(savedTimer.current);
      }

      setSaveState("saving");
      saveItem(nextNote);
      savedTimer.current = window.setTimeout(() => setSaveState("saved"), 240);
    },
    [note, saveItem],
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
          onBlur={() => persistNote()}
          onChange={(event) => {
            setNote(event.target.value);
            setSaveState("idle");
          }}
          placeholder={t("item.detail.notePlaceholder")}
          rows={5}
          value={note}
        />
        <div className={styles.noteFeedback} data-save-state={saveState}>
          <span />
        </div>
        {saveState === "saved" ? <p className={styles.copy}>{t("item.detail.saved")}</p> : null}
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button>{t("common.cancel")}</Button>
          </DialogClose>
          <Button
            onClick={() => {
              saveItem();
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
