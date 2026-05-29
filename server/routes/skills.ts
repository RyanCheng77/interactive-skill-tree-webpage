import { Hono } from "hono";
import { buildSkillCompatibility } from "../skills/skillCompatibility";
import { classifySkills } from "../skills/skillClassifier";
import { buildSkillInventory, inventoryItemsToLocalSkills } from "../skills/skillInventory";
import { recommendSkillsForGoal } from "../skills/skillRecommender";
import { applySkillSyncPlan } from "../skills/skillSyncApplier";
import { createSkillSyncPlan } from "../skills/skillSyncPlanner";
import { resolvePlatformSkillRoots } from "../skills/toolAdapters";

export const skillsRoute = new Hono();

skillsRoute.get("/catalog", (context) => {
  const inventory = buildSkillInventory();
  const skills = inventoryItemsToLocalSkills(inventory);

  return context.json({
    skills,
    warnings: inventory.warnings,
  });
});

skillsRoute.get("/classified", (context) => {
  const inventory = buildSkillInventory();
  const skills = inventoryItemsToLocalSkills(inventory);

  return context.json({
    skills: classifySkills(skills),
    warnings: inventory.warnings,
  });
});

skillsRoute.post("/recommend", async (context) => {
  const body = await context.req.json<{ goal?: unknown }>().catch(() => ({}));
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const inventory = buildSkillInventory();
  const skills = inventoryItemsToLocalSkills(inventory);
  const classifiedSkills = classifySkills(skills);

  return context.json({
    goal,
    recommendations: recommendSkillsForGoal(goal, classifiedSkills),
    warnings: inventory.warnings,
  });
});

skillsRoute.get("/inventory", (context) => {
  return context.json(buildSkillInventory());
});

skillsRoute.get("/compatibility", (context) => {
  const roots = resolvePlatformSkillRoots();
  const inventory = buildSkillInventory({ roots });

  return context.json(buildSkillCompatibility({ inventory, roots }));
});

skillsRoute.post("/sync-plan", async (context) => {
  const body = await context.req.json<{ strategy?: unknown }>().catch(() => ({}));
  const strategy = body.strategy === "link" ? "link" : "copy";
  const roots = resolvePlatformSkillRoots();
  const inventory = buildSkillInventory({ roots });
  const compatibility = buildSkillCompatibility({ inventory, roots });

  return context.json(createSkillSyncPlan({ inventory, compatibility, roots, strategy }));
});

skillsRoute.post("/sync-apply", async (context) => {
  const body = await context.req.json<{ strategy?: unknown }>().catch(() => ({}));
  const strategy = body.strategy === "link" ? "link" : "copy";
  const roots = resolvePlatformSkillRoots();
  const inventory = buildSkillInventory({ roots });
  const compatibility = buildSkillCompatibility({ inventory, roots });
  const plan = createSkillSyncPlan({ inventory, compatibility, roots, strategy });

  return context.json(applySkillSyncPlan({ plan, roots }));
});
