import { Hono } from "hono";
import { resolveSkillRoots } from "../skills/skillRoots";

export const healthRoute = new Hono();

healthRoute.get("/", (context) => {
  const skillRoots = resolveSkillRoots();

  return context.json({
    ok: true,
    service: "skill-workbench-api",
    skillRoots,
  });
});
