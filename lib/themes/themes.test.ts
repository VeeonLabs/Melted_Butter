import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contrastProblems, contrastRatio } from "./contrast";
import { MOTIF_IDS } from "./motifs";
import { THEMES, THEME_ORDER } from "./registry";

const COMIC = [
  "Pearl Boy", "Low Tide in Twilight", "Roses and Champagne", "Painter of the Night", "Codename: Anastasia",
  "Nerd Project", "Passion", "Jinx", "Love Jinx", "Borderline", "Room Without Windows", "Blossoms of the White Night",
];
const GENERAL = ["Pearl", "Manhwa", "Comic", "Space", "Moonlight", "Roses", "Blossoms", "Hamster", "Dark Romance", "Graffiti", "Custom"];
const REQUIRED = [...COMIC, ...GENERAL];

/** The structural choices that make a theme a different world rather than a recolour. */
const DIMENSIONS = (id: (typeof THEME_ORDER)[number]) => {
  const t = THEMES[id];
  return [
    t.players.layout, t.players.card, t.board.style, t.board.frame, t.surfaces.card, t.surfaces.button,
    t.surfaces.texture, t.typography.display, t.typography.title, t.background.recipe, t.reactions.style,
    t.chapters.style, t.chat.bubble, t.motion.personality, t.artwork.pieces.map((p) => p.motif).sort().join("+"),
  ];
};

describe("theme packages", () => {
  it("includes all 23 required themes with unique ids", () => {
    assert.deepEqual(THEME_ORDER.map((id) => THEMES[id].identity.name).sort(), [...REQUIRED].sort());
    assert.equal(new Set(THEME_ORDER).size, 23);
    assert.deepEqual(THEME_ORDER.filter((id) => THEMES[id].identity.kind === "comic").map((id) => THEMES[id].identity.name), COMIC);
    for (const id of THEME_ORDER) assert.equal(THEMES[id].id, id);
  });

  it("every palette meets contrast minimums", () => {
    const failures = THEME_ORDER.flatMap((id) => contrastProblems(THEMES[id].colors).map((p) => `${id}: ${p}`));
    assert.deepEqual(failures, []);
  });

  it("player colours are distinguishable from each other", () => {
    for (const id of THEME_ORDER) {
      const { playerOne, playerTwo } = THEMES[id].colors;
      assert.ok(playerOne !== playerTwo, id);
    }
  });

  it("each theme composes 2–4 artwork pieces with valid motifs and unique ids", () => {
    for (const id of THEME_ORDER) {
      const pieces = THEMES[id].artwork.pieces;
      assert.ok(pieces.length >= 2 && pieces.length <= 4, `${id}: ${pieces.length}`);
      assert.equal(new Set(pieces.map((p) => p.id)).size, pieces.length, id);
      for (const p of pieces) {
        assert.ok(MOTIF_IDS.includes(p.motif), `${id}/${p.id}`);
        assert.ok(Math.abs(p.rotate) <= 25, `${id}/${p.id} rotation too extreme`);
      }
      // Something must stay visible on phones, so no theme looks empty there.
      assert.ok(pieces.some((p) => p.mobile !== "hide"), `${id} hides all art on mobile`);
    }
  });

  it("themes are structurally different, not recolours", () => {
    const ids = THEME_ORDER;
    let worst = { a: "", b: "", diff: Infinity };
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const A = DIMENSIONS(ids[i]);
        const B = DIMENSIONS(ids[j]);
        const diff = A.filter((v, k) => v !== B[k]).length;
        if (diff < worst.diff) worst = { a: ids[i], b: ids[j], diff };
      }
    }
    assert.ok(worst.diff >= 5, `${worst.a} vs ${worst.b} differ in only ${worst.diff} of ${DIMENSIONS("pearl").length} dimensions`);
  });

  it("the flagship and the six showcase themes each have their own layout or board", () => {
    const showcase = ["pearl-boy", "jinx", "painter", "roses-champagne", "low-tide", "graffiti"] as const;
    const combos = new Set(showcase.map((id) => `${THEMES[id].players.layout}/${THEMES[id].board.style}/${THEMES[id].board.frame}`));
    assert.equal(combos.size, showcase.length);
  });

  it("comic worlds use the full collage wall with their own accent language", () => {
    for (const id of THEME_ORDER) {
      const t = THEMES[id];
      if (t.identity.kind === "comic") assert.equal(t.collage.mode, "full", id);
      for (const m of t.collage.accents) assert.ok(MOTIF_IDS.includes(m), `${id}/${m}`);
    }
  });

  it("contrast helper is correct", () => {
    assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
    assert.equal(contrastRatio("#777777", "#777777"), 1);
  });
});
