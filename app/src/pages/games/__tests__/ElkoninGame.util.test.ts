import { describe, it, expect } from "vitest";
import { splitPhonemesCVC, starsFrom, parseConfig } from "../ElkoninGame";

describe("ElkoninGame utilities", () => {
  describe("parseConfig", () => {
    it("parses boxes=4&rounds=4 with default levelId p1-el-02", () => {
      const config = parseConfig("?boxes=4&rounds=4");
      expect(config).toEqual({
        boxes: 4,
        rounds: 4,
        levelId: "p1-el-02",
      });
    });

    it("parses boxes=3 with default rounds=3 and levelId p1-el-01", () => {
      const config = parseConfig("?boxes=3");
      expect(config).toEqual({
        boxes: 3,
        rounds: 3,
        levelId: "p1-el-01",
      });
    });

    it("uses explicit levelId when provided", () => {
      const config = parseConfig("?boxes=3&levelId=custom-level");
      expect(config).toEqual({
        boxes: 3,
        rounds: 3,
        levelId: "custom-level",
      });
    });

    it("clamps boxes to 3-4 range", () => {
      expect(parseConfig("?boxes=2").boxes).toBe(3);
      expect(parseConfig("?boxes=5").boxes).toBe(4);
      expect(parseConfig("?boxes=10").boxes).toBe(4);
    });

    it("defaults to boxes=3 when no params", () => {
      const config = parseConfig("");
      expect(config.boxes).toBe(3);
      expect(config.rounds).toBe(3);
      expect(config.levelId).toBe("p1-el-01");
    });
  });

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
