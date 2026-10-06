import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

/**
 * Exercises the real /admin gate (owner.ts) with Next's request APIs mocked.
 * Run with --experimental-test-module-mocks (see package.json "test").
 */
let cookieValue: string | undefined;
class Redirect extends Error {}

mock.module("server-only", { namedExports: {} });
mock.module("next/headers", {
  namedExports: { cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }) },
});
mock.module("next/navigation", {
  namedExports: {
    redirect: (url: string) => {
      throw new Redirect(url);
    },
  },
});

let owner: typeof import("./owner");
let token: typeof import("./token");

const SECRET = "x".repeat(48);

describe("/admin gate", () => {
  before(async () => {
    owner = await import("./owner");
    token = await import("./token");
  });

  beforeEach(() => {
    process.env.OWNER_PASSCODE = "butter-moon-2026";
    process.env.OWNER_SESSION_SECRET = SECRET;
    cookieValue = undefined;
  });

  it("studio doesn't exist without env vars (page returns 404)", () => {
    delete process.env.OWNER_PASSCODE;
    assert.equal(owner.isStudioEnabled(), false);
    process.env.OWNER_PASSCODE = "short";
    assert.equal(owner.isStudioEnabled(), false);
    process.env.OWNER_PASSCODE = "butter-moon-2026";
    process.env.OWNER_SESSION_SECRET = "too-short";
    assert.equal(owner.isStudioEnabled(), false);
  });

  it("visitor with no cookie is redirected to login", async () => {
    assert.equal(await owner.getOwnerSession(), null);
    await assert.rejects(owner.requireOwner(), (e: Error) => e instanceof Redirect && e.message === "/admin/login");
  });

  it("forged or foreign cookies are redirected", async () => {
    cookieValue = "owner.9999999999.forged";
    await assert.rejects(owner.requireOwner(), Redirect);
    cookieValue = token.signOwnerSession("y".repeat(48));
    await assert.rejects(owner.requireOwner(), Redirect);
  });

  it("valid owner cookie gets in", async () => {
    cookieValue = token.signOwnerSession(SECRET);
    assert.deepEqual(await owner.requireOwner(), { role: "owner" });
  });

  it("rotating the secret signs everyone out", async () => {
    cookieValue = token.signOwnerSession(SECRET);
    process.env.OWNER_SESSION_SECRET = "z".repeat(48);
    assert.equal(await owner.getOwnerSession(), null);
  });
});
