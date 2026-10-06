import type { Asset, AssetCategory } from "./types";

/**
 * Asset storage boundary. The local version keeps blobs in IndexedDB (not
 * base64, not in the config). A Supabase version would upload to a private
 * Storage bucket, keep metadata in an `assets` table, and return signed URLs
 * from getUrl().
 */
export interface AssetStore {
  list(): Promise<Asset[]>;
  add(file: Blob, meta: { fileName: string; category: AssetCategory; mimeType: string; width: number; height: number }): Promise<Asset>;
  /** Swap the image behind an asset. Every slot using it updates. */
  replace(id: string, file: Blob, meta: { fileName: string; mimeType: string; width: number; height: number }): Promise<Asset>;
  update(id: string, patch: Partial<Pick<Asset, "name" | "category">>): Promise<Asset>;
  remove(id: string): Promise<void>;
  /** A URL an <img> can display. */
  getUrl(id: string): Promise<string | null>;
}

const DB_NAME = "melted-butter-assets";
const META = "assets";
const BLOBS = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Couldn't open image storage."));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Image storage failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Image storage was interrupted (storage may be full)."));
  });
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const baseName = (fileName: string) => fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled";

export function createLocalAssetStore(): AssetStore {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => (dbPromise ??= openDb());
  const urls = new Map<string, string>();

  const dropUrl = (id: string) => {
    const url = urls.get(id);
    if (url) URL.revokeObjectURL(url);
    urls.delete(id);
  };

  async function getMeta(id: string): Promise<Asset> {
    const tx = (await db()).transaction(META, "readonly");
    const asset = await req<Asset | undefined>(tx.objectStore(META).get(id));
    if (!asset) throw new Error("That image no longer exists.");
    return asset;
  }

  return {
    async list() {
      const tx = (await db()).transaction(META, "readonly");
      const all = await req<Asset[]>(tx.objectStore(META).getAll());
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async add(file, meta) {
      const id = newId();
      const now = new Date().toISOString();
      const asset: Asset = {
        id,
        name: baseName(meta.fileName),
        fileName: meta.fileName,
        category: meta.category,
        mimeType: meta.mimeType,
        size: file.size,
        width: meta.width,
        height: meta.height,
        storagePath: `local:${id}`,
        createdAt: now,
        updatedAt: now,
      };
      const tx = (await db()).transaction([META, BLOBS], "readwrite");
      tx.objectStore(BLOBS).put(file, id);
      tx.objectStore(META).put(asset);
      await done(tx);
      return asset;
    },

    async replace(id, file, meta) {
      const current = await getMeta(id);
      const asset: Asset = {
        ...current,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        size: file.size,
        width: meta.width,
        height: meta.height,
        updatedAt: new Date().toISOString(),
      };
      const tx = (await db()).transaction([META, BLOBS], "readwrite");
      tx.objectStore(BLOBS).put(file, id);
      tx.objectStore(META).put(asset);
      await done(tx);
      dropUrl(id);
      return asset;
    },

    async update(id, patch) {
      const asset = { ...(await getMeta(id)), ...patch, updatedAt: new Date().toISOString() };
      const tx = (await db()).transaction(META, "readwrite");
      tx.objectStore(META).put(asset);
      await done(tx);
      return asset;
    },

    async remove(id) {
      const tx = (await db()).transaction([META, BLOBS], "readwrite");
      tx.objectStore(META).delete(id);
      tx.objectStore(BLOBS).delete(id);
      await done(tx);
      dropUrl(id);
    },

    async getUrl(id) {
      const cached = urls.get(id);
      if (cached) return cached;
      const tx = (await db()).transaction(BLOBS, "readonly");
      const blob = await req<Blob | undefined>(tx.objectStore(BLOBS).get(id));
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urls.set(id, url);
      return url;
    },
  };
}
