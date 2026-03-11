import { describe, expect, it } from "vitest";
import { appCopy } from "@/lib/copy";

describe("appCopy", () => {
  it("provides required English labels across nav/auth/admin/footer", () => {
    expect(appCopy.nav.home).toBe("Home");
    expect(appCopy.nav.events).toBe("Events");
    expect(appCopy.auth.signInTitle).toBe("Sign In");
    expect(appCopy.auth.signupTitle).toBe("Create Account");
    expect(appCopy.admin.signOut).toBe("Sign Out");
    expect(appCopy.footer.connect).toBe("Connect");
  });
});
