import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MIN_SECRET_LENGTH, verifyOwnerSession } from "./token";

/**
 * The single place that decides "is this request the owner?".
 *
 * Today: a passcode in OWNER_PASSCODE and an HMAC-signed httpOnly cookie.
 * With Supabase: replace getOwnerSession() with supabase.auth.getUser() on the
 * server and compare user.id to OWNER_USER_ID (no signup flow exists, so only
 * the one account you create in the Supabase dashboard can ever match).
 * Nothing else in the app needs to change.
 */

export const OWNER_COOKIE = "mb_owner";

export function ownerAuthConfig(): { passcode: string; secret: string } | null {
  const passcode = process.env.OWNER_PASSCODE ?? "";
  const secret = process.env.OWNER_SESSION_SECRET ?? "";
  if (passcode.length < 8 || secret.length < MIN_SECRET_LENGTH) return null;
  return { passcode, secret };
}

/** When the env vars aren't set the studio doesn't exist at all (404). */
export function isStudioEnabled(): boolean {
  return ownerAuthConfig() !== null;
}

export async function getOwnerSession(): Promise<{ role: "owner" } | null> {
  const config = ownerAuthConfig();
  if (!config) return null;
  const store = await cookies();
  return verifyOwnerSession(store.get(OWNER_COOKIE)?.value, config.secret) ? { role: "owner" } : null;
}

export async function requireOwner(): Promise<{ role: "owner" }> {
  const session = await getOwnerSession();
  if (!session) redirect("/admin/login");
  return session;
}
