import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getTokenMock = vi.fn();

vi.mock("next-auth/jwt", () => ({
  getToken: getTokenMock,
}));

describe("middleware auth and security guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("redirects anonymous users away from /admin", async () => {
    getTokenMock.mockResolvedValueOnce(null);
    const { middleware } = await import("../../middleware");

    const response = await middleware(new NextRequest("http://localhost/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?callbackUrl=%2Fadmin");
  });

  it("allows anonymous access to /admin/login", async () => {
    getTokenMock.mockResolvedValueOnce(null);
    const { middleware } = await import("../../middleware");

    const response = await middleware(new NextRequest("http://localhost/admin/login"));

    expect(response.status).toBe(200);
  });

  it("rejects mutating admin API calls from invalid origin", async () => {
    const { middleware } = await import("../../middleware");

    const response = await middleware(
      new NextRequest("http://localhost/api/admin/settings", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
        },
      })
    );

    expect(response.status).toBe(403);
  });

  it("blocks editor role from admin-only API route", async () => {
    getTokenMock.mockResolvedValueOnce({ role: "editor" });
    const { middleware } = await import("../../middleware");

    const response = await middleware(new NextRequest("http://localhost/api/admin/settings"));

    expect(response.status).toBe(403);
  });

  it("allows editor role to access non-admin-only admin API route", async () => {
    getTokenMock.mockResolvedValueOnce({ role: "editor" });
    const { middleware } = await import("../../middleware");

    const response = await middleware(new NextRequest("http://localhost/api/admin/posts"));

    expect(response.status).toBe(200);
  });
});
