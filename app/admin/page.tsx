import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioShell } from "@/components/studio/StudioShell";
import { isStudioEnabled, requireOwner } from "@/lib/auth/owner";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Studio · Melted Butter", robots: { index: false, follow: false } };

/**
 * Server-side gate: the studio bundle is only sent after the owner session is
 * verified here. Non-owners are redirected before any studio code renders.
 */
export default async function AdminPage() {
  if (!isStudioEnabled()) notFound();
  await requireOwner();
  return <StudioShell signOutAction={signOut} />;
}
