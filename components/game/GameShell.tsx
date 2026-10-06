"use client";

import dynamic from "next/dynamic";

/**
 * The game reads saved state, config and images from the browser, so it
 * renders on the client only. The placeholder keeps the night palette so
 * there's no white flash.
 */
const GameRoot = dynamic(() => import("./GameRoot"), {
  ssr: false,
  loading: () => <div aria-busy="true" aria-label="Loading game" className="min-h-dvh bg-bg" />,
});

export function GameShell() {
  return <GameRoot />;
}
