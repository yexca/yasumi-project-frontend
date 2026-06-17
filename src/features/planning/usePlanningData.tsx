import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import type {
  ErrorCode,
  ErrorFieldKey,
  ItemType,
  OperationEventType,
} from "@/domain/constants/shared";
import { validationError, type ContractError } from "@/domain/errors";
import {
  buildActionIdempotencyKey,
  buildRecurrenceActionIdempotencyKey,
  buildRecurrenceGenerationIdempotencyKey,
} from "@/domain/idempotency";
import type {
  AreaDto,
  JsonObject,
  LocalItemRow,
  MinimalOperationHistoryRow,
  RecurringTaskTemplateDto,
} from "@/domain/items/schemas";
import { normalizeItemRow, safeNormalizeItemRow } from "@/domain/items/schemas";
import type { UserSettingsDefaults } from "@/domain/settings/defaults";
import {
  buildDefaultUserSettings,
  getDefaultDeviceTimeZone,
  isUserSettingsDefaults,
  isValidTimeZone,
} from "@/domain/settings/defaults";
import type { DateOnly } from "@/domain/time/dateOnly";
import { validateStatusTransition } from "@/domain/transitions/status";
import type { ItemActionId } from "@/features/items/itemPresentation";
import { parseQuickAdd } from "@/features/quick-add/parser";
import { useOptionalPowerSyncRuntime } from "@/features/sync/PowerSyncRuntimeProvider";
import { resolveLocalLanguagePreference } from "@/i18n/localLanguagePreference";
import { useSyncedPlanningStore, type SyncedStore } from "./useSyncedPlanningStore";

export type PlanningData = {
  areas: AreaDto[];
  items: LocalItemRow[];
  operationHistory: MinimalOperationHistoryRow[];
  recurringTemplates: RecurringTaskTemplateDto[];
  settings: UserSettingsDefaults;
  today: DateOnly;
};

export type SyncMode = "synced" | "offline" | "pending" | "failed" | "rejected";

export type SyncUiState = {
  mode: SyncMode;
  labelKey: string;
  pendingCount: number;
  rejectedCount: number;
};

export type SyncSnapshot = {
  deviceId: string;
  pendingMutations: LocalMutationContext[];
  rejectedWrites: RejectedWriteContext[];
};

export type RejectedWriteContext = {
  localMutationId: string;
  clientActionId: string | null;
  idempotencyKey: string | null;
  table: "items" | "areas" | "recurring_task_templates" | "user_settings";
  rowId: string;
  action:
    | "create"
    | "edit"
    | "complete"
    | "postpone"
    | "hold"
    | "abandon"
    | "reopen"
    | "archive"
    | "restore"
    | "delete"
    | "classify"
    | "area_delete"
    | "recurrence_complete"
    | "recurrence_skip"
    | "settings_update";
  errorCode: ErrorCode;
  fieldErrors: Partial<Record<ErrorFieldKey, string>>;
  retryable: boolean;
  createdAt: string;
};

export type LocalMutationContext = {
  action: RejectedWriteContext["action"];
  clientActionId: string;
  idempotencyKey: string;
  localMutationId: string;
  rowId: string;
  table: RejectedWriteContext["table"];
};

export type ItemEditorInput = {
  areaId: string | null;
  note: string | null;
  title: string;
};

export type ClassificationInput = {
  deadlineDate: DateOnly | null;
  scheduledDate: DateOnly | null;
  targetType: Exclude<ItemType, "inbox"> | "recurring_template";
};

export type PostponeInput = {
  targetDate: DateOnly;
};

export type QuickAddInput = {
  defaultItemType?: "date_task";
  defaultScheduledDate?: DateOnly;
  mode: "inbox" | "suggestion";
  sourceText: string;
};

export type AreaDeleteChoice = "area_only" | "area_and_items";

export type UserSettingsInput = Partial<UserSettingsDefaults>;

export type PlanningMutations = {
  archiveRejectedContext: (localMutationId: string) => void;
  classifyItem: (itemId: string, input: ClassificationInput) => MutationResult;
  createCapture: (input: QuickAddInput) => MutationResult;
  deleteArea: (areaId: string, choice: AreaDeleteChoice) => MutationResult;
  editItem: (itemId: string, input: ItemEditorInput) => MutationResult;
  getItemSyncState: (itemId: string) => "pending" | "rejected" | null;
  getRejectedContextForRow: (rowId: string) => RejectedWriteContext | null;
  postponeItem: (itemId: string, input: PostponeInput) => MutationResult;
  restoreItemSnapshot: (item: LocalItemRow) => MutationResult;
  runItemAction: (itemId: string, action: ItemActionId) => MutationResult;
  updateSettings: (input: UserSettingsInput) => MutationResult;
};

