import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultConfig } from "./defaults";
import { normalizeConfig } from "./normalize";
import { assetUsage, effectiveThemeId, enabledThemes, resolveEffects, resolveSymbol, resolveTheme, statusText, themeDataAttrs, themeStyleVars } from "./resolve";
import { ACTIVE_SLOT_COUNT, SLOT_DEFINITIONS, SLOT_GROUPS, defaultPresentationFor } from "./slots";
import { THEMES as THEME_PRESETS, THEME_ORDER } from "../themes/registry";

describe("slots", () => {
  it("defines exactly 50 numbered slots in five groups of ten", () => {
    assert.equal(SLOT_DEFINITIONS.length, ACTIVE_SLOT_COUNT);
    SLOT_DEFINITIONS.forEach((s, i) => assert.equal(s.number, i + 1));
    for (const g of SLOT_GROUPS) {
      assert.equal(SLOT_DEFINITIONS.filter((s) => s.group === g.id).length, 10);
    }
    assert.equal(new Set(SLOT_DEFINITIONS.map((s) => s.label)).size, 50);
  });

  it("matches the brief's labels at the group edges", () => {
    const label = (n: number) => SLOT_DEFINITIONS[n - 1].label;
    assert.equal(label(1), "Player 1 avatar");
    assert.equal(label(11), "Player 1 victory");
    assert.equal(label(20), "Draw reaction");
    assert.equal(label(21), "Comic panel 1");
    assert.equal(label(31), "Main background");
    assert.equal(label(41), "Rematch");
    assert.equal(label(50), "Secret / surprise reaction");
  });

  it("default config has every slot empty with a presentation", () => {
    const c = createDefaultConfig();
    assert.equal(Object.keys(c.slots).length, 50);
    for (let n = 1; n <= 50; n++) {
      assert.equal(c.slots[String(n)].assetId, null);
      assert.deepEqual(c.slots[String(n)].presentation, defaultPresentationFor(n));
    }
  });
});

describe("themes", () => {
  it("defaults to Pearl Boy with every theme enabled and player choice on", () => {
    const c = createDefaultConfig();
    assert.equal(c.theme.presetId, "pearl-boy");
    assert.equal(c.theme.enabled.length, 23);
    assert.equal(c.theme.playerChoice, true);
  });

  it("every theme produces complete CSS variables and data attributes", () => {
    const c = createDefaultConfig();
    for (const id of THEME_ORDER) {
      const t = resolveTheme(c, id);
      for (const v of [...Object.values(themeStyleVars(t)), ...Object.values(themeDataAttrs(t))]) {
        assert.ok(v && !v.includes("undefined"), `${id} ${v}`);
      }
      assert.equal(themeDataAttrs(t)["data-theme"], id);
    }
  });

  it("applies per-theme overrides, including art, and keeps them when switching away", () => {
    const c = createDefaultConfig();
    c.theme.overrides.roses = { colors: { accent: "#123456" }, board: { style: "glass" }, art: { bloom: { assetId: "a1", rotate: 4 } } };
    const r = resolveTheme(c, "roses");
    assert.equal(r.colors.accent, "#123456");
    assert.equal(r.board.style, "glass");
    assert.equal(r.board.frame, THEME_PRESETS.roses.board.frame);
    const bloom = r.artwork.pieces.find((p) => p.id === "bloom")!;
    assert.equal(bloom.assetId, "a1");
    assert.equal(bloom.rotate, 4);
    assert.equal(bloom.alt, "Rose bloom");
    assert.equal(resolveTheme(c, "pearl").colors.accent, THEME_PRESETS.pearl.colors.accent);
  });

  it("player pick wins only when allowed and enabled", () => {
    const c = createDefaultConfig();
    assert.equal(effectiveThemeId(c, "graffiti"), "graffiti");
    assert.equal(effectiveThemeId(c, null), "pearl-boy");
    c.theme.enabled = ["pearl", "space"];
    assert.equal(effectiveThemeId(c, "graffiti"), "pearl-boy");
    assert.deepEqual(enabledThemes(c), ["pearl-boy", "pearl", "space"]);
    c.theme.playerChoice = false;
    assert.equal(effectiveThemeId(c, "space"), "pearl-boy");
    c.theme.presetId = "jinx";
    assert.ok(enabledThemes(c).includes("jinx"), "default is always enabled");
  });

  it("space and hamster modes add effects to any theme", () => {
    const c = createDefaultConfig();
    c.theme.presetId = "comic";
    assert.equal(resolveEffects(resolveTheme(c), c).stars, false);
    c.space.enabled = true;
    c.hamster.enabled = true;
    const e = resolveEffects(resolveTheme(c), c);
    assert.ok(e.stars && e.nebula && e.hamsters);
  });
});

