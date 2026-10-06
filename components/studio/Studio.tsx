"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AssetProvider } from "@/components/providers/AssetProvider";
import { createLocalConfigStore } from "@/lib/config/configStore";
import type { GameConfig } from "@/lib/config/types";
import type { ThemeId } from "@/lib/themes/types";
import { Button } from "./controls";
import { changedAreas, clearAssetRefs } from "./draft";
import { PreviewPane } from "./PreviewPane";
import { AssetLibrary } from "./sections/AssetLibrary";
import { IdentitySection } from "./sections/IdentitySection";
import { ImageStudio } from "./sections/ImageStudio";
import { ComicSection, HamsterSection, SpaceSection } from "./sections/ModeSections";
import { ReactionSection } from "./sections/ReactionSection";
import { SymbolSection } from "./sections/SymbolSection";
import { ThemeSection } from "./sections/ThemeSection";
import { ThemeFrontendArtwork } from "./sections/ThemeFrontendArtwork";
import { WorldArtwork } from "./sections/WorldArtwork";
import type { PatchableKey, Scenario, SectionProps } from "./types";

const store = createLocalConfigStore();

type SectionId = "identity" | "theme" | "theme-art" | "worlds" | "images" | "symbols" | "reactions" | "comic" | "hamster" | "space" | "library" | "preview" | "save";

const NAV: { id: SectionId; label: string; icon: string }[] = [
  { id: "identity", label: "Game Identity", icon: "🧈" },
  { id: "theme", label: "Theme Studio", icon: "🎨" },
  { id: "theme-art", label: "Theme Artwork", icon: "🖼️" },
  { id: "worlds", label: "World Artwork", icon: "🖼" },
  { id: "images", label: "Image Studio", icon: "🖼️" },
  { id: "symbols", label: "Symbol Studio", icon: "✦" },
  { id: "reactions", label: "Reaction Studio", icon: "💬" },
  { id: "comic", label: "Comic Mode", icon: "💥" },
  { id: "hamster", label: "Hamster Mode", icon: "🐹" },
  { id: "space", label: "Space Mode", icon: "🪐" },
  { id: "library", label: "Asset Library", icon: "🗂️" },
  { id: "preview", label: "Live Preview", icon: "👁️" },
  { id: "save", label: "Save / Discard", icon: "💾" },
];

