import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SESSION_TTL_SECONDS, passcodeMatches, signOwnerSession, verifyOwnerSession } from "./token";

const SECRET = "s".repeat(40);

describe("owner session", () => {
  it("accepts its own fresh token", () => {
    assert.equal(verifyOwnerSession(signOwnerSession(SECRET), SECRET), true);
  });

  it("rejects missing, malformed, tampered and foreign tokens", () => {
    const t = signOwnerSession(SECRET);
    assert.equal(verifyOwnerSession(undefined, SECRET), false);
    assert.equal(verifyOwnerSession("", SECRET), false);
    assert.equal(verifyOwnerSession("owner.123", SECRET), false);
    assert.equal(verifyOwnerSession(t.replace("owner", "guest"), SECRET), false);
    const [, exp, sig] = t.split(".");
    assert.equal(verifyOwnerSession(`owner.${Number(exp) + 999999}.${sig}`, SECRET), false);
    assert.equal(verifyOwnerSession(t, "t".repeat(40)), false);
  });

  it("expires", () => {
    const t = signOwnerSession(SECRET, 0);
    assert.equal(verifyOwnerSession(t, SECRET, (SESSION_TTL_SECONDS + 1) * 1000), false);
  });

  it("refuses short secrets entirely", () => {
    assert.equal(verifyOwnerSession(signOwnerSession("short"), "short"), false);
  });

  it("compares passcodes exactly", () => {
    assert.equal(passcodeMatches("butter-moon", "butter-moon"), true);
    assert.equal(passcodeMatches("butter-moo", "butter-moon"), false);
    assert.equal(passcodeMatches("", ""), false);
  });
});
