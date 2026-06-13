import { parseApiErrorDto, type ApiErrorDto } from "./dtos";
import { getBackendBaseUrl } from "./config";

export class DirectApiError extends Error {
  readonly detail: ApiErrorDto;
  readonly status: number;

  constructor(status: number, detail: ApiErrorDto) {
    super(detail.code);
    this.detail = detail;
    this.status = status;
  }
}

export async function directApiJson<T>(
  path: string,
  options: {
    accessToken?: string | null;
    body?: unknown;
    method?: "GET" | "POST";
    parse: (input: unknown) => T;
  },
): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json; charset=utf-8" }),
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch((): unknown => ({
      code: "service_unavailable",
      fields: {},
      message: "Direct API request failed without a JSON error body.",
      retryable: true,
    }));
    throw new DirectApiError(response.status, parseApiErrorDto(body));
  }

  return options.parse(await response.json());
}
