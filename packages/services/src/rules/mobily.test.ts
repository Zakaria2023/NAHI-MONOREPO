import { describe, expect, it } from "vitest";
import { MobilyStep } from "../../../../db/enum";
import { CustomerInvoice, MobilyWorkflow, StepRecord } from "../../../../db/types";
import {
  MobilyContext,
  certificateInvoiceBlocker,
  facEligibleAt,
  finalClearanceDueAt,
  invoiceDueAt,
  mobilyCurrentStage,
  mobilyStepBlocker,
  permitExpiry,
} from "./mobily";

const NOW = "2026-10-01T00:00:00.000Z";

const done = (at: string = "2026-01-01T00:00:00.000Z"): StepRecord => ({ at, by: "Test" });

const ctx = (
  steps: Partial<Record<MobilyStep, StepRecord>>,
  extra: Partial<MobilyWorkflow> = {},
  invoices: CustomerInvoice[] = [],
  now: string = NOW,
): MobilyContext => ({
  workflow: { steps, permits: [], labTests: [], ...extra },
  poNumber: "PO-1",
  invoices,
  now,
});

const invoice = (basis: CustomerInvoice["basis"]): CustomerInvoice => ({
  uuid: basis,
  number: basis,
  projectUuid: "p",
  basis,
  amount: 1,
  vat: 0.15,
  total: 1.15,
  submittedAt: NOW,
  dueAt: NOW,
  createdBy: "Test",
});

const UP_TO_RFS: Partial<Record<MobilyStep, StepRecord>> = {
  oil_sheet_signed: done(),
  rfs_submitted: done(),
  rfs_received: done("2025-06-01T00:00:00.000Z"),
};

