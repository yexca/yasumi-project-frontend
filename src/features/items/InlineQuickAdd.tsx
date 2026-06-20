import {
  CalendarDays,
  CircleDashed,
  Inbox,
  Layers3,
  MoreHorizontal,
  Repeat2,
  Send,
  SunMedium,
} from "lucide-react";
import { useMemo, useState } from "react";

import { IconButton } from "@/components/primitives/Button";
import { Menu, MenuItem, MenuSeparator } from "@/components/primitives/Menu";
import type { ItemType } from "@/domain/constants/shared";
import type { AreaDto } from "@/domain/items/schemas";
import { addDays, isDateOnly, type DateOnly } from "@/domain/time/dateOnly";
import { parseQuickAdd } from "@/features/quick-add/parser";
import { usePlanningData, usePlanningMutations } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";

import styles from "./InlineQuickAdd.module.css";

type InlineQuickAddType = ItemType | "auto" | "repeat";

export type InlineQuickAddDefaultCapture = {
  areaId?: string | null;
  deadlineDate?: DateOnly | null;
  preserveTaskType?: boolean;
  scheduledDate?: DateOnly | null;
  taskType?: Exclude<InlineQuickAddType, "repeat">;
};

type InlineQuickAddProps = {
  areas: AreaDto[];
  defaultCapture?: InlineQuickAddDefaultCapture;
};

export function InlineQuickAdd({ areas, defaultCapture }: InlineQuickAddProps) {
  const { t } = useTranslation();
  const data = usePlanningData();
  const { createCapture } = usePlanningMutations();
  const [sourceText, setSourceText] = useState("");
  const defaultTaskType = defaultCapture?.taskType ?? "auto";
  const defaultAreaId = defaultCapture?.areaId ?? "";
  const defaultDate = defaultCapture?.scheduledDate ?? defaultCapture?.deadlineDate ?? data.today;
  const [typeSelection, setTypeSelection] = useState<InlineQuickAddType | null>(null);
  const [areaId, setAreaId] = useState(defaultAreaId);
  const [dateValue, setDateValue] = useState(defaultDate);
  const [dateTouched, setDateTouched] = useState(false);

  const preview = useMemo(
    () =>
      parseQuickAdd(sourceText, {
        locale: data.settings.locale,
        today: data.today,
        untitled: t("quickAdd.untitled"),
      }),
    [data.settings.locale, data.today, sourceText, t],
  );
  const parsedDate = getParsedDate(preview.fields);
  const effectiveType = resolveInlineType({
    defaultTaskType,
    preserveDefaultTaskType: defaultCapture?.preserveTaskType ?? false,
    selection: typeSelection,
    suggestion: preview.itemTypeSuggestion,
  });
  const resolvedDate =
    effectiveType === "date_task" || effectiveType === "deadline_task"
      ? dateTouched
        ? dateValue
        : (parsedDate ??
          (effectiveType === "date_task"
            ? defaultCapture?.scheduledDate
            : defaultCapture?.deadlineDate) ??
          dateValue)
      : null;
  const selectedArea = areaId ? areas.find((area) => area.id === areaId) : undefined;
  const canSave =
    sourceText.trim().length > 0 &&
    effectiveType !== "repeat" &&
    (effectiveType === "date_task" || effectiveType === "deadline_task"
      ? isDateOnly(resolvedDate ?? "")
      : true);

  function chooseType(nextType: InlineQuickAddType | null) {
    setTypeSelection(nextType);
    setDateTouched(false);

    if (nextType === "date_task") {
      setDateValue(defaultCapture?.scheduledDate ?? data.today);
      setDateTouched(true);
    }

    if (nextType === "deadline_task") {
      setDateValue(defaultCapture?.deadlineDate ?? data.today);
      setDateTouched(true);
    }
  }

  function save() {
    if (!canSave) {
      return;
    }

    createCapture({
      areaId: areaId === "" ? null : areaId,
      deadlineDate: effectiveType === "deadline_task" ? toDateOnly(resolvedDate) : null,
      defaultScheduledDate:
        effectiveType === "date_task" && !dateTouched
          ? (defaultCapture?.scheduledDate ?? null)
          : null,
      sourceText,
      scheduledDate: effectiveType === "date_task" && dateTouched ? toDateOnly(resolvedDate) : null,
      targetItemType: effectiveType,
    });
    setSourceText("");
    setDateTouched(false);
    setTypeSelection(null);
    setAreaId(defaultAreaId);
    setDateValue(defaultDate);
  }

  return (
    <section className={styles.inlineQuickAdd} aria-label={t("inlineQuickAdd.label")}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          aria-label={t("inlineQuickAdd.inputLabel")}
          autoComplete="off"
          className={styles.input}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder={t("inlineQuickAdd.placeholder")}
          value={sourceText}
        />
        {effectiveType === "date_task" || effectiveType === "deadline_task" ? (
          <input
            aria-label={
              effectiveType === "deadline_task"
                ? t("item.field.deadlineDate")
                : t("item.field.scheduledDate")
            }
            className={styles.dateInput}
            onChange={(event) => {
              setDateTouched(true);
              setDateValue(event.target.value);
            }}
            type="date"
            value={resolvedDate ?? ""}
          />
        ) : null}
        <Menu
          trigger={
            <IconButton
              aria-label={t("inlineQuickAdd.dateOptions")}
              icon={<CalendarDays aria-hidden="true" size={17} />}
              tooltip={t("inlineQuickAdd.dateOptions")}
            />
          }
        >
          <MenuItem onSelect={() => chooseType(null)}>
            <span className={styles.menuRow}>
              <span>{t("quickAdd.targetType.auto")}</span>
              <span className={styles.menuMeta}>{t(inlineTypeLabelKey(effectiveType))}</span>
            </span>
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => chooseType("inbox")}>
            <Inbox aria-hidden="true" size={15} />
            <span>{t("quickAdd.taskType.none")}</span>
          </MenuItem>
          <MenuItem onSelect={() => chooseType("date_task")}>
            <SunMedium aria-hidden="true" size={15} />
            <span>{t("item.type.dateTask")}</span>
          </MenuItem>
          <MenuItem
            onSelect={() => {
              chooseType("date_task");
              setDateValue(addDays(data.today, 1));
              setDateTouched(true);
            }}
          >
            <CalendarDays aria-hidden="true" size={15} />
            <span>{t("inlineQuickAdd.tomorrow")}</span>
          </MenuItem>
          <MenuItem onSelect={() => chooseType("deadline_task")}>
            <CircleDashed aria-hidden="true" size={15} />
            <span>{t("item.type.deadlineTask")}</span>
          </MenuItem>
          <MenuItem disabled onSelect={() => chooseType("repeat")}>
            <Repeat2 aria-hidden="true" size={15} />
            <span className={styles.menuRow}>
              <span>{t("item.type.recurringTemplate")}</span>
              <span className={styles.menuMeta}>{t("inlineQuickAdd.notAvailable")}</span>
            </span>
          </MenuItem>
        </Menu>
        <Menu
          trigger={
            <IconButton
              aria-label={t("inlineQuickAdd.moreOptions")}
              icon={<MoreHorizontal aria-hidden="true" size={17} />}
              tooltip={t("inlineQuickAdd.moreOptions")}
            />
          }
        >
          <MenuItem onSelect={() => setAreaId("")}>
            <Layers3 aria-hidden="true" size={15} />
            <span>{t("area.picker.none")}</span>
          </MenuItem>
          {areas.length > 0 ? <MenuSeparator /> : null}
          {areas.map((area) => (
            <MenuItem key={area.id} onSelect={() => setAreaId(area.id)}>
              <span className={styles.menuRow}>
                <span>{area.name}</span>
                {area.id === areaId ? (
                  <span className={styles.menuMeta}>{t("inlineQuickAdd.selected")}</span>
                ) : null}
              </span>
            </MenuItem>
          ))}
        </Menu>
        <IconButton
          aria-label={t("inlineQuickAdd.submit")}
          disabled={!canSave}
          icon={<Send aria-hidden="true" size={17} />}
          tooltip={t("inlineQuickAdd.submit")}
          type="submit"
          variant="primary"
        />
      </form>
      <div className={styles.summary} aria-live="polite">
        <span className={styles.pill}>{t(inlineTypeLabelKey(effectiveType))}</span>
        {resolvedDate ? <span className={styles.pill}>{resolvedDate}</span> : null}
        {selectedArea ? <span className={styles.pill}>{selectedArea.name}</span> : null}
      </div>
    </section>
  );
}

