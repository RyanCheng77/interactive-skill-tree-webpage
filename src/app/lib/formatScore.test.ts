import { describe, expect, it } from "vitest";
import { formatScore } from "./formatScore";

describe("formatScore", () => {
  it("rounds a rule score like 59.5 to a whole number", () => {
    expect(formatScore(59.5)).toBe("60");
  });

  it("handles zero", () => {
    expect(formatScore(0)).toBe("0");
  });

  it("handles a small rule score", () => {
    expect(formatScore(3.2)).toBe("3");
  });

  it("handles a high rule score", () => {
    expect(formatScore(100)).toBe("100");
  });
});
