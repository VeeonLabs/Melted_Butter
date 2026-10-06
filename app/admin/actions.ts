"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OWNER_COOKIE, ownerAuthConfig } from "@/lib/auth/owner";
import { SESSION_TTL_SECONDS, passcodeMatches, signOwnerSession } from "@/lib/auth/token";

export interface SignInState {
  error: string | null;
  success?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Owner sign-in. The passcode never leaves the server; only a signed httpOnly cookie comes back. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const config = ownerAuthConfig();
  if (!config) return { error: "The studio isn't set up on this server." };

  const passcode = String(formData.get("passcode") ?? "");
  if (!passcodeMatches(passcode, config.passcode)) {
    await sleep(800); // slows down guessing
    return { error: "That passcode isn't right." };
  }

  const store = await cookies();
  store.set(OWNER_COOKIE, signOwnerSession(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { error: null, success: true };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(OWNER_COOKIE);
}
