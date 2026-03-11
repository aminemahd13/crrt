import { describe, expect, it } from "vitest";
import {
  canCancelRegistration,
  nextRegistrationStatus,
  registrationStatusLabel,
} from "@/lib/event-registration";

describe("event registration helpers", () => {
  it("marks registration as waitlisted when capacity is full", () => {
    expect(nextRegistrationStatus(2, 2)).toBe("waitlisted");
    expect(nextRegistrationStatus(2, 1)).toBe("registered");
  });

  it("allows cancellation only for active statuses", () => {
    expect(canCancelRegistration("registered")).toBe(true);
    expect(canCancelRegistration("waitlisted")).toBe(true);
    expect(canCancelRegistration("approved")).toBe(true);
    expect(canCancelRegistration("rejected")).toBe(false);
  });

  it("renders readable labels", () => {
    expect(registrationStatusLabel("waitlisted")).toBe("Waitlisted");
  });
});