export type MutationResult =
  | { ok: true; mutation: LocalMutationContext | null }
  | { ok: false; error: ContractError };

type PlanningState = PlanningData & {
  deviceId: string;
  lastSyncError: ContractError | null;
  pendingMutations: LocalMutationContext[];
  rejectedWrites: RejectedWriteContext[];
};

type PlanningAction =
  | { type: "archiveRejectedContext"; localMutationId: string }
  | { type: "classifyItem"; itemId: string; input: ClassificationInput; now: string }
  | { type: "createCapture"; input: QuickAddInput; now: string }
  | { type: "deleteArea"; areaId: string; choice: AreaDeleteChoice; now: string }
  | { type: "editItem"; itemId: string; input: ItemEditorInput; now: string }
  | { type: "postponeItem"; itemId: string; input: PostponeInput; now: string }
  | { type: "restoreItemSnapshot"; item: LocalItemRow; now: string }
  | { type: "runItemAction"; itemId: string; action: ItemActionId; now: string }
  | { type: "updateSettings"; input: UserSettingsInput; now: string };

const USER_ID = "fixture-user";
const DEVICE_ID = "fixture-device";
const TODAY: DateOnly = "2026-06-14";
const SETTINGS_STORAGE_KEY = "yasumi:user-settings";
const SETTINGS_ROW_ID = "fixture-user-settings";

const syncMetadata = {
  user_id: USER_ID,
  created_at: "2026-06-01T08:00:00Z",
  updated_at: "2026-06-14T08:00:00Z",
  deleted_at: null,
  archived_at: null,
  hidden_reason: null,
  client_updated_at: "2026-06-14T08:00:00Z",
  server_updated_at: "2026-06-14T08:00:00Z",
  created_by_device_id: DEVICE_ID,
  updated_by_device_id: DEVICE_ID,
  revision: 1,
} as const;

const rawItems = [
  {
    id: "item-carried",
    ...syncMetadata,
    item_type: "date_task",
    title: "Review launch checklist",
    note: "Carry forward the remaining release notes.",
    status: "active",
    area_id: "area-work",
    scheduled_date: TODAY,
    scheduled_time_zone_mode: "floating",
    estimated_effort: 2,
    importance: 4,
  },
  {
    id: "item-today",
    ...syncMetadata,
    created_at: "2026-06-02T08:00:00Z",
    item_type: "date_task",
    title: "Draft roadmap update",
    note: null,
    status: "active",
    area_id: "area-work",
    scheduled_date: TODAY,
    scheduled_time_zone_mode: "floating",
    estimated_effort: 3,
    importance: 3,
  },
  {
    id: "item-deadline-primary",
    ...syncMetadata,
    created_at: "2026-06-03T08:00:00Z",
    item_type: "deadline_task",
    title: "Send renewal decision",
    note: "Confirm owner before the deadline.",
    status: "active",
    area_id: "area-home",
    planned_work_date: TODAY,
    deadline_date: "2026-06-16",
    deadline_time_zone_mode: "date_only",
    estimated_effort: 1,
    importance: 5,
  },
  {
    id: "item-deadline-soon",
    ...syncMetadata,
    created_at: "2026-06-04T08:00:00Z",
    item_type: "deadline_task",
    title: "Prepare workshop outline",
    note: null,
    status: "active",
    area_id: "area-work",
    deadline_date: "2026-06-22",
    deadline_time_zone_mode: "date_only",
    estimated_effort: 2,
    importance: 3,
  },
  {
    id: "item-upcoming",
    ...syncMetadata,
    created_at: "2026-06-05T08:00:00Z",
    item_type: "date_task",
    title: "Book quiet planning block",
    note: null,
    status: "active",
    area_id: "area-home",
    scheduled_date: "2026-06-18",
    scheduled_time_zone_mode: "floating",
    estimated_effort: 2,
    importance: 2,
  },
  {
    id: "item-idea",
    ...syncMetadata,
    created_at: "2026-06-06T08:00:00Z",
    item_type: "idea",
    title: "Try a weekly reset ritual",
    note: "Keep it short and repeatable.",
    status: "active",
    area_id: null,
    review_date: TODAY,
    estimated_effort: 1,
    importance: 2,
  },
  {
    id: "item-idea-later",
    ...syncMetadata,
    created_at: "2026-06-07T08:00:00Z",
    item_type: "idea",
    title: "Collect examples for a calmer dashboard",
    note: null,
    status: "active",
    area_id: "area-work",
    review_date: "2026-06-28",
    estimated_effort: 1,
    importance: 1,
  },
  {
    id: "item-inbox",
    ...syncMetadata,
    created_at: "2026-06-13T12:00:00Z",
    item_type: "inbox",
    title: "Ask Mei about the invoice date",
    note: null,
    status: "active",
    area_id: null,
    quick_add_source_text: "Ask Mei about the invoice date tomorrow",
    quick_add_parse_result: {
      confidence: "medium",
      recognized_fragments: ["tomorrow"],
    },
  },
  {
    id: "item-completed",
    ...syncMetadata,
    created_at: "2026-06-01T07:00:00Z",
    updated_at: "2026-06-13T18:00:00Z",
    item_type: "date_task",
    title: "Clean up old capture notes",
    note: null,
    status: "completed",
    area_id: "area-home",
    scheduled_date: "2026-06-12",
    scheduled_time_zone_mode: "floating",
  },
  {
    id: "item-archived",
    ...syncMetadata,
    updated_at: "2026-06-12T18:00:00Z",
    archived_at: "2026-06-12T18:00:00Z",
    item_type: "deadline_task",
    title: "Retired vendor comparison",
    note: null,
    status: "active",
    area_id: null,
    deadline_date: "2026-06-20",
    deadline_time_zone_mode: "date_only",
  },
  {
    id: "item-abandoned",
    ...syncMetadata,
    updated_at: "2026-06-11T18:00:00Z",
    item_type: "idea",
    title: "Old conference topic",
    note: null,
    status: "abandoned",
    area_id: null,
    review_date: "2026-06-01",
  },
] as const;