function resolveInlineType({
  defaultTaskType,
  preserveDefaultTaskType,
  selection,
  suggestion,
}: {
  defaultTaskType: Exclude<InlineQuickAddType, "repeat">;
  preserveDefaultTaskType: boolean;
  selection: InlineQuickAddType | null;
  suggestion: "date_task" | "deadline_task" | "idea" | "inbox";
}): ItemType | "repeat" {
  if (selection !== null) {
    return selection === "auto" ? suggestion : selection;
  }

  if (preserveDefaultTaskType) {
    return defaultTaskType === "auto" ? suggestion : defaultTaskType;
  }

  return suggestion === "inbox"
    ? defaultTaskType === "auto"
      ? "inbox"
      : defaultTaskType
    : suggestion;
}

function getParsedDate(fields: Record<string, string | null>): DateOnly | null {
  const value = fields.deadline_date ?? fields.scheduled_date ?? fields.review_date ?? null;
  return toDateOnly(value);
}

function toDateOnly(value: string | null | undefined): DateOnly | null {
  return value && isDateOnly(value) ? value : null;
}

function inlineTypeLabelKey(itemType: ItemType | "repeat") {
  switch (itemType) {
    case "date_task":
      return "item.type.dateTask";
    case "deadline_task":
      return "item.type.deadlineTask";
    case "idea":
      return "item.type.idea";
    case "repeat":
      return "item.type.recurringTemplate";
    default:
      return "item.type.inbox";
  }
}