export default function Studio({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const [saved, setSaved] = useState<GameConfig>(() => store.load());
  const [draft, setDraftState] = useState<GameConfig>(saved);
  const [section, setSection] = useState<SectionId>("identity");
  const [focusSlot, setFocusSlot] = useState<number | null>(null);
  const [scenario, setScenario] = useState<Scenario>("playing");
  const [scenarioNonce, setScenarioNonce] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeId>(saved.theme.presetId);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const changes = useMemo(() => changedAreas(draft, saved), [draft, saved]);
  const dirty = changes.length > 0;

  const setDraft = useCallback((fn: (d: GameConfig) => GameConfig) => setDraftState(fn), []);
  const patch = useCallback(<K extends PatchableKey>(key: K, value: Partial<GameConfig[K]>) => {
    setDraftState((d) => ({ ...d, [key]: { ...d[key], ...value } }));
  }, []);

  const save = useCallback(() => {
    try {
      store.save(draft);
      setSaved(draft);
      setNotice({ kind: "ok", text: "Saved. The game shows your changes now." });
    } catch (e) {
      setNotice({ kind: "error", text: (e as Error).message });
    }
  }, [draft]);

  const discard = useCallback(() => {
    setDraftState(saved);
    setNotice({ kind: "ok", text: "Changes discarded." });
  }, [saved]);

  // Library deletes happen immediately, so clear references in both versions.
  const onAssetRemoved = useCallback((id: string) => {
    setDraftState((d) => clearAssetRefs(d, id));
    setSaved((s) => {
      const next = clearAssetRefs(s, id);
      try {
        store.save(next);
      } catch {
        /* the draft still has the cleaned version */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const props: SectionProps = {
    draft,
    setDraft,
    patch,
    openSlot: (slot) => {
      setFocusSlot(slot);
      setSection("images");
      window.scrollTo({ top: 0 });
    },
    showScenario: (s) => {
      setScenario(s);
      setScenarioNonce((n) => n + 1);
      setPreviewOpen(true);
    },
    onAssetRemoved,
    previewTheme,
    setPreviewTheme,
  };
  // In Theme Studio the preview shows the world being edited; elsewhere, the default world.
  const shownTheme = section === "theme" || section === "theme-art" || section === "worlds" ? previewTheme : draft.theme.presetId;

  function go(id: SectionId) {
    if (id === "preview") {
      setPreviewOpen(true);
      document.getElementById("studio-preview")?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (id === "images") setFocusSlot(null);
    setSection(id);
  }

  return (
    <AssetProvider>
      <div className="min-h-dvh pb-28">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-none">Melted Butter Studio</h1>
              <p className="text-sm text-muted">Your private control room</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-10 items-center rounded-full bg-surface px-4 text-sm font-semibold ring-1 ring-line outline-none hover:ring-ink/40 focus-visible:ring-4 focus-visible:ring-accent/40"
              >
                Open game ↗
              </a>
              <form action={async () => {
                await signOutAction();
                window.location.href = "/admin/login";
              }}>
                <Button type="submit" variant="ghost">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
          <nav aria-label="Studio sections" className="mx-auto max-w-[1500px] px-4 pb-2 lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  aria-current={section === n.id ? "page" : undefined}
                  onClick={() => go(n.id)}
                  className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
                    section === n.id ? "bg-accent text-accent-ink" : "bg-surface ring-1 ring-line"
                  }`}
                >
                  <span aria-hidden="true">{n.icon}</span> {n.label}
                </button>
              ))}
            </div>
          </nav>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 pt-4 lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,24rem)]">
          <nav aria-label="Studio sections" className="hidden lg:block">
            <ul className="sticky top-28 flex flex-col gap-1">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    aria-current={section === n.id ? "page" : undefined}
                    onClick={() => go(n.id)}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
                      section === n.id ? "bg-accent text-accent-ink" : "hover:bg-surface"
                    }`}
                  >
                    <span aria-hidden="true" className="w-5 text-center">
                      {n.icon}
                    </span>
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0" data-section={section}>
            {section === "identity" && <IdentitySection {...props} />}
            {section === "theme" && <ThemeSection {...props} />}
            {section === "theme-art" && <ThemeFrontendArtwork {...props} />}
            {section === "worlds" && <WorldArtwork {...props} />}
            {section === "images" && <ImageStudio key={focusSlot ?? "all"} draft={draft} setDraft={setDraft} focusSlot={focusSlot} />}
            {section === "symbols" && <SymbolSection {...props} />}
            {section === "reactions" && <ReactionSection {...props} />}
            {section === "comic" && <ComicSection {...props} />}
            {section === "hamster" && <HamsterSection {...props} />}
            {section === "space" && <SpaceSection {...props} />}
            {section === "library" && <AssetLibrary {...props} />}
            {section === "save" && (
              <section className="rounded-3xl border border-line bg-surface/80 p-5">
                <h3 className="font-display text-2xl">Save / Discard</h3>
                {dirty ? (
                  <>
                    <p className="mt-2 text-sm">Unsaved changes in:</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                      {changes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">Everything is saved. The game is showing exactly what the preview shows.</p>
                )}
                <p className="mt-3 text-xs text-muted">Image uploads, replacements and removals in the Asset Library take effect immediately; everything else waits for Save.</p>
              </section>
            )}
          </main>

          <aside
            id="studio-preview"
            aria-label="Live preview"
            className={`${previewOpen ? "flex" : "hidden"} fixed inset-0 z-40 flex-col bg-bg p-3 pb-24 lg:sticky lg:top-24 lg:z-0 lg:flex lg:h-[calc(100dvh-8.5rem)] lg:bg-transparent lg:p-0`}
          >
            <div className="mb-2 flex justify-end lg:hidden">
              <Button onClick={() => setPreviewOpen(false)}>Close preview</Button>
            </div>
            <PreviewPane draft={draft} themeId={shownTheme} scenario={scenario} onScenario={setScenario} nonce={scenarioNonce} />
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="min-w-0 text-sm" role="status" aria-live="polite" data-save-status>
              {notice ? (
                <span className={notice.kind === "error" ? "text-p1" : "text-accent"}>{notice.text}</span>
              ) : dirty ? (
                <span>
                  <span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-accent" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-muted">All changes saved</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button className="lg:hidden" onClick={() => setPreviewOpen((o) => !o)}>
                {previewOpen ? "Hide preview" : "Preview"}
              </Button>
              <Button onClick={discard} disabled={!dirty}>
                Discard changes
              </Button>
              <Button variant="primary" onClick={save} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AssetProvider>
  );
}
