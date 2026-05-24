import { describe, expect, it } from "vitest";
import type { AppStateSnapshot } from "../types";
import { DEFAULT_SNAPSHOT, parseSnapshot, saveSnapshot, serializeSnapshot } from "./storage";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("parseSnapshot", () => {
  it("returns default snapshot for invalid JSON", () => {
    expect(parseSnapshot("{broken")).toEqual(DEFAULT_SNAPSHOT);
  });

  it("returns a fresh default snapshot copy", () => {
    const first = parseSnapshot(null);
    const second = parseSnapshot(null);

    first.unlockedSkillIds.push("goal-framing");

    expect(second.unlockedSkillIds).toEqual([]);
    expect(DEFAULT_SNAPSHOT.unlockedSkillIds).toEqual([]);
  });

  it("merges partial snapshots with defaults", () => {
    expect(parseSnapshot(JSON.stringify({ entryMode: "role", activeRoleId: "pm" }))).toMatchObject({
      entryMode: "role",
      activeRoleId: "pm",
      activeStageId: "requirements",
      selectedSkillId: "goal-framing",
    });
  });

  it("falls back from invalid enum and generated plan values", () => {
    expect(parseSnapshot(JSON.stringify({ entryMode: "bad", generatedPlan: {} }))).toMatchObject({
      entryMode: "goal",
      generatedPlan: undefined,
    });
  });

  it("falls back to empty arrays for invalid id lists", () => {
    expect(parseSnapshot(JSON.stringify({ unlockedSkillIds: "a", seenSkillIds: null }))).toMatchObject({
      unlockedSkillIds: [],
      seenSkillIds: [],
    });
  });
});

describe("serializeSnapshot", () => {
  it("serializes a snapshot into JSON", () => {
    const snapshot: AppStateSnapshot = { ...DEFAULT_SNAPSHOT, goalInput: "hello" };

    expect(JSON.parse(serializeSnapshot(snapshot)).goalInput).toBe("hello");
  });
});

describe("saveSnapshot", () => {
  it("stores serialized state in the provided storage", () => {
    const storage = createMemoryStorage();

    saveSnapshot({ ...DEFAULT_SNAPSHOT, activeRoleId: "designer" }, storage);

    expect(parseSnapshot(storage.getItem("skill-forge-workbench-state")).activeRoleId).toBe("designer");
  });
});