describe("symbols and text", () => {
  it("uses the configured symbol, with mode overrides", () => {
    const c = createDefaultConfig();
    c.players.PLAYER_ONE.symbol = { kind: "emoji", emoji: "🌹" };
    assert.deepEqual(resolveSymbol(c, "PLAYER_ONE"), { kind: "emoji", emoji: "🌹" });
    c.space.enabled = true;
    c.space.symbols = true;
    assert.deepEqual(resolveSymbol(c, "PLAYER_TWO"), { kind: "glyph", glyph: "star" });
    c.hamster.enabled = true;
    assert.deepEqual(resolveSymbol(c, "PLAYER_ONE"), { kind: "glyph", glyph: "hamster" });
  });

  it("status text comes from config", () => {
    const c = createDefaultConfig();
    c.players.PLAYER_TWO.winText = "Mina wins";
    assert.equal(statusText(c, { kind: "won", player: "PLAYER_TWO" }), "Mina wins");
    assert.equal(statusText(c, { kind: "turn", player: "PLAYER_ONE" }), "Your turn");
    assert.equal(statusText(c, { kind: "draw" }), "It's a draw 🤝");
  });

  it("reports every place an asset is used", () => {
    const c = createDefaultConfig();
    c.slots["11"].assetId = "a1";
    c.slots["18"].assetId = "a1";
    c.identity.logoAssetId = "a1";
    assert.equal(assetUsage(c, "a1").length, 3);
    assert.deepEqual(assetUsage(c, "nope"), []);
  });
});

describe("normalizeConfig", () => {
  it("returns defaults for garbage", () => {
    for (const raw of [null, 42, "x", [], { players: 5 }]) {
      assert.deepEqual(normalizeConfig(raw), createDefaultConfig());
    }
  });

  it("round-trips a customised config", () => {
    const c = createDefaultConfig();
    c.identity.gameName = "Butter";
    c.players.PLAYER_TWO.symbol = { kind: "image", slot: 4 };
    c.slots["31"].assetId = "bg";
    c.slots["31"].presentation.mask = "vignette";
    c.theme = {
      presetId: "space",
      overrides: {
        space: {
          colors: { accent: "#abcdef" },
          players: { layout: "corners" },
          art: { planet: { hidden: true, size: 10 } },
          frontendArtwork: {
            hero: { assetId: "hero", presentation: c.identity.artworkPresentation },
            mobileBackground: { assetId: "mobile-bg", presentation: c.slots["31"].presentation },
            desktopBackground: { assetId: "desktop-bg", presentation: c.slots["31"].presentation },
          },
        },
      },
      enabled: ["pearl", "space"],
      playerChoice: false,
    };
    c.slots["31"].presentation.rotate = -6;
    c.reactions.pools.loss = [14, 19];
    const normalized = normalizeConfig(JSON.parse(JSON.stringify(c)));
    assert.deepEqual(normalized, c);
    assert.equal(resolveTheme(normalized, "space").frontendArtwork.hero?.assetId, "hero");
    assert.equal(assetUsage(normalized, "hero")[0], "space frontend · hero");
  });

  it("drops bad values and clamps numbers", () => {
    const c = createDefaultConfig() as unknown as Record<string, unknown>;
    c.theme = {
      presetId: "neon",
      overrides: {
        neon: {},
        roses: { colors: { accent: "red", ink: "#ffffff", bogus: "#000000" }, board: { style: "lava", frame: "pearl" }, art: { nope: { hidden: true }, bloom: { size: 999 } } },
      },
      enabled: ["space", "made-up"],
    };
    const slots = c.slots as Record<string, unknown>;
    const slotFive = slots["5"] as Record<string, unknown>;
    const slotFivePresentation = slotFive.presentation as Record<string, unknown>;
    slotFivePresentation.mask = "hexagon";
    slotFivePresentation.opacity = 7;
    const players = c.players as Record<string, unknown>;
    const playerOne = players.PLAYER_ONE as Record<string, unknown>;
    playerOne.symbol = { kind: "glyph", glyph: "dragon" };
    const reactions = c.reactions as Record<string, unknown>;
    const pools = reactions.pools as Record<string, unknown>;
    pools.win = [0, 18, 99, 18];
    const captions = reactions.captions as Record<string, unknown>;
    captions.draw = ["", "  ", "ok"];
    const n = normalizeConfig(c);
    assert.equal(n.theme.presetId, "pearl-boy");
    assert.deepEqual(n.theme.overrides, { roses: { colors: { ink: "#ffffff" }, board: { frame: "pearl" }, art: { bloom: { size: 40 } } } });
    assert.deepEqual(n.theme.overrides.roses?.frontendArtwork, undefined);
    assert.deepEqual(n.theme.enabled, ["pearl-boy", "space"]);
    assert.equal(n.theme.playerChoice, true);
    assert.equal(n.slots["5"].presentation.mask, "circle");
    assert.equal(n.slots["5"].presentation.opacity, 1);
    assert.deepEqual(n.players.PLAYER_ONE.symbol, { kind: "glyph", glyph: "x" });
    assert.deepEqual(n.reactions.pools.win, [18]);
    assert.deepEqual(n.reactions.captions.draw, ["ok"]);
  });
});