const initialAreas: AreaDto[] = [
  {
    id: "area-work",
    ...syncMetadata,
    name: "Work",
    sort_order: 10,
  },
  {
    id: "area-home",
    ...syncMetadata,
    name: "Home",
    sort_order: 20,
  },
];

const initialRecurringTemplates: RecurringTaskTemplateDto[] = [
  {
    id: "template-weekly-review",
    ...syncMetadata,
    title: "Weekly review",
    note: "Generated as a short date task.",
    area_id: "area-work",
    frequency: "weekly",
    interval: 1,
    weekdays: ["sunday"],
    recurrence_basis: "scheduled_date",
    start_date: "2026-06-01",
    end_type: "never",
    end_date: null,
    end_after_count: null,
    completed_count: 2,
    next_sequence: 3,
    scheduled_time: null,
    reminder_rule: {},
    generated_task_defaults: {
      item_type: "date_task",
      estimated_effort: 1,
    },
    status: "active",
  },
  {
    id: "template-invoices",
    ...syncMetadata,
    title: "Monthly invoice check",
    note: null,
    area_id: "area-home",
    frequency: "monthly",
    interval: 1,
    weekdays: [],
    recurrence_basis: "deadline_date",
    start_date: "2026-05-30",
    end_type: "never",
    end_date: null,
    end_after_count: null,
    completed_count: 1,
    next_sequence: 2,
    scheduled_time: null,
    reminder_rule: {},
    generated_task_defaults: {
      item_type: "deadline_task",
      importance: 3,
    },
    status: "on_hold",
  },
];

const initialOperationHistory: MinimalOperationHistoryRow[] = [
  {
    id: "op-carried",
    user_id: USER_ID,
    item_id: "item-carried",
    event_type: "activated_from_postponed",
    previous_value: {
      scheduled_date: TODAY,
      status: "postponed",
    },
    new_value: {
      status: "active",
    },
    reason: null,
    idempotency_key: "postponed-activation:fixture-user:item-carried:2026-06-14",
    created_at: "2026-06-14T00:10:00Z",
    created_by_device_id: DEVICE_ID,
  },
];

const PlanningDataContext = createContext<PlanningState | null>(null);
const PlanningMutationsContext = createContext<PlanningMutations | null>(null);
const SyncedPlanningStoreContext = createContext<SyncedStore | null>(null);

