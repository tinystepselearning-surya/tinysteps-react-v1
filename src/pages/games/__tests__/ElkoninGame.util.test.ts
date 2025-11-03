import { describe, it, expect } from "vitest";
import { splitPhonemesCVC, starsFrom } from "../ElkoninGame";

describe("ElkoninGame utilities", () => {
  describe("splitPhonemesCVC", () => {
    it("splits 'sat' into ['s', 'a', 't']", () => {
      expect(splitPhonemesCVC("sat")).toEqual(["s", "a", "t"]);
    });

    it("splits 'pin' into ['p', 'i', 'n']", () => {
      expect(splitPhonemesCVC("pin")).toEqual(["p", "i", "n"]);
    });

    it("splits 'tip' into ['t', 'i', 'p']", () => {
      expect(splitPhonemesCVC("tip")).toEqual(["t", "i", "p"]);
    });

    it("splits 'nap' into ['n', 'a', 'p']", () => {
      expect(splitPhonemesCVC("nap")).toEqual(["n", "a", "p"]);
    });
  });

  describe("starsFrom", () => {
    it("returns 3 stars for 0 errors", () => {
      expect(starsFrom(0)).toBe(3);
    });

    it("returns 2 stars for 1 error", () => {
      expect(starsFrom(1)).toBe(2);
    });

    it("returns 2 stars for 2 errors", () => {
      expect(starsFrom(2)).toBe(2);
    });

    it("returns 1 star for 3 errors", () => {
      expect(starsFrom(3)).toBe(1);
    });

    it("returns 1 star for 5 errors", () => {
      expect(starsFrom(5)).toBe(1);
    });

    it("returns 1 star for 10 errors", () => {
      expect(starsFrom(10)).toBe(1);
    });
  });
});