describe("Mobily rules", () => {
  it("rule 1 — mobilization needs the PO received", () => {
    expect(mobilyStepBlocker("materials_delivered", ctx({}))).toMatch(/rule 1/);
    expect(mobilyStepBlocker("materials_delivered", ctx({ po_received: done() }))).toBeNull();
  });

  it("rule 2 — a permit's expiry is computed from its issue date and duration", () => {
    expect(
      permitExpiry({ uuid: "x", authority: "mot", reference: "r", requestedAt: "2026-01-01T00:00:00.000Z", issuedAt: "2026-01-10T00:00:00.000Z", durationDays: 30 }),
    ).toBe("2026-02-09T00:00:00.000Z");
  });

  it("rule 3 — PAT waits for both labs' tests to pass", () => {
    const works = {
      trench_excavation: done(),
      pipe_laying: done(),
      mh_installation: done(),
      concrete_backfilling: done(),
      concrete_samples: done(),
      milling_paving: done(),
      cable_pulling_splicing: done(),
    };
    const pending = ctx(works, {
      labTests: [
        { uuid: "1", lab: "municipal", subject: "civil_works", status: "passed" },
        { uuid: "2", lab: "mobily", subject: "civil_works", status: "pending" },
      ],
    });
    expect(mobilyStepBlocker("pat_submitted", pending)).toMatch(/not passed/);
    const onlyOneLab = ctx(works, {
      labTests: [{ uuid: "1", lab: "municipal", subject: "civil_works", status: "passed" }],
    });
    expect(mobilyStepBlocker("pat_submitted", onlyOneLab)).toMatch(/Mobily Laboratory/);
  });

  it("rule 4 — Remedy Approval cannot be requested before the Oil Sheet is signed", () => {
    expect(mobilyStepBlocker("remedy_requested", ctx({}))).toMatch(/rule 4/);
    expect(mobilyStepBlocker("remedy_requested", ctx({ oil_sheet_signed: done() }))).toBeNull();
  });

  it("rule 5 — PAC cannot be requested before the RFS certificate is received", () => {
    expect(mobilyStepBlocker("pac_submitted", ctx({ rfs_submitted: done() }))).toMatch(/rule 5/);
    expect(mobilyStepBlocker("pac_submitted", ctx(UP_TO_RFS))).toBeNull();
  });

  it("rule 6 — FAC opens a year after PAC, with the date computed", () => {
    const steps = { ...UP_TO_RFS, pac_submitted: done(), pac_received: done("2026-03-01T00:00:00.000Z") };
    expect(facEligibleAt(ctx(steps).workflow)).toBe("2027-03-01T00:00:00.000Z");
    expect(mobilyStepBlocker("fac_submitted", ctx(steps))).toMatch(/one year/);
    expect(mobilyStepBlocker("fac_submitted", ctx(steps, {}, [], "2027-03-01T00:00:00.000Z"))).toBeNull();
    expect(mobilyStepBlocker("fac_submitted", ctx(UP_TO_RFS))).toMatch(/rule 6/);
  });

  it("rule 7 — a certificate's invoice needs the certificate, and only once", () => {
    expect(certificateInvoiceBlocker("pac", ctx(UP_TO_RFS))).toMatch(/rule 7/);
    expect(certificateInvoiceBlocker("rfs", ctx(UP_TO_RFS))).toBeNull();
    expect(certificateInvoiceBlocker("rfs", ctx(UP_TO_RFS, {}, [invoice("rfs")]))).toMatch(/already/);
  });

  it("rule 8 — payment falls due 60 days after submission on I-Supplier", () => {
    expect(invoiceDueAt("2026-10-01T00:00:00.000Z")).toBe("2026-11-30T00:00:00.000Z");
  });

  it("rule 9 — Final Clearance falls due two years after Stage 2, and not before", () => {
    const steps = { completion_certificate: done(), party_clearance: done("2026-01-15T00:00:00.000Z") };
    expect(finalClearanceDueAt(ctx(steps).workflow)).toBe("2028-01-15T00:00:00.000Z");
    expect(mobilyStepBlocker("final_clearance", ctx(steps))).toMatch(/rule 9/);
    expect(mobilyStepBlocker("final_clearance", ctx(steps, {}, [], "2028-01-15T00:00:00.000Z"))).toBeNull();
  });

  it("rule 10 — PO closure needs all three certificates", () => {
    const steps = { ...UP_TO_RFS, pac_received: done() };
    expect(mobilyStepBlocker("po_closure_submitted", ctx(steps))).toMatch(/rule 10/);
    expect(mobilyStepBlocker("po_closure_submitted", ctx({ ...steps, fac_received: done() }))).toBeNull();
  });

  it("holds the current stage at Certificates until FAC, then Invoicing", () => {
    const all = Object.fromEntries(
      (["site_survey", "design_package", "pr_requested", "po_received", "materials_delivered", "equipment_ready", "manpower_ready", "trench_excavation", "pipe_laying", "mh_installation", "concrete_backfilling", "concrete_samples", "milling_paving", "cable_pulling_splicing", "pat_submitted", "mandrel_test", "foc_e2e_test", "otdr_test", "oil_sheet_signed", "completion_certificate", "party_clearance", "remedy_requested", "remedy_approved", "pcr_requested", "sdn_approved", "as_built_submitted", "rfs_submitted", "rfs_received", "pac_submitted", "pac_received"] as const).map((s) => [s, done()]),
    );
    const permits = [{ uuid: "p", authority: "mot" as const, reference: "r", requestedAt: NOW, issuedAt: NOW, durationDays: 10 }];
    expect(mobilyCurrentStage(ctx(all, { permits }))).toBe("certificates");
    const withFac = { ...all, fac_submitted: done(), fac_received: done() };
    expect(mobilyCurrentStage(ctx(withFac, { permits }, [invoice("rfs")]))).toBe("invoicing");
    expect(
      mobilyCurrentStage(ctx(withFac, { permits }, [invoice("rfs"), invoice("pac"), invoice("fac")])),
    ).toBe("po_closure");
  });
});