export function PlanningDataProvider({ children }: PropsWithChildren) {
  const runtime = useOptionalPowerSyncRuntime();

  if (runtime?.usesSyncedStore === true) {
    return <SyncedPlanningDataProvider>{children}</SyncedPlanningDataProvider>;
  }

  return <FixturePlanningDataProvider>{children}</FixturePlanningDataProvider>;
}

function FixturePlanningDataProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(planningReducer, undefined, buildInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const commit = useCallback((action: PlanningAction): MutationResult => {
    const projected = reducePlanningState(stateRef.current, action);
    stateRef.current = projected.state;
    dispatch(action);
    return projected.result;
  }, []);

  const mutations = useMemo<PlanningMutations>(
    () => ({
      archiveRejectedContext(localMutationId) {
        dispatch({ type: "archiveRejectedContext", localMutationId });
      },
      classifyItem(itemId, input) {
        return commit({ type: "classifyItem", itemId, input, now: new Date().toISOString() });
      },
      createCapture(input) {
        return commit({ type: "createCapture", input, now: new Date().toISOString() });
      },
      deleteArea(areaId, choice) {
        return commit({ type: "deleteArea", areaId, choice, now: new Date().toISOString() });
      },
      editItem(itemId, input) {
        return commit({ type: "editItem", itemId, input, now: new Date().toISOString() });
      },
      getItemSyncState(itemId) {
        if (state.rejectedWrites.some((context) => context.rowId === itemId)) {
          return "rejected";
        }

        if (state.pendingMutations.some((mutation) => mutation.rowId === itemId)) {
          return "pending";
        }

        return null;
      },
      getRejectedContextForRow(rowId) {
        return state.rejectedWrites.find((context) => context.rowId === rowId) ?? null;
      },
      postponeItem(itemId, input) {
        return commit({ type: "postponeItem", itemId, input, now: new Date().toISOString() });
      },
      restoreItemSnapshot(item) {
        return commit({ type: "restoreItemSnapshot", item, now: new Date().toISOString() });
      },
      runItemAction(itemId, action) {
        return commit({ type: "runItemAction", itemId, action, now: new Date().toISOString() });
      },
      updateSettings(input) {
        return commit({ type: "updateSettings", input, now: new Date().toISOString() });
      },
    }),
    [commit, state.pendingMutations, state.rejectedWrites],
  );

  return (
    <PlanningDataContext.Provider value={state}>
      <PlanningMutationsContext.Provider value={mutations}>
        {children}
      </PlanningMutationsContext.Provider>
    </PlanningDataContext.Provider>
  );
}

export function usePlanningData(): PlanningData {
  const syncedStore = useContext(SyncedPlanningStoreContext);
  const state = useContext(PlanningDataContext);

  if (syncedStore !== null) {
    return syncedStore.data;
  }

  return state ?? buildInitialState();
}

export function usePlanningMutations(): PlanningMutations {
  const syncedStore = useContext(SyncedPlanningStoreContext);
  const mutations = useContext(PlanningMutationsContext);

  if (syncedStore !== null) {
    return syncedStore.mutations;
  }

  if (mutations === null) {
    throw new Error("usePlanningMutations must be used within PlanningDataProvider");
  }

  return mutations;
}

