import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOwnerSession, isStudioEnabled } from "@/lib/auth/owner";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Studio · Melted Butter", robots: { index: false, follow: false } };

export default async function LoginPage() {
  // Without OWNER_PASSCODE / OWNER_SESSION_SECRET the studio doesn't exist.
  if (!isStudioEnabled()) notFound();
  if (await getOwnerSession()) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl sm:p-8">
        <p className="text-3xl" aria-hidden="true">
          🧈
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none">Melted Butter Studio</h1>
        <p className="mb-6 mt-2 text-sm text-muted">Your private control room. Owner only.</p>
        <LoginForm />
      </div>
    </main>
  );
}
