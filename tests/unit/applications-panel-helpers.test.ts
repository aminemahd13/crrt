import { describe, expect, it } from "vitest";
import {
  getApplicationColumns,
  getApplicationStatusCue,
  shouldOpenRowInNewTab,
  shouldOpenRowOnKey,
} from "@/components/admin/applications-panel.helpers";
import type { ApplicationRow } from "@/components/admin/events-admin-types";

function makeRow(patch: Partial<ApplicationRow> = {}): ApplicationRow {
  return {
    id: "app-1",
    registrationId: "reg-1",
    submissionId: "sub-1",
    eventId: "event-1",
    eventTitle: "Event",
    eventSlug: "event",
    userId: "user-1",
    userName: "Ada",
    userEmail: "ada@example.com",
    registrationStatus: "registered",
    reviewStatus: "new",
    note: null,
    submissionData: {},
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    ...patch,
  };
}

describe("applications panel helpers", () => {
  it("returns expected columns in global mode", () => {
    expect(getApplicationColumns(true).map((column) => column.label)).toEqual([
      "Name",
      "Email",
      "Event",
      "Date",
    ]);
  });

  it("returns expected columns in event-scoped mode", () => {
    expect(getApplicationColumns(false).map((column) => column.label)).toEqual([
      "Name",
      "Email",
      "Date",
    ]);
  });

  it("prefers review cue over registration cue", () => {
    const cue = getApplicationStatusCue(
      makeRow({
        reviewStatus: "in_review",
        registrationStatus: "approved",
      })
    );
    expect(cue.label).toBe("In review");
  });

  it("falls back to no-status cue when workflow statuses are missing", () => {
    const cue = getApplicationStatusCue(
      makeRow({
        reviewStatus: null,
        registrationStatus: null,
      })
    );
    expect(cue.label).toBe("No status");
  });

  it("opens row by keyboard only for Enter and Space", () => {
    expect(shouldOpenRowOnKey("Enter")).toBe(true);
    expect(shouldOpenRowOnKey(" ")).toBe(true);
    expect(shouldOpenRowOnKey("Tab")).toBe(false);
  });

  it("detects new-tab intent from modifiers and middle click", () => {
    expect(
      shouldOpenRowInNewTab({
        button: 0,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      })
    ).toBe(true);
    expect(
      shouldOpenRowInNewTab({
        button: 1,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      })
    ).toBe(true);
    expect(
      shouldOpenRowInNewTab({
        button: 0,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      })
    ).toBe(false);
  });
});