export function useSyncUiState(): SyncUiState {
  const syncedStore = useContext(SyncedPlanningStoreContext);
  const state = useContext(PlanningDataContext) ?? buildInitialState();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : true,
  );
  const offline = !isOnline;

  useEffect(() => {
    function updateOnlineState() {
      setIsOnline(
        typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : true,
      );
    }

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    updateOnlineState();

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  if (syncedStore !== null) {
    return syncedStore.syncUiState;
  }

  if (state.rejectedWrites.length > 0) {
    return {
      mode: "rejected",
      labelKey: "sync.validationRejected",
      pendingCount: state.pendingMutations.length,
      rejectedCount: state.rejectedWrites.length,
    };
  }

  if (offline) {
    return {
      mode: "offline",
      labelKey: state.pendingMutations.length > 0 ? "sync.offlinePending" : "sync.offline",
      pendingCount: state.pendingMutations.length,
      rejectedCount: 0,
    };
  }

  if (state.lastSyncError !== null) {
    return {
      mode: "failed",
      labelKey: "sync.failed",
      pendingCount: state.pendingMutations.length,
      rejectedCount: 0,
    };
  }

  if (state.pendingMutations.length > 0) {
    return {
      mode: "pending",
      labelKey: "sync.pending",
      pendingCount: state.pendingMutations.length,
      rejectedCount: 0,
    };
  }

  return {
    mode: "synced",
    labelKey: "sync.synced",
    pendingCount: 0,
    rejectedCount: 0,
  };
}

export function useSyncSnapshot(): SyncSnapshot {
  const syncedStore = useContext(SyncedPlanningStoreContext);
  const state = useContext(PlanningDataContext) ?? buildInitialState();

  if (syncedStore !== null) {
    return syncedStore.syncSnapshot;
  }

  return {
    deviceId: state.deviceId,
    pendingMutations: state.pendingMutations,
    rejectedWrites: state.rejectedWrites,
  };
}

function SyncedPlanningDataProvider({ children }: PropsWithChildren) {
  const store = useSyncedPlanningStore();

  return (
    <SyncedPlanningStoreContext.Provider value={store}>
      {children}
    </SyncedPlanningStoreContext.Provider>
  );
}

export function buildInitialState(): PlanningState {
  return {
    areas: initialAreas,
    deviceId: getOrCreateDeviceId(),
    items: rawItems.map((item) => normalizeItemRow(item)),
    lastSyncError: null,
    operationHistory: initialOperationHistory,
    pendingMutations: [],
    recurringTemplates: initialRecurringTemplates,
    rejectedWrites: [],
    settings: getInitialUserSettings(),
    today: TODAY,
  };
}

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  return reducePlanningState(state, action).state;
}

function reducePlanningState(
  state: PlanningState,
  action: PlanningAction,
): { state: PlanningState; result: MutationResult } {
  if (action.type === "archiveRejectedContext") {
    return {
      state: {
        ...state,
        rejectedWrites: state.rejectedWrites.filter(
          (context) => context.localMutationId !== action.localMutationId,
        ),
      },
      result: { ok: true, mutation: null },
    };
  }

  if (action.type === "createCapture") {
    return createCapture(state, action.input, action.now);
  }

  if (action.type === "editItem") {
    return updateItem(state, action.itemId, action.now, "edit", (item) => ({
      ...item,
      area_id: action.input.areaId,
      note: action.input.note,
      title: action.input.title.trim(),
    }));
  }

  if (action.type === "classifyItem") {
    return classifyItem(state, action.itemId, action.input, action.now);
  }

  if (action.type === "postponeItem") {
    return postponeItem(state, action.itemId, action.input, action.now);
  }

  if (action.type === "restoreItemSnapshot") {
    return restoreItemSnapshot(state, action.item, action.now);
  }

  if (action.type === "deleteArea") {
    return deleteArea(state, action.areaId, action.choice, action.now);
  }

  if (action.type === "updateSettings") {
    return updateSettings(state, action.input, action.now);
  }

  return runItemAction(state, action.itemId, action.action, action.now);
}

function restoreItemSnapshot(
  state: PlanningState,
  item: LocalItemRow,
  now: string,
): { state: PlanningState; result: MutationResult } {
  if (!state.items.some((candidate) => candidate.id === item.id)) {
    return { state, result: { ok: false, error: validationError({ title: "item_not_found" }) } };
  }

  const mutation = buildMutation(state, item.id, "items", "reopen");
  const restored = {
    ...item,
    client_updated_at: now,
    updated_at: now,
    updated_by_device_id: state.deviceId,
  };

  return {
    state: {
      ...state,
      items: state.items.map((candidate) => (candidate.id === item.id ? restored : candidate)),
      pendingMutations: [...state.pendingMutations, mutation],
    },
    result: { ok: true, mutation },
  };
}

function updateSettings(
  state: PlanningState,
  input: UserSettingsInput,
  now: string,
): { state: PlanningState; result: MutationResult } {
  const candidateSettings = {
    ...state.settings,
    ...input,
    date_display_format: "YYYY-MM-DD",
    default_time_zone_mode: "floating",
  };

  if (!isUserSettingsDefaults(candidateSettings)) {
    const candidateTimeZone =
      typeof candidateSettings.time_zone === "string" ? candidateSettings.time_zone : "";
    const error = validationError(
      isValidTimeZone(candidateTimeZone)
        ? { language: "invalid_setting" }
        : { time_zone: "invalid_time_zone" },
    );

    return {
      state: appendRejectedWrite(
        state,
        SETTINGS_ROW_ID,
        "user_settings",
        "settings_update",
        error,
        now,
      ),
      result: { ok: false, error },
    };
  }

  const nextSettings: UserSettingsDefaults = candidateSettings;
  persistUserSettings(nextSettings);
  const mutation = buildMutation(state, SETTINGS_ROW_ID, "user_settings", "settings_update");

  return {
    state: {
      ...state,
      pendingMutations: [...state.pendingMutations, mutation],
      settings: nextSettings,
    },
    result: { ok: true, mutation },
  };
}

