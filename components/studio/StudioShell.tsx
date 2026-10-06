"use client";

import dynamic from "next/dynamic";

/** The studio edits browser-stored config and images, so it renders on the client only. */
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-dvh place-items-center text-muted" aria-busy="true">
      Opening the studio…
    </div>
  ),
});

export function StudioShell({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return <Studio signOutAction={signOutAction} />;
}
