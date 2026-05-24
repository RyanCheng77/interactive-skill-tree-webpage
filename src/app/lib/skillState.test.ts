import { describe, expect, it } from "vitest";
import type { Skill } from "../types";
import { computeRoleSkills, countUnseenSkillUpdates, findSkillById } from "./skillState";

const baseSkills: Skill[] = [
  {
    id: "a",
    roleId: "lead",
    name: "A",
    tagline: "",
    intro: "",
    tier: 0,
    col: 1,
    prereqs: [],
    status: "locked",
    version: "v1",
    size: "",
    downloads: 0,
    tags: [],
    tryUrl: "#",
    installCmd: "",
    homepage: "#",
    updateType: "updated",
  },
  {
    id: "b",
    roleId: "lead",
    name: "B",
    tagline: "",
    intro: "",
    tier: 1,
    col: 1,
    prereqs: ["a"],
    status: "locked",
    version: "v1",
    size: "",
    downloads: 0,
    tags: [],
    tryUrl: "#",
    installCmd: "",
    homepage: "#",
    updateType: "new",
  },
];

describe("computeRoleSkills", () => {
  it("marks no-prereq skills available when they are not unlocked", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set());

    expect(result[0].status).toBe("available");
    expect(result[1].status).toBe("locked");
  });

  it("marks unlocked skills unlocked and dependent skills available", () => {
    const result = computeRoleSkills(baseSkills, new Set(["a"]), new Set());

    expect(result[0].status).toBe("unlocked");
    expect(result[1].status).toBe("available");
  });

  it("marks seen update skills with seen true", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set(["a"]));

    expect(result[0].seen).toBe(true);
    expect(result[1].seen).toBe(false);
  });
});

describe("countUnseenSkillUpdates", () => {
  it("counts only skills with update type and unseen state", () => {
    const result = computeRoleSkills(baseSkills, new Set(), new Set(["a"]));

    expect(countUnseenSkillUpdates(result)).toBe(1);
  });
});

describe("findSkillById", () => {
  it("returns a matching skill and falls back to null", () => {
    expect(findSkillById(baseSkills, "b")?.name).toBe("B");
    expect(findSkillById(baseSkills, null)).toBeNull();
    expect(findSkillById(baseSkills, "missing")).toBeNull();
  });
});
