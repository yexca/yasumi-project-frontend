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

afterEach(() => {
  cleanup();
  localStorage.clear();
  testIndexedDbStores.clear();
  vi.clearAllMocks();
});
