import { describe, expect, it } from "vitest";
import { accessRedirect, hasOwnTasks } from "./access";

describe("who sees which pages", () => {
  it("keeps an employee to their dashboard and their tasks", () => {
    expect(accessRedirect("employee", "/")).toBeNull();
    expect(accessRedirect("employee", "/tasks/my")).toBeNull();
    expect(accessRedirect("employee", "/tasks/0b5c4d1e-2f3a-4b5c-8d9e-0f1a2b3c4d5e")).toBeNull();
    expect(accessRedirect("employee", "/payroll/runs")).toBe("/");
    expect(accessRedirect("employee", "/tasks")).toBe("/");
    expect(accessRedirect("employee", "/tasks/team")).toBe("/");
  });

  it("gives the admin no My tasks, and everything else", () => {
    expect(hasOwnTasks("system_admin")).toBe(false);
    expect(accessRedirect("system_admin", "/tasks/my")).toBe("/tasks");
    expect(accessRedirect("system_admin", "/payroll/runs")).toBeNull();
  });

  it("lets other staff open both the system and their own tasks", () => {
    expect(hasOwnTasks("project_engineer")).toBe(true);
    expect(accessRedirect("project_engineer", "/tasks/my")).toBeNull();
    expect(accessRedirect("project_engineer", "/finance/payables")).toBeNull();
  });
});
