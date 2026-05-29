import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoute } from "./routes/health";
import { skillsRoute } from "./routes/skills";

const app = new Hono();
const port = Number(process.env.API_PORT ?? 3001);

app.use("*", cors({ origin: "*" }));

app.route("/api/health", healthRoute);
app.route("/api/skills", skillsRoute);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`skill-workbench-api listening on http://127.0.0.1:${info.port}`);
  },
);

export { app };
