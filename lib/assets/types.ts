export type AssetCategory = "player" | "character" | "reaction" | "comic" | "background" | "moment" | "symbol" | "identity" | "other";

export const ASSET_CATEGORIES: readonly { id: AssetCategory; label: string }[] = [
  { id: "player", label: "Player" },
  { id: "character", label: "Character" },
  { id: "reaction", label: "Reaction" },
  { id: "comic", label: "Comic panel" },
  { id: "background", label: "Background" },
  { id: "moment", label: "Special moment" },
  { id: "symbol", label: "Symbol" },
  { id: "identity", label: "Logo & artwork" },
  { id: "other", label: "Other" },
];

/**
 * Metadata for one uploaded image. The binary itself lives in blob storage
 * (IndexedDB now, Supabase Storage later), never inside the config.
 *
 * Slot assignment and active status are derived from GameConfig rather than
 * stored here, because one asset can fill several slots at once.
 */
export interface Asset {
  id: string;
  name: string;
  fileName: string;
  category: AssetCategory;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  /** Storage location. "local:<id>" now; a bucket path such as "assets/<id>.webp" with Supabase. */
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}
