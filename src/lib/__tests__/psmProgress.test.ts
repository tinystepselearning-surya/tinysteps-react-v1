import { describe, it, expect, beforeEach } from "vitest";
import { readProgress, writeProgress, PSM_PROGRESS_KEY } from "../psmProgress";

describe("psmProgress", () => {
  let mockStorage: { [key: string]: string };

  beforeEach(() => {
    mockStorage = {};
  });

  const createMockStorage = () => ({
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
  });

  it("returns empty object when storage is empty", () => {
    const storage = createMockStorage();
    const result = readProgress(storage);
    expect(result).toEqual({});
  });

  it("returns empty object when storage contains invalid JSON", () => {
    const storage = createMockStorage();
    mockStorage[PSM_PROGRESS_KEY] = "not-valid-json{";
    const result = readProgress(storage);
    expect(result).toEqual({});
  });

  it("writes and reads back a progress object", () => {
    const storage = createMockStorage();
    const progress = {
      "p1-el-01": { completed: true, stars: 3 },
      "p2-bp-01": { completed: false },
    };

    writeProgress(progress, storage);
    const result = readProgress(storage);

    expect(result).toEqual(progress);
  });

  it("does not touch unrelated keys in storage", () => {
    const storage = createMockStorage();
    mockStorage["other_key"] = "some_value";

    const progress = { "p1-el-01": { completed: true } };
    writeProgress(progress, storage);

    expect(mockStorage["other_key"]).toBe("some_value");
    expect(mockStorage[PSM_PROGRESS_KEY]).toBeDefined();
  });

  it("merges additional level without losing prior data", () => {
    const storage = createMockStorage();

    const initial = { "p1-el-01": { completed: true, stars: 3 } };
    writeProgress(initial, storage);

    const updated = {
      "p1-el-01": { completed: true, stars: 3 },
      "p2-bp-01": { completed: true, stars: 2 },
    };
    writeProgress(updated, storage);

    const result = readProgress(storage);
    expect(result).toEqual(updated);
  });

  it("SSR safety: returns empty object when storage is undefined", () => {
    const result = readProgress(undefined);
    expect(result).toEqual({});
  });

  it("SSR safety: writeProgress does not throw when storage is undefined", () => {
    expect(() => {
      writeProgress({ "p1-el-01": { completed: true } }, undefined);
    }).not.toThrow();
  });

  it("returns empty object when storage contains non-object value", () => {
    const storage = createMockStorage();
    mockStorage[PSM_PROGRESS_KEY] = JSON.stringify("string");
    expect(readProgress(storage)).toEqual({});

    mockStorage[PSM_PROGRESS_KEY] = JSON.stringify(123);
    expect(readProgress(storage)).toEqual({});

    mockStorage[PSM_PROGRESS_KEY] = JSON.stringify([1, 2, 3]);
    expect(readProgress(storage)).toEqual({});

    mockStorage[PSM_PROGRESS_KEY] = JSON.stringify(null);
    expect(readProgress(storage)).toEqual({});
  });
});
