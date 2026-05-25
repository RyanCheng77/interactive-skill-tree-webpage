import { Hono } from "hono";
import { readLocalSkillCatalog } from "../skills/localSkillCatalog";
import { classifySkills } from "../skills/skillClassifier";
import { recommendSkillsForGoal } from "../skills/skillRecommender";
import { resolveSkillRoots } from "../skills/skillRoots";

export const skillsRoute = new Hono();

skillsRoute.get("/catalog", (context) => {
  const roots = resolveSkillRoots();
  const skills = readLocalSkillCatalog({ roots });

  return context.json({
    skills,
    warnings: roots.filter((root) => !root.exists).map((root) => `Skill root not found: ${root.path}`),
  });
});

skillsRoute.get("/classified", (context) => {
  const roots = resolveSkillRoots();
  const skills = readLocalSkillCatalog({ roots });

  return context.json({
    skills: classifySkills(skills),
    warnings: roots.filter((root) => !root.exists).map((root) => `Skill root not found: ${root.path}`),
  });
});

skillsRoute.post("/recommend", async (context) => {
  const body = await context.req.json<{ goal?: unknown }>().catch(() => ({}));
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const roots = resolveSkillRoots();
  const skills = readLocalSkillCatalog({ roots });
  const classifiedSkills = classifySkills(skills);

  return context.json({
    goal,
    recommendations: recommendSkillsForGoal(goal, classifiedSkills),
    warnings: roots.filter((root) => !root.exists).map((root) => `Skill root not found: ${root.path}`),
  });
});
