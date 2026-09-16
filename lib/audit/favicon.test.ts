import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { interpretFaviconBytes } from "./favicon";

describe("favicon", () => {
  it("reads a black Dacia wordmark SVG as not kaki", () => {
    const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><path fill="#1d1d1b" d="M0 0h10v10H0z"/></svg>`;
    const out = interpretFaviconBytes(Buffer.from(svg), "https://x/icon.svg", "image/svg+xml");
    assert.equal(out.kakiLike, false);
    assert.match(out.note, /SVG/i);
    assert.doesNotMatch(out.note, /nu este PNG/i);
  });

  it("accepts an SVG with kaki fill", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#646B52" width="32" height="32"/></svg>`;
    const out = interpretFaviconBytes(Buffer.from(svg), "https://x/icon.svg", "image/svg+xml");
    assert.equal(out.kakiLike, true);
  });
});
