import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCollage } from "./collage";
import { ROLE_FOR_SLOT, WORLD_ROLES, backgroundFallbackOrder, deviceFor } from "./roles";

describe("world roles", () => {
  it("defines the 24 roles from the blueprint", () => {
    assert.equal(WORLD_ROLES.length, 24);
    assert.equal(new Set(WORLD_ROLES.map((r) => r.id)).size, 24);
  });
  it("maps the slot-backed roles onto the existing 50 slots", () => {
    assert.deepEqual(
      Object.keys(ROLE_FOR_SLOT).map(Number).sort((a, b) => a - b),
      [1, 2, 3, 4, 11, 12, 13, 14, 20, 42, 44, 47],
    );
  });
  it("picks devices and falls back desktop → tablet → mobile", () => {
    assert.equal(deviceFor(390, 844), "mobile");
    assert.equal(deviceFor(1024, 768), "tablet");
    assert.equal(deviceFor(1366, 1024), "tablet");
    assert.equal(deviceFor(1440, 900), "desktop");
    assert.equal(deviceFor(1920, 1080), "desktop");
    assert.deepEqual(backgroundFallbackOrder("mobile"), ["bg-mobile", "bg-desktop", "bg-tablet"]);
    assert.deepEqual(backgroundFallbackOrder("desktop"), ["bg-desktop", "bg-tablet", "bg-mobile"]);
  });
});

describe("collage", () => {
  const safe = { x: 480, y: 40, w: 480, h: 1000 };
  const build = (mode: "full" | "light" | "off", device: "desktop" | "mobile" = "desktop") =>
    buildCollage({ seed: "jinx", width: 1440, height: 1100, device, mode, safe });

  it("is deterministic per world and device", () => {
    assert.deepEqual(build("full"), build("full"));
    assert.notDeepEqual(buildCollage({ seed: "pearl-boy", width: 1440, height: 1100, device: "desktop", mode: "full", safe }), build("full"));
  });
  it("fills the wall but never puts a tile fully under the sheet", () => {
    const { tiles } = build("full");
    assert.ok(tiles.length >= 15, `${tiles.length}`);
    for (const t of tiles) assert.ok(!(t.x >= safe.x && t.x + t.w <= safe.x + safe.w && t.y >= safe.y && t.y + t.h <= safe.y + safe.h));
  });
  it("accents never touch the sheet", () => {
    for (const a of build("full").accents) {
      assert.ok(a.x + a.size <= safe.x || a.x >= safe.x + safe.w || a.y + a.size <= safe.y || a.y >= safe.y + safe.h);
    }
  });
  it("light is sparser than full; off is empty", () => {
    assert.ok(build("light").tiles.length < build("full").tiles.length);
    assert.equal(build("off").tiles.length, 0);
  });
  it("covers the full height", () => {
    const bottom = Math.max(...build("full").tiles.map((t) => t.y + t.h));
    assert.ok(bottom >= 1100);
  });
});
