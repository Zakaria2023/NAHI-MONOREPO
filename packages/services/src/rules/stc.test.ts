import { describe, expect, it } from "vitest";
import { StcDocumentKey, StcParty } from "../../../../db/enum";
import { StcDocument, StcWorkflow } from "../../../../db/types";
import {
  m2EndDateDue,
  milestoneApprovalBlocker,
  milestoneNeedsC09,
  stcAdvanceBlocker,
  stcDocumentStatus,
  stcPatStepBlocker,
} from "./stc";

const NOW = "2026-10-01T12:00:00.000Z";

const doc = (key: StcDocumentKey, approvedBy: StcParty[] = [], rejectedBy: StcParty[] = []): StcDocument => ({
  key,
  uploadedAt: "2026-09-01T00:00:00.000Z",
  approvals: [
    ...approvedBy.map((party) => ({ party, decision: "approved" as const, at: NOW, by: "T" })),
    ...rejectedBy.map((party) => ({ party, decision: "rejected" as const, at: NOW, by: "T" })),
  ],
});

const workflow = (extra: Partial<StcWorkflow> = {}): StcWorkflow => ({
  stage: "design",
  patSteps: {},
  m3Checks: {},
  milestone: { qtyIncreased: false, newUpl: false, status: "open" },
  documents: [],
  stageHistory: [],
  ...extra,
});

describe("STC rules", () => {
  it("rule 1 — M2 opens only 24 hours after the design End Date", () => {
    const wf = workflow({ designClosedAt: "2026-09-30T00:00:00.000Z", designEndDate: "2026-10-01T00:00:00.000Z" });
    expect(stcAdvanceBlocker(wf, NOW)).toMatch(/rule 1/);
    expect(stcAdvanceBlocker(wf, "2026-10-02T00:00:00.000Z")).toBeNull();
  });

  it("rule 2 — the M2 End Date needs Permit Application and Permit Receipt approved", () => {
    expect(m2EndDateDue(workflow({ documents: [doc("permit_application", ["stc"])] }))).toBe(false);
    expect(
      m2EndDateDue(workflow({ documents: [doc("permit_application", ["stc"]), doc("permit_receipt", ["stc"])] })),
    ).toBe(true);
  });

  it("rule 3 — Baladiyah is not a condition for the End Date", () => {
    const wf = workflow({
      documents: [doc("permit_application", ["stc"]), doc("permit_receipt", ["stc"]), doc("baladiyah")],
    });
    expect(m2EndDateDue(wf)).toBe(true);
    expect(stcDocumentStatus(doc("baladiyah"))).toBe("pending");
  });

  it("rule 4 — implementation waits for the Supervisor to assign the Inspector", () => {
    const wf = workflow({ stage: "m2", m2EndDate: NOW, sentToSupervisorAt: NOW });
    expect(stcAdvanceBlocker(wf, NOW)).toMatch(/rule 4/);
    expect(stcAdvanceBlocker({ ...wf, inspectorName: "Eng. X" }, NOW)).toBeNull();
  });

  it("rule 5 — the Milestone needs RFS and As-Built approved, and each party once", () => {
    const base = workflow({ stage: "m3" });
    expect(milestoneApprovalBlocker(base, "inspector")).toMatch(/RFS/);
    const ready = workflow({ stage: "m3", m3EndDate: NOW, documents: [doc("as_built", ["inspector", "supervisor"])] });
    expect(milestoneApprovalBlocker(ready, "inspector")).toBeNull();
    const halfway = { ...ready, milestone: { ...ready.milestone, inspectorApprovedAt: NOW } };
    expect(milestoneApprovalBlocker(halfway, "inspector")).toMatch(/already/);
    expect(milestoneApprovalBlocker(halfway, "supervisor")).toBeNull();
  });

  it("rule 6 — increased quantity or a new UPL without C09 needs a C09", () => {
    expect(milestoneNeedsC09(workflow({ milestone: { qtyIncreased: true, newUpl: false, status: "open" } }))).toBe(true);
    expect(milestoneNeedsC09(workflow({ milestone: { qtyIncreased: false, newUpl: true, status: "open" } }))).toBe(true);
    expect(
      milestoneNeedsC09(workflow({ milestone: { qtyIncreased: true, newUpl: false, status: "open" }, documents: [doc("c09")] })),
    ).toBe(false);
  });

  it("rule 7 — M4 needs PAT complete and M3 closed", () => {
    const wf = workflow({ stage: "m3", patSteps: {} });
    expect(stcAdvanceBlocker(wf, NOW)).toMatch(/PAT/);
    const patDone = { ...wf, patSteps: { pat_completed: { at: NOW, by: "T" } } };
    expect(stcAdvanceBlocker(patDone, NOW)).toMatch(/Milestone/);
    expect(stcAdvanceBlocker({ ...patDone, milestone: { ...patDone.milestone, status: "closed" } }, NOW)).toBeNull();
  });

  it("rule 8 — the site reaches the dashboard only after M5 is approved", () => {
    const wf = workflow({ stage: "m5", documents: [doc("m5_acceptance", ["stc_qc"])] });
    expect(stcAdvanceBlocker(wf, NOW)).toMatch(/STC QC/);
    expect(stcAdvanceBlocker({ ...wf, documents: [doc("m5_acceptance", ["stc_qc", "project_manager"])] }, NOW)).toBeNull();
  });

  it("runs PAT steps in order", () => {
    const wf = workflow({ stage: "m3" });
    expect(stcPatStepBlocker(wf, "npts_requested")).toMatch(/GT/);
    expect(stcPatStepBlocker(wf, "gt_uploaded_ne")).toBeNull();
  });

  it("lets a party's latest decision stand", () => {
    expect(stcDocumentStatus(doc("ftr", ["inspector"], ["supervisor"]))).toBe("rejected");
    expect(stcDocumentStatus(doc("ftr", ["inspector", "supervisor"]))).toBe("approved");
    expect(stcDocumentStatus({ key: "ftr", approvals: [] })).toBe("missing");
  });
});