function createCapture(
  state: PlanningState,
  input: QuickAddInput,
  now: string,
): { state: PlanningState; result: MutationResult } {
  const preview = parseQuickAdd(input.sourceText, {
    locale: state.settings.locale,
    today: state.today,
  });
  const itemType = input.mode === "inbox" ? "inbox" : preview.itemTypeSuggestion;
  const effectiveItemType =
    input.mode === "suggestion" && preview.confidence === "low" && input.defaultItemType
      ? input.defaultItemType
      : itemType;
  const captureTitle = input.sourceText.trim().replace(/\s+/g, " ") || "Untitled capture";
  const row = normalizeItemRow({
    id: createId("item"),
    user_id: USER_ID,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    archived_at: null,
    hidden_reason: null,
    client_updated_at: now,
    server_updated_at: now,
    created_by_device_id: state.deviceId,
    updated_by_device_id: state.deviceId,
    revision: 0,
    item_type: effectiveItemType,
    title: input.mode === "inbox" ? captureTitle : preview.cleanTitle,
    note: null,
    status: "active",
    area_id: null,
    scheduled_date:
      effectiveItemType === "date_task"
        ? (preview.fields.scheduled_date ?? input.defaultScheduledDate ?? null)
        : null,
    scheduled_time_zone_mode: effectiveItemType === "date_task" ? "floating" : null,
    deadline_date:
      effectiveItemType === "deadline_task" ? (preview.fields.deadline_date ?? null) : null,
    deadline_time:
      effectiveItemType === "deadline_task" ? (preview.fields.deadline_time ?? null) : null,
    deadline_time_zone_mode:
      effectiveItemType === "deadline_task"
        ? ((preview.fields.deadline_time_zone_mode as "date_only" | "floating" | null) ??
          "date_only")
        : null,
    review_date: effectiveItemType === "idea" ? (preview.fields.review_date ?? null) : null,
    quick_add_source_text: input.sourceText,
    quick_add_parse_result: {
      confidence: preview.confidence,
      recognized_fragments: preview.recognizedFragments,
      warnings: preview.warnings,
    },
  });
  const mutation = buildMutation(state, row.id, "items", "create");

  return {
    state: {
      ...state,
      items: [row, ...state.items],
      pendingMutations: [...state.pendingMutations, mutation],
    },
    result: { ok: true, mutation },
  };
}

function classifyItem(
  state: PlanningState,
  itemId: string,
  input: ClassificationInput,
  now: string,
): { state: PlanningState; result: MutationResult } {
  if (input.targetType === "recurring_template") {
    return updateItem(
      state,
      itemId,
      now,
      "classify",
      (item) => ({
        ...item,
        hidden_reason: "converted_to_recurring_template",
        updated_at: now,
        client_updated_at: now,
      }),
      {
        eventType: "converted_to_recurring_template",
        newValue: { hidden_reason: "converted_to_recurring_template" },
        previousValue: { hidden_reason: null },
      },
    );
  }

  const targetType = input.targetType;

  return updateItem(state, itemId, now, "classify", (item) => ({
    ...item,
    item_type: targetType,
    scheduled_date: targetType === "date_task" ? input.scheduledDate : null,
    scheduled_time_zone_mode: targetType === "date_task" ? "floating" : null,
    deadline_date: targetType === "deadline_task" ? input.deadlineDate : null,
    deadline_time_zone_mode: targetType === "deadline_task" ? "date_only" : null,
    review_date: targetType === "idea" ? state.today : null,
  }));
}

function postponeItem(
  state: PlanningState,
  itemId: string,
  input: PostponeInput,
  now: string,
): { state: PlanningState; result: MutationResult } {
  return updateItem(
    state,
    itemId,
    now,
    "postpone",
    (item) => {
      if (item.item_type === "deadline_task") {
        return {
          ...item,
          planned_work_date: input.targetDate,
          status: "postponed",
        };
      }

      if (item.item_type === "idea") {
        return {
          ...item,
          review_date: input.targetDate,
        };
      }

      return {
        ...item,
        scheduled_date: input.targetDate,
        scheduled_time_zone_mode: "floating",
        status: "postponed",
      };
    },
    {
      eventType: "postponed",
      newValue: { target_date: input.targetDate },
      previousValue: {},
    },
  );
}

