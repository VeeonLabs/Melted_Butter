import { seededRandom } from "../config/reactionEngine";
import type { Device } from "./roles";

/**
 * Deterministic collage packing. Tiles are laid out as a masonry wall across
 * the whole stage; the scene "sheet" sits above them, so the board, cards and
 * controls are protected by layout rather than by careful positioning. Tiles
 * entirely hidden behind the sheet are dropped (never rendered, never loaded).
 */
export type TileKind = "panel" | "photo" | "film" | "paper" | "note";
export type CollageMode = "full" | "light" | "off";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageTile extends Rect {
  id: string;
  kind: TileKind;
  rotate: number;
  /** Index into the world's owner-supplied collage pieces (cycled). */
  piece: number;
  tape: boolean;
}

export interface CollageAccent {
  id: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  motif: number;
}

const COLUMNS: Record<Device, number> = { desktop: 8, tablet: 6, mobile: 4 };
const KINDS: TileKind[] = ["panel", "photo", "panel", "paper", "panel", "film", "photo", "note"];

const inside = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function buildCollage(opts: {
  seed: string;
  width: number;
  height: number;
  device: Device;
  mode: CollageMode;
  /** The protected sheet (board, cards, controls) in stage coordinates. */
  safe: Rect | null;
}): { tiles: CollageTile[]; accents: CollageAccent[] } {
  const { seed, width, height, device, mode, safe } = opts;
  if (mode === "off" || width < 50 || height < 50) return { tiles: [], accents: [] };
  const rand = seededRandom(`${seed}:${device}`);
  const cols = COLUMNS[device];
  const colW = width / cols;
  const tiles: CollageTile[] = [];
  let n = 0;

  for (let c = 0; c < cols; c++) {
    // Light mode keeps only the outermost columns.
    if (mode === "light" && c !== 0 && c !== cols - 1) continue;
    let y = -colW * 0.25 * rand();
    while (y < height) {
      const h = colW * (0.85 + rand() * 0.75);
      const pad = colW * 0.06;
      const t: CollageTile = {
        id: `t${n}`,
        x: c * colW + pad * (rand() - 0.5) * 2 - colW * 0.04,
        y,
        w: colW * 1.08,
        h,
        kind: KINDS[Math.floor(rand() * KINDS.length)],
        rotate: (rand() - 0.5) * 6,
        piece: n,
        tape: rand() < 0.28,
      };
      y += h * (0.86 + rand() * 0.08);
      n++;
      if (safe && inside(t, { x: safe.x - 6, y: safe.y - 6, w: safe.w + 12, h: safe.h + 12 })) continue;
      tiles.push(t);
    }
  }

  // Decorative accents: few, outside the sheet, on top of the tiles.
  const accents: CollageAccent[] = [];
  const target = mode === "light" ? 3 : device === "mobile" ? 4 : device === "tablet" ? 6 : 8;
  for (let i = 0, tries = 0; accents.length < target && tries < 80; tries++, i++) {
    const size = (device === "mobile" ? 64 : 104) * (0.75 + rand() * 0.6);
    const a = { x: rand() * (width - size), y: rand() * (height - size), w: size, h: size };
    if (safe && overlaps(a, safe)) continue;
    accents.push({ id: `a${i}`, x: a.x, y: a.y, size, rotate: (rand() - 0.5) * 40, motif: Math.floor(rand() * 1000) });
  }
  return { tiles, accents };
}
