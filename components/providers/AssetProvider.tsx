"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createLocalAssetStore, type AssetStore } from "@/lib/assets/assetStore";
import type { Asset, AssetCategory } from "@/lib/assets/types";
import { validateImageFile } from "@/lib/assets/validation";

interface AssetContextValue {
  assets: Asset[];
  ready: boolean;
  hasAsset: (id: string) => boolean;
  getAsset: (id: string) => Asset | undefined;
  urlFor: (id: string | null | undefined) => string | null;
  requestUrl: (id: string) => void;
  /** Validates, stores and returns the new asset. Throws with a readable message on failure. */
  upload: (file: File, category: AssetCategory) => Promise<Asset>;
  replace: (id: string, file: File) => Promise<Asset>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const AssetContext = createContext<AssetContextValue | null>(null);

let sharedStore: AssetStore | null = null;
const defaultStore = () => (sharedStore ??= createLocalAssetStore());

export function AssetProvider({ children, store }: { children: ReactNode; store?: AssetStore }) {
  const assetStore = store ?? defaultStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [ready, setReady] = useState(false);
  const [urls, setUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let alive = true;
    assetStore
      .list()
      .then((list) => alive && setAssets(list))
      .catch(() => alive && setAssets([]))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [assetStore]);

  const requestUrl = useCallback(
    (id: string) => {
      assetStore
        .getUrl(id)
        .then((url) => setUrls((prev) => (prev[id] === url ? prev : { ...prev, [id]: url })))
        .catch(() => setUrls((prev) => ({ ...prev, [id]: null })));
    },
    [assetStore],
  );

  const value = useMemo<AssetContextValue>(() => {
    const byId = new Map(assets.map((a) => [a.id, a]));
    return {
      assets,
      ready,
      hasAsset: (id) => byId.has(id),
      getAsset: (id) => byId.get(id),
      urlFor: (id) => (id && byId.has(id) ? (urls[id] ?? null) : null),
      requestUrl,
      async upload(file, category) {
        const check = await validateImageFile(file);
        if (!check.ok) throw new Error(check.error);
        const asset = await assetStore.add(file, {
          fileName: file.name,
          category,
          mimeType: check.mimeType,
          width: check.width,
          height: check.height,
        });
        setAssets((prev) => [asset, ...prev]);
        return asset;
      },
      async replace(id, file) {
        const check = await validateImageFile(file);
        if (!check.ok) throw new Error(check.error);
        const asset = await assetStore.replace(id, file, {
          fileName: file.name,
          mimeType: check.mimeType,
          width: check.width,
          height: check.height,
        });
        setAssets((prev) => prev.map((a) => (a.id === id ? asset : a)));
        setUrls((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return asset;
      },
      async rename(id, name) {
        const asset = await assetStore.update(id, { name: name.trim() || "Untitled" });
        setAssets((prev) => prev.map((a) => (a.id === id ? asset : a)));
      },
      async remove(id) {
        await assetStore.remove(id);
        setAssets((prev) => prev.filter((a) => a.id !== id));
        setUrls((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    };
  }, [assets, ready, urls, requestUrl, assetStore]);

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function useAssets(): AssetContextValue {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used inside <AssetProvider>.");
  return ctx;
}

/** Displayable URL for an asset id, loading it on first use. */
export function useAssetUrl(id: string | null | undefined): string | null {
  const { urlFor, requestUrl, hasAsset } = useAssets();
  const url = urlFor(id);
  const known = !!id && hasAsset(id);
  useEffect(() => {
    if (id && known && url === null) requestUrl(id);
  }, [id, known, url, requestUrl]);
  return url;
}