function runItemAction(
  state: PlanningState,
  itemId: string,
  action: ItemActionId,
  now: string,
): { state: PlanningState; result: MutationResult } {
  const semantic = getSemanticActionPatch(action, now);

  if (semantic === null) {
    return {
      state,
      result: { ok: false, error: validationError({ status: "unsupported_item_action" }) },
    };
  }

  return updateItem(
    state,
    itemId,
    now,
    semantic.contextAction,
    (item) => ({
      ...item,
      ...semantic.patch,
    }),
    {
      eventType: semantic.eventType,
      newValue: semantic.patch,
      previousValue: {},
    },
  );
}

function deleteArea(
  state: PlanningState,
  areaId: string,
  choice: AreaDeleteChoice,
  now: string,
): { state: PlanningState; result: MutationResult } {
  if (!state.areas.some((area) => area.id === areaId)) {
    return { state, result: { ok: false, error: validationError({ title: "area_not_found" }) } };
  }

  const mutation = buildMutation(state, areaId, "areas", "area_delete");
  const assignedItems = state.items.filter((item) => item.area_id === areaId);
  const updatedItems = state.items.map((item) => {
    if (item.area_id !== areaId) {
      return item;
    }

    if (choice === "area_only") {
      return {
        ...item,
        area_id: null,
        client_updated_at: now,
        updated_at: now,
        updated_by_device_id: state.deviceId,
      };
    }

    return {
      ...item,
      deleted_at: now,
      client_updated_at: now,
      updated_at: now,
      updated_by_device_id: state.deviceId,
    };
  });
  const history =
    choice === "area_and_items"
      ? assignedItems.map((item) =>
          buildOperationHistory(state, item, "deleted", now, mutation.idempotencyKey, {
            previousValue: { deleted_at: item.deleted_at, area_id: areaId },
            newValue: { deleted_at: now },
          }),
        )
      : [];

  return {
    state: {
      ...state,
      areas: state.areas.filter((area) => area.id !== areaId),
      items: updatedItems,
      operationHistory: [...state.operationHistory, ...history],
      pendingMutations: [...state.pendingMutations, mutation],
    },
    result: { ok: true, mutation },
  };
}

function updateItem(
  state: PlanningState,
  itemId: string,
  now: string,
  contextAction: RejectedWriteContext["action"],
  project: (item: LocalItemRow) => LocalItemRow,
  operation?: {
    eventType: OperationEventType;
    newValue: JsonObject;
    previousValue: JsonObject;
  },
): { state: PlanningState; result: MutationResult } {
  const item = state.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return { state, result: { ok: false, error: validationError({ title: "item_not_found" }) } };
  }

  const projected = {
    ...project(item),
    client_updated_at: now,
    updated_at: now,
    updated_by_device_id: state.deviceId,
  };
  const parsed = safeNormalizeItemRow(projected);

  if (!parsed.ok) {
    return {
      state: appendRejectedWrite(state, item.id, "items", contextAction, parsed.error, now),
      result: { ok: false, error: parsed.error },
    };
  }

  if (item.status !== parsed.row.status) {
    const transition = validateStatusTransition(item.status, parsed.row.status);
    if (!transition.ok) {
      return {
        state: appendRejectedWrite(state, item.id, "items", contextAction, transition.error, now),
        result: transition,
      };
    }
  }

  const mutation = buildMutation(state, item.id, "items", contextAction);
  const history = operation
    ? [
        buildOperationHistory(state, item, operation.eventType, now, mutation.idempotencyKey, {
          previousValue:
            Object.keys(operation.previousValue).length > 0
              ? operation.previousValue
              : pickMeaningfulPreviousValue(item, operation.newValue),
          newValue: operation.newValue,
        }),
      ]
    : [];

  return {
    state: {
      ...state,
      items: state.items.map((candidate) => (candidate.id === item.id ? parsed.row : candidate)),
      operationHistory: [...state.operationHistory, ...history],
      pendingMutations: [...state.pendingMutations, mutation],
    },
    result: { ok: true, mutation },
  };
}

