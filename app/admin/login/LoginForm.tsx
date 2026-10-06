"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null });
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="passcode" className="text-sm font-semibold">
        Owner passcode
      </label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        autoComplete="current-password"
        required
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "login-error" : undefined}
        className="min-h-12 rounded-xl border border-line bg-bg px-4 text-base text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      />
      {state.error && (
        <p id="login-error" role="alert" className="text-sm text-p1">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 min-h-12 rounded-full bg-accent px-5 font-semibold text-accent-ink outline-none focus-visible:ring-4 focus-visible:ring-accent/40 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter the studio"}
      </button>
    </form>
  );
}
