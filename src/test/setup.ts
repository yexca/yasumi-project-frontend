import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

type TestIndexedDbRecord = Record<string, unknown>;

class TestIdbRequest<T> {
  error: Error | null = null;
  onerror: (() => void) | null = null;
  onsuccess: (() => void) | null = null;
  onupgradeneeded: (() => void) | null = null;
  result!: T;
}

const testIndexedDbStores = new Map<string, TestIndexedDbRecord>();

class TestObjectStore {
  delete(id: string) {
    const request = new TestIdbRequest<undefined>();

    queueMicrotask(() => {
      testIndexedDbStores.delete(id);
      request.result = undefined;
      request.onsuccess?.();
    });

    return request;
  }

  get(id: string) {
    const request = new TestIdbRequest<TestIndexedDbRecord | undefined>();

    queueMicrotask(() => {
      request.result = testIndexedDbStores.get(id);
      request.onsuccess?.();
    });

    return request;
  }

  put(record: TestIndexedDbRecord & { id: string }) {
    const request = new TestIdbRequest<string>();

    queueMicrotask(() => {
      testIndexedDbStores.set(record.id, record);
      request.result = record.id;
      request.onsuccess?.();
    });

    return request;
  }
}

class TestTransaction {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  error: Error | null = null;

  objectStore() {
    queueMicrotask(() => this.oncomplete?.());

    return new TestObjectStore();
  }
}

class TestDatabase {
  close() {}

  createObjectStore() {
    return new TestObjectStore();
  }

  transaction() {
    return new TestTransaction();
  }
}

Object.defineProperty(globalThis, "indexedDB", {
  configurable: true,
  value: {
    open() {
      const request = new TestIdbRequest<TestDatabase>();

      queueMicrotask(() => {
        request.result = new TestDatabase();
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request;
    },
  },
});

Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: {
    randomUUID: vi.fn(() => "test-background-id"),
  },
});

URL.createObjectURL = vi.fn(() => "blob:test-background");
URL.revokeObjectURL = vi.fn();

const defaultFetchMock = (input: RequestInfo | URL): Promise<Response> => {
  const url =
    typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();

  if (url.includes("/v1/profile/password")) {
    return Promise.resolve(new Response(null, { status: 204 }));
  }

  if (url.includes("/v1/profile")) {
    return Promise.resolve(
      Response.json({
        user: {
          id: "test-user",
          username: "test-user",
          email: "test-user@example.com",
          display_name: "Quiet Planner",
        },
      }),
    );
  }

  if (url.includes("/v1/weather")) {
    return Promise.resolve(
      Response.json({
        city: "Tokyo",
        summary: "Partly cloudy",
        temperature: 24,
        unit: "C",
      }),
    );
  }

  return Promise.resolve(
    Response.json(
      {
        code: "service_unavailable",
        fields: {},
        message: "Unhandled test request.",
        retryable: true,
      },
      { status: 503 },
    ),
  );
};

globalThis.fetch = vi.fn(defaultFetchMock);

afterEach(() => {
  cleanup();
  localStorage.clear();
  testIndexedDbStores.clear();
  vi.clearAllMocks();
  vi.mocked(fetch).mockImplementation(defaultFetchMock);
});

export function seedAuthSession() {
  localStorage.setItem(
    "yasumi:auth-session",
    JSON.stringify({
      accessToken: "test-access-token",
      expiresAt: "2099-01-01T00:00:00Z",
      refreshToken: "test-refresh-token",
      user: {
        id: "test-user",
        username: "test-user",
        email: "test-user@example.com",
        display_name: "Test User",
      },
    }),
  );
}
