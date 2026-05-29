import { describe, expect, it, vi } from "vitest";

vi.mock("@hono/node-server", () => ({
  serve: vi.fn(),
}));

import { app } from "../index";

describe("CORS", () => {
  const origin = "http://127.0.0.1:5173";

  it("returns Access-Control-Allow-Origin header on GET requests", async () => {
    const response = await app.request("/api/skills/classified", {
      headers: { Origin: origin },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns Access-Control-Allow-Origin header on POST requests", async () => {
    const response = await app.request("/api/skills/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({ goal: "build a login page" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("responds to CORS preflight (OPTIONS) requests", async () => {
    const response = await app.request("/api/skills/classified", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
  });
});