describe("migration", () => {
  it("reads the previous flat override format", () => {
    const n = normalizeConfig({ theme: { presetId: "roses", overrides: { roses: { display: "comic", boardStyle: "glass", reactionStyle: "cinematic" } } } });
    assert.deepEqual(n.theme.overrides.roses, { typography: { display: "comic" }, board: { style: "glass" }, reactions: { style: "cinematic" } });
    assert.equal(n.theme.enabled.length, 23, "old configs get every theme enabled");
  });

  it("Twilight Tide picks and overrides move to Low Tide in Twilight", () => {
    const n = normalizeConfig({ theme: { presetId: "twilight-tide", enabled: ["twilight-tide"], overrides: { "twilight-tide": { colors: { ink: "#ffffff" } } } } });
    assert.equal(n.theme.presetId, "low-tide");
    assert.deepEqual(n.theme.enabled, ["low-tide"]);
    assert.deepEqual(n.theme.overrides["low-tide"], { colors: { ink: "#ffffff" } });
  });

  it("world roles and collage pieces round-trip; junk is dropped", () => {
    const c = createDefaultConfig();
    c.theme.overrides.jinx = {
      roles: { "bg-desktop": { assetId: "bg1", presentation: { ...c.slots["31"].presentation, focalX: 30 } } },
      collage: { mode: "light", pieces: [{ assetId: "p1", presentation: c.slots["21"].presentation }] },
    };
    const n = normalizeConfig(JSON.parse(JSON.stringify({ ...c, theme: { ...c.theme, overrides: { jinx: { ...c.theme.overrides.jinx, roles: { ...c.theme.overrides.jinx.roles, bogus: {} } } } } })));
    assert.equal(n.theme.overrides.jinx?.roles?.["bg-desktop"]?.assetId, "bg1");
    assert.equal(n.theme.overrides.jinx?.roles?.["bg-desktop"]?.presentation.focalX, 30);
    assert.equal(Object.keys(n.theme.overrides.jinx?.roles ?? {}).length, 1);
    assert.equal(n.theme.overrides.jinx?.collage?.mode, "light");
    assert.equal(n.theme.overrides.jinx?.collage?.pieces?.[0].assetId, "p1");
    const r = resolveTheme(n, "jinx");
    assert.equal(r.collage.mode, "light");
    assert.equal(r.roles["bg-desktop"]?.assetId, "bg1");
    assert.ok(assetUsage(n, "bg1").some((u) => u.includes("Jinx · Main background — Desktop")));
  });

  it("old presentations gain rotate = 0", () => {
    const old = createDefaultConfig() as unknown as Record<string, unknown>;
    const oldSlots = old.slots as Record<string, unknown>;
    const oldSlotEleven = oldSlots["11"] as Record<string, unknown>;
    const oldPresentation = oldSlotEleven.presentation as Record<string, unknown>;
    delete oldPresentation.rotate;
    assert.equal(normalizeConfig(old).slots["11"].presentation.rotate, 0);
  });
});
