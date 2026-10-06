import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { svgLooksSafe, validateDimensions, validateFileBasics } from "./validation";

describe("upload validation", () => {
  it("accepts png, jpg, jpeg, webp, svg", () => {
    for (const [name, type] of [
      ["a.png", "image/png"],
      ["a.jpg", "image/jpeg"],
      ["a.JPEG", "image/jpeg"],
      ["a.webp", "image/webp"],
      ["a.svg", "image/svg+xml"],
    ]) {
      assert.equal(validateFileBasics({ name, type, size: 1000 }).ok, true, name);
    }
  });

  it("rejects other types and mismatched extensions", () => {
    assert.equal(validateFileBasics({ name: "a.gif", type: "image/gif", size: 10 }).ok, false);
    assert.equal(validateFileBasics({ name: "a.png", type: "text/html", size: 10 }).ok, false);
    assert.equal(validateFileBasics({ name: "a.exe", type: "", size: 10 }).ok, false);
    assert.equal(validateFileBasics({ name: "a.png", type: "image/jpeg", size: 10 }).ok, false);
  });

  it("enforces size limits", () => {
    assert.equal(validateFileBasics({ name: "a.png", type: "image/png", size: 9 * 1024 * 1024 }).ok, false);
    assert.equal(validateFileBasics({ name: "a.svg", type: "image/svg+xml", size: 2 * 1024 * 1024 }).ok, false);
    assert.equal(validateFileBasics({ name: "a.png", type: "image/png", size: 0 }).ok, false);
  });

  it("enforces dimensions", () => {
    assert.equal(validateDimensions("a", 31, 500).ok, false);
    assert.equal(validateDimensions("a", 7000, 500).ok, false);
    assert.equal(validateDimensions("a", 1080, 1920).ok, true);
  });

  it("rejects active SVG content", () => {
    assert.equal(svgLooksSafe('<svg><circle r="4"/></svg>'), true);
    assert.equal(svgLooksSafe("<svg><script>alert(1)</script></svg>"), false);
    assert.equal(svgLooksSafe('<svg onload="x()"></svg>'), false);
    assert.equal(svgLooksSafe('<svg><a href="javascript:x"></a></svg>'), false);
    assert.equal(svgLooksSafe("<svg><foreignObject/></svg>"), false);
  });
});
