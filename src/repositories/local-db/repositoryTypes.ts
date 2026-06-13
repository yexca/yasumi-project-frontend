import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
} from "@/repositories/direct-api/dtos";
import type {
  AreaDto,
  ItemDto,
  LocalItemRow,
  OperationHistoryDto,
  RecurringTaskTemplateDto,
} from "@/domain/items/schemas";

export type Unsubscribe = () => void;

export type WatchCallback<T> = (rows: T[]) => void;

export interface AuthRepository {
  register(request: RegisterRequestDto): Promise<AuthResponseDto>;
  login(request: LoginRequestDto): Promise<AuthResponseDto>;
  logout(): Promise<void>;
  refreshSession(refreshToken: string): Promise<AuthResponseDto>;
}

export interface SyncTokenRepository {
  getToken(): Promise<{ token: string; expires_at: string }>;
}

export interface HealthRepository {
  getReadiness(): Promise<{ ok: boolean }>;
}

export interface LocalItemRepository {
  watchTodayEligibleRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchInboxRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchUpcomingRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchDeadlineRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchIdeaRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchCompletedRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  watchArchiveRows(callback: WatchCallback<LocalItemRow>): Unsubscribe;
  insertLocalItem(item: ItemDto): Promise<void>;
  updateLocalItem(item: ItemDto): Promise<void>;
}

export interface LocalAreaRepository {
  watchAreas(callback: WatchCallback<AreaDto>): Unsubscribe;
}

export interface LocalRecurringTemplateRepository {
  watchRecurringTemplates(callback: WatchCallback<RecurringTaskTemplateDto>): Unsubscribe;
}

export interface LocalSettingsRepository<TSettings> {
  watchUserSettings(callback: (settings: TSettings | null) => void): Unsubscribe;
}

export interface OperationHistoryRepository {
  watchItemHistory(itemId: string, callback: WatchCallback<OperationHistoryDto>): Unsubscribe;
  insertOperation(operation: OperationHistoryDto): Promise<void>;
}
