const DATABASE_NAME = "yasumi-local-backgrounds";
const DATABASE_VERSION = 1;
const STORE_NAME = "background-assets";

export const MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_BACKGROUND_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type StoredBackgroundAsset = {
  blob: Blob;
  id: string;
  type: string;
};

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error("Local background storage failed.");
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onerror = () => reject(normalizeError(request.error));
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME));

    request.onerror = () => reject(normalizeError(request.error));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(normalizeError(transaction.error));
    };
  });
}

export function validateBackgroundImage(file: File) {
  if (
    !SUPPORTED_BACKGROUND_IMAGE_TYPES.includes(
      file.type as (typeof SUPPORTED_BACKGROUND_IMAGE_TYPES)[number],
    )
  ) {
    return "unsupported_type" as const;
  }

  if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
    return "too_large" as const;
  }

  return null;
}

export async function saveBackgroundAsset(file: File) {
  const id = crypto.randomUUID();
  const asset: StoredBackgroundAsset = { blob: file, id, type: file.type };

  await withStore("readwrite", (store) => store.put(asset));

  return {
    assetId: id,
    objectUrl: URL.createObjectURL(file),
  };
}

export async function loadBackgroundAsset(assetId: string) {
  const asset = await withStore<StoredBackgroundAsset | undefined>("readonly", (store) => {
    const request = store.get(assetId) as IDBRequest<StoredBackgroundAsset | undefined>;

    return request;
  });

  return asset ? URL.createObjectURL(asset.blob) : null;
}

export async function deleteBackgroundAsset(assetId: string) {
  await withStore("readwrite", (store) => store.delete(assetId));
}
