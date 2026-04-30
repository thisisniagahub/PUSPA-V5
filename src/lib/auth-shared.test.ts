import { expect, test, describe } from "bun:test";
import { normalizeUserRole } from "./auth-shared";

describe("normalizeUserRole", () => {
  test("should normalize 'developer' role correctly", () => {
    expect(normalizeUserRole("developer")).toBe("developer");
    expect(normalizeUserRole("DEVELOPER")).toBe("developer");
  });

  test("should normalize 'admin' role correctly", () => {
    expect(normalizeUserRole("admin")).toBe("admin");
    expect(normalizeUserRole("ADMIN")).toBe("admin");
  });

  test("should normalize 'finance' role to 'admin'", () => {
    expect(normalizeUserRole("finance")).toBe("admin");
    expect(normalizeUserRole("FINANCE")).toBe("admin");
  });

  test("should normalize 'staff' role correctly", () => {
    expect(normalizeUserRole("staff")).toBe("staff");
    expect(normalizeUserRole("STAFF")).toBe("staff");
  });

  test("should return 'staff' for null or undefined", () => {
    expect(normalizeUserRole(null)).toBe("staff");
    expect(normalizeUserRole(undefined)).toBe("staff");
    expect(normalizeUserRole()).toBe("staff");
  });

  test("should return 'staff' for unknown roles", () => {
    expect(normalizeUserRole("unknown")).toBe("staff");
    expect(normalizeUserRole("guest")).toBe("staff");
    expect(normalizeUserRole("")).toBe("staff");
  });

  test("should be sensitive to whitespace (no trimming)", () => {
    expect(normalizeUserRole(" developer ")).toBe("staff");
  });
});
