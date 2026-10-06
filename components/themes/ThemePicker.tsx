"use client";

import { useEffect, useRef, useState } from "react";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { enabledThemes, resolveTheme } from "@/lib/config/resolve";
import { THEMES } from "@/lib/themes/registry";
import type { ThemeId } from "@/lib/themes/types";
import { ThemeThumbnail } from "./ThemeThumbnail";

interface ThemePickerProps {
  /** The player's current pick, or null for "owner's default". */
  current: ThemeId | null;
  onPick: (id: ThemeId | null) => void;
}

/**
 * The player's theme selector, styled as part of the game (it inherits the
 * active theme's surfaces). It never touches Studio settings.
 */
export function ThemePicker({ current, onPick }: ThemePickerProps) {
  const { config, theme } = useGameConfig();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const ids = enabledThemes(config);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!config.theme.playerChoice || ids.length < 2) return null;

  return (
    <>
      <button type="button" className="mb-theme-chip mb-card" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span aria-hidden="true" className="mb-theme-chip__dot" />
        <span className="mb-theme-chip__label">World</span>
        <span className="mb-theme-chip__name">{theme.identity.name}</span>
      </button>
      <dialog ref={ref} className="mb-picker" aria-labelledby="mb-picker-title" onClose={() => setOpen(false)}>
        <div className="mb-picker__head">
          <div>
            <h2 id="mb-picker-title" className="mb-picker__title">
              Choose a world
            </h2>
            <p className="mb-picker__sub">Same game, same two of you. Different place.</p>
          </div>
          <button type="button" className="mb-btn mb-btn--secondary" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
        <div role="radiogroup" aria-label="World">
        {(
          [
            ["comic", "Comic worlds"],
            ["general", "Worlds"],
          ] as const
        ).map(([kind, heading]) => {
          const group = ids.filter((id) => THEMES[id].identity.kind === kind);
          if (!group.length) return null;
          return (
            <section key={kind} className="mb-picker__group" aria-label={heading}>
              <h3 className="mb-picker__heading">{heading}</h3>
              <div className="mb-picker__grid">
          {group.map((id) => {
            const t = resolveTheme(config, id);
            const selected = theme.id === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-theme-pick={id}
                className="mb-picker__option"
                onClick={() => onPick(id === config.theme.presetId ? null : id)}
              >
                <ThemeThumbnail theme={t} />
                <span className="mb-picker__name">
                  {THEMES[id].identity.name}
                  {id === config.theme.presetId && <span className="mb-picker__badge">Default</span>}
                </span>
                <span className="mb-picker__tagline">{THEMES[id].identity.tagline}</span>
              </button>
            );
          })}
              </div>
            </section>
          );
        })}
        </div>
        {current !== null && (
          <button type="button" className="mb-btn mb-btn--secondary mb-picker__reset" onClick={() => onPick(null)}>
            Back to the default world
          </button>
        )}
      </dialog>
    </>
  );
}
