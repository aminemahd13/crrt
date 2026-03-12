import { describe, expect, it } from "vitest";
import {
  clearEventApplyDraft,
  createEventApplyDraftKey,
  loadEventApplyDraft,
  saveEventApplyDraft,
  validateApplyRequiredFields,
} from "@/lib/event-apply-draft";

function createStorageMock() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

describe("event apply draft helpers", () => {
  it("builds deterministic draft keys from event/user/fields signature", () => {
    const fields = [
      { id: "f-1", label: "Full Name", required: true },
      { id: "f-2", label: "Email", required: true },
    ];
    const sameFieldsDifferentOrder = [
      { id: "f-1", label: "Full Name", required: true },
      { id: "f-2", label: "Email", required: true },
    ];
    const changedFields = [
      { id: "f-1", label: "Full Name", required: true },
      { id: "f-2", label: "Email", required: false },
    ];

    const keyA = createEventApplyDraftKey("event-1", "user-1", fields);
    const keyB = createEventApplyDraftKey("event-1", "user-1", sameFieldsDifferentOrder);
    const keyC = createEventApplyDraftKey("event-1", "user-1", changedFields);

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it("saves, restores, and clears draft values", () => {
    const storage = createStorageMock();
    const key = "event-apply-draft:event-1:user-1:abc";
    const values = {
      "Full Name": "CRRT Member",
      Email: "member@crrt.ma",
    };

    saveEventApplyDraft(storage, key, values);
    expect(loadEventApplyDraft(storage, key)).toEqual(values);

    clearEventApplyDraft(storage, key);
    expect(loadEventApplyDraft(storage, key)).toBeNull();
  });

  it("validates required fields for apply payloads", () => {
    const fields = [
      { id: "f-1", label: "Full Name", required: true },
      { id: "f-2", label: "Email", required: true },
      { id: "f-3", label: "Notes", required: false },
    ];
    const values = {
      "Full Name": "  ",
      Email: "member@crrt.ma",
      Notes: "",
    };

    expect(validateApplyRequiredFields(fields, values)).toEqual({
      "Full Name": "Full Name is required",
    });
  });
});
