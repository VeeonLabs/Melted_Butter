import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Owner session token: "owner.<expiresAtSeconds>.<hmac>". Signed with a
 * server-only secret, so it can't be forged or extended from the browser.
 * Kept free of Next.js imports so it can be unit-tested directly.
 */

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const MIN_SECRET_LENGTH = 32;

function mac(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function signOwnerSession(secret: string, now: number = Date.now()): string {
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `owner.${expires}`;
  return `${payload}.${mac(secret, payload)}`;
}

export function verifyOwnerSession(token: string | undefined, secret: string, now: number = Date.now()): boolean {
  if (!token || secret.length < MIN_SECRET_LENGTH) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "owner") return false;
  const expires = Number(parts[1]);
  if (!Number.isInteger(expires) || expires * 1000 <= now) return false;
  return safeEqual(parts[2], mac(secret, `${parts[0]}.${parts[1]}`));
}

/** Constant-time passcode comparison. An empty expected passcode never matches. */
export function passcodeMatches(input: string, expected: string): boolean {
  if (!expected) return false;
  return safeEqual(input, expected);
}
