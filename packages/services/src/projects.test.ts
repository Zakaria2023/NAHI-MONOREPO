import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { Actor } from "./core/actor";
import { listAlerts } from "./alerts";
import { createCertificateInvoice, recordMobilyStep } from "./mobily";
import { createProject, getProjectDetail, listProjects } from "./projects";
import {
  advanceStcStage,
  approveStcMilestone,
  decideStcDocument,
  uploadStcDocument,
} from "./stc";

const actor = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role: user.role };
};

const projectByCode = (code: string) => {
  const project = readStore().Projects.find((p) => p.code === code);
  if (!project) {
    throw new Error(`no ${code}`);
  }
  return project;
};

const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => resetStore());

describe("projects", () => {
  it("lists every seeded project with a derived stage", async () => {
    const items = await listProjects();
    expect(items.find((p) => p.code === "MOB-001")?.stageLabel).toBe("Implementation");
    expect(items.find((p) => p.code === "STC-003")?.closed).toBe(true);
  });

  it("numbers a new project in its operator's series and logs it", async () => {
    const project = await createProject(actor("project_manager"), {
      name: "New site",
      operator: "stc",
      region: "central",
      city: "Riyadh",
      siteName: "S-1",
      poValue: 1000,
      projectManagerName: "PM",
    });
    expect(project.code).toBe("STC-007");
    expect(readStore().Activity[0].action).toBe("Project created");
  });

  it("refuses a role that does not edit projects", async () => {
    await expect(
      recordMobilyStep(actor("accountant"), projectByCode("MOB-003").uuid, { step: "design_package", at: today() }),
    ).rejects.toThrow(/role/);
  });
});

describe("Mobily service", () => {
  it("refuses PAC on the store before RFS (rule 5) and records allowed steps", async () => {
    const mob1 = projectByCode("MOB-001");
    await expect(
      recordMobilyStep(actor("project_manager"), mob1.uuid, { step: "pac_submitted", at: today() }),
    ).rejects.toThrow(/rule 5/);
    await recordMobilyStep(actor("project_engineer"), mob1.uuid, { step: "mh_installation", at: today() });
    expect(projectByCode("MOB-001").mobily?.steps.mh_installation?.by).toBe(actor("project_engineer").name);
  });

  it("creates the PAC invoice due 60 days later, once (rules 7, 8)", async () => {
    const mob2 = projectByCode("MOB-002");
    await expect(
      createCertificateInvoice(actor("accountant"), mob2.uuid, { kind: "fac", amount: 85000, submittedAt: today() }),
    ).rejects.toThrow(/rule 7/);
    await expect(
      createCertificateInvoice(actor("accountant"), mob2.uuid, { kind: "pac", amount: 1, submittedAt: today() }),
    ).rejects.toThrow(/already/);
  });

  it("shows the permit expiring and FAC approaching as alerts", async () => {
    const titles = (await listAlerts()).map((a) => a.title);
    expect(titles).toContain("Permit expires in 5 day(s)");
    expect(titles.some((t) => t.startsWith("FAC opens in"))).toBe(true);
  });
});

describe("STC service", () => {
  it("holds Design for the 24 hours (rule 1)", async () => {
    await expect(advanceStcStage(actor("project_manager"), projectByCode("STC-001").uuid)).rejects.toThrow(/rule 1/);
  });

  it("generates the M2 End Date when Permit Receipt is approved (rule 2)", async () => {
    const stc4 = projectByCode("STC-004");
    expect((await getProjectDetail(stc4.uuid)).stc?.workflow.m2EndDate).toBeUndefined();
    await decideStcDocument(actor("project_manager"), stc4.uuid, {
      key: "permit_receipt",
      party: "stc",
      decision: "approved",
    });
    expect(projectByCode("STC-004").stc?.m2EndDate).toBeDefined();
  });

  it("rejects the Milestone automatically without a C09 (rule 6)", async () => {
    const stc2 = projectByCode("STC-002");
    const pm = actor("project_manager");
    for (const key of ["odf_tb_power_meter", "otdr_splice_average", "material_form", "ftr", "as_built"] as const) {
      await uploadStcDocument(pm, stc2.uuid, { key, fileName: `${key}.pdf` });
      await decideStcDocument(pm, stc2.uuid, { key, party: "inspector", decision: "approved" });
      await decideStcDocument(pm, stc2.uuid, { key, party: "supervisor", decision: "approved" });
    }
    expect(projectByCode("STC-002").stc?.m3EndDate).toBeDefined();
    const result = await approveStcMilestone(pm, stc2.uuid, "inspector");
    expect(result.rejected).toBe(true);
    expect(projectByCode("STC-002").stc?.milestone.status).toBe("rejected");
  });
});