function appendRejectedWrite(
  state: PlanningState,
  rowId: string,
  table: RejectedWriteContext["table"],
  action: RejectedWriteContext["action"],
  error: ContractError,
  now: string,
): PlanningState {
  const mutation = buildMutation(state, rowId, table, action);
  const rejected: RejectedWriteContext = {
    ...mutation,
    errorCode: error.code,
    fieldErrors: error.fields,
    retryable: error.retryable,
    createdAt: now,
  };

  return {
    ...state,
    rejectedWrites: [...state.rejectedWrites, rejected],
  };
}

function buildMutation(
  state: PlanningState,
  rowId: string,
  table: RejectedWriteContext["table"],
  action: RejectedWriteContext["action"],
): LocalMutationContext {
  const clientActionId = createId("action");
  const idempotencyKey = buildActionIdempotencyKey(USER_ID, state.deviceId, clientActionId);

  return {
    action,
    clientActionId,
    idempotencyKey,
    localMutationId: createId("mutation"),
    rowId,
    table,
  };
}

function buildOperationHistory(
  state: PlanningState,
  item: LocalItemRow,
  eventType: OperationEventType,
  now: string,
  idempotencyKey: string,
  values: { previousValue: JsonObject; newValue: JsonObject },
): MinimalOperationHistoryRow {
  return {
    id: createId("op"),
    user_id: USER_ID,
    item_id: item.id,
    recurring_template_id: item.recurring_template_id,
    event_type: eventType,
    previous_value: values.previousValue,
    new_value: values.newValue,
    reason: null,
    idempotency_key: idempotencyKey,
    created_at: now,
    created_by_device_id: state.deviceId,
  };
}

function getSemanticActionPatch(
  action: ItemActionId,
  now: string,
): {
  contextAction: RejectedWriteContext["action"];
  eventType: OperationEventType;
  patch: Partial<LocalItemRow>;
} | null {
  switch (action) {
    case "complete":
      return { contextAction: "complete", eventType: "completed", patch: { status: "completed" } };
    case "hold":
      return { contextAction: "hold", eventType: "on_hold", patch: { status: "on_hold" } };
    case "abandon":
      return { contextAction: "abandon", eventType: "abandoned", patch: { status: "abandoned" } };
    case "reopen":
      return { contextAction: "reopen", eventType: "reopened", patch: { status: "active" } };
    case "restore":
      return {
        contextAction: "restore",
        eventType: "restored",
        patch: { archived_at: null, deleted_at: null, hidden_reason: null, status: "active" },
      };
    case "archive":
      return { contextAction: "archive", eventType: "archived", patch: { archived_at: now } };
    case "delete":
      return { contextAction: "delete", eventType: "deleted", patch: { deleted_at: now } };
    default:
      return null;
  }
}

function pickMeaningfulPreviousValue(item: LocalItemRow, newValue: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.keys(newValue).map((key) => [key, item[key as keyof LocalItemRow] ?? null]),
  );
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function getOrCreateDeviceId(): string {
  if (typeof localStorage === "undefined") {
    return DEVICE_ID;
  }

  const existing = localStorage.getItem("yasumi:device-id");
  if (existing) {
    return existing;
  }

  const deviceId = createId("device");
  localStorage.setItem("yasumi:device-id", deviceId);
  return deviceId;
}

function getInitialUserSettings(): UserSettingsDefaults {
  const stored = readStoredUserSettings();

  if (stored) {
    return stored;
  }

  const deviceTimeZone = getDefaultDeviceTimeZone();
  const supportedTimeZone = [
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Europe/London",
    "America/New_York",
  ].includes(deviceTimeZone)
    ? deviceTimeZone
    : "Asia/Tokyo";

  return buildDefaultUserSettings(resolveLocalLanguagePreference(), supportedTimeZone);
}

function readStoredUserSettings(): UserSettingsDefaults | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return isUserSettingsDefaults(parsed) ? parsed : null;
  } catch {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    return null;
  }
}

function persistUserSettings(settings: UserSettingsDefaults): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function buildOrdinaryActionKey(userId: string, deviceId: string, clientActionId: string) {
  return buildActionIdempotencyKey(userId, deviceId, clientActionId);
}

export function buildRecurringActionKey(
  userId: string,
  recurringTemplateId: string,
  sequence: number,
  actionType: "complete" | "skip",
) {
  return buildRecurrenceActionIdempotencyKey(userId, recurringTemplateId, sequence, actionType);
}

export function buildRecurringGenerationKey(
  userId: string,
  recurringTemplateId: string,
  nextSequence: number,
) {
  return buildRecurrenceGenerationIdempotencyKey(userId, recurringTemplateId, nextSequence);
}
