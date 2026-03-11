import { describe, expect, it } from "vitest";
import {
  EventPayloadValidationError,
  normalizeEventPayload,
} from "@/lib/event-payload";

describe("normalizeEventPayload", () => {
  it("normalizes valid payload and auto-generates slug", () => {
    const payload = normalizeEventPayload({
      title: "Embedded Systems Bootcamp",
      description: "hands-on workshop",
      startDate: "2026-04-01T10:00:00.000Z",
      registrationMode: "internal",
      themePreset: "default",
      published: true,
    });

    expect(payload.slug).toBe("embedded-systems-bootcamp");
    expect(payload.published).toBe(true);
    expect(payload.registrationMode).toBe("internal");
  });

  it("rejects invalid date ordering", () => {
    expect(() =>
      normalizeEventPayload({
        title: "Bad Date Event",
        startDate: "2026-04-02T10:00:00.000Z",
        endDate: "2026-04-01T10:00:00.000Z",
      })
    ).toThrowError(EventPayloadValidationError);
  });

  it("requires absolute URL when registration mode is external", () => {
    expect(() =>
      normalizeEventPayload({
        title: "External Event",
        startDate: "2026-04-01T10:00:00.000Z",
        registrationMode: "external",
        registrationUrl: "/dashboard",
      })
    ).toThrowError(EventPayloadValidationError);
  });
});
