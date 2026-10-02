import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { listAlerts } from "./alerts";
import { bounceCheque, clearCheque, getBankAccount, reconcileBankAccount } from "./banking";
import { tickClosingItem } from "./closing";
import { Actor } from "./core/actor";
import { fileObligation, obligationsFor } from "./obligations";
import { recordStatementCheck, recordSupplierPayment } from "./payables";
import { recordCustomerCollection, vatQuarters, vatSummary } from "./receivables";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const supplierInvoice = (number: string) => {
  const row = readStore().SupplierInvoices.find((i) => i.number === number);
  if (!row) {
    throw new Error(number);
  }
  return row;
};
const ops = () => readStore().BankAccounts.find((a) => a.primary)?.uuid ?? "";

beforeEach(() => resetStore());

describe("cheques", () => {
  it("writes a post-dated cheque with a payment, which cannot clear before its date", async () => {
    const ap3 = supplierInvoice("AP-0003");
    await recordSupplierPayment(as("accountant"), ap3.uuid, {
      method: "cheque",
      bankAccountUuid: "",
      chequeNumber: "009001",
      chequeDueDate: inDays(5),
      reference: "CHQ 009001",
      amount: 200,
      paidAt: today(),
    });
    const cheque = readStore().Cheques.find((c) => c.number === "009001");
    expect(cheque).toMatchObject({ direction: "issued", status: "pending", bankAccountUuid: ops() });
    await expect(clearCheque(as("accountant"), cheque?.uuid ?? "")).rejects.toThrow(/post-dated/);
  });

  it("puts a bounced supplier cheque's amount back on the invoice", async () => {
    const pending = readStore().Cheques.find((c) => c.number === "004538");
    const before = supplierInvoice("AP-0003").payments.length;
    await bounceCheque(as("accountant"), pending?.uuid ?? "", { reason: "Stopped" });
    expect(supplierInvoice("AP-0003").payments.length).toBe(before - 1);
    expect(supplierInvoice("AP-0003").status).toBe("approved");
  });

  it("reopens a customer invoice when its cheque bounces", async () => {
    const ci2 = readStore().CustomerInvoices.find((i) => i.number === "CI-0002");
    await recordCustomerCollection(as("accountant"), ci2?.uuid ?? "", {
      method: "cheque",
      bankAccountUuid: "",
      chequeNumber: "55120",
      chequeDueDate: today(),
      paidAt: today(),
    });
    expect(readStore().CustomerInvoices.find((i) => i.number === "CI-0002")?.paidAt).toBeTruthy();
    const cheque = readStore().Cheques.find((c) => c.number === "55120");
    await bounceCheque(as("accountant"), cheque?.uuid ?? "", { reason: "Insufficient funds" });
    expect(readStore().CustomerInvoices.find((i) => i.number === "CI-0002")?.paidAt).toBeUndefined();
    expect((await listAlerts()).some((a) => a.title === "Customer cheque bounced")).toBe(true);
  });
});

describe("bank reconciliation (finance §5)", () => {
  it("accepts the statement only when it equals the book adjusted for uncleared cheques", async () => {
    const detail = await getBankAccount(ops(), thisMonth());
    expect(detail.gap.outstandingIssued).toBe(1000);
    await expect(
      reconcileBankAccount(as("accountant"), ops(), { period: thisMonth(), statementBalance: detail.gap.bookBalance }),
    ).rejects.toThrow(/differs by/);
    await reconcileBankAccount(as("accountant"), ops(), { period: thisMonth(), statementBalance: detail.gap.expectedStatement });
    await expect(tickClosingItem(as("accountant"), { period: thisMonth(), item: "bank_reconciliation" })).rejects.toThrow(/RJH-PRJ/);
  });
});

describe("supplier statement matching (finance §1 step 9)", () => {
  it("shows the difference between the supplier's balance and the system's", async () => {
    const ap1 = supplierInvoice("AP-0001");
    const check = await recordStatementCheck(as("accountant"), ap1.supplierUuid, { asOf: today(), reportedBalance: 0 });
    expect(check.systemBalance).toBeGreaterThan(0);
    expect(check.difference).toBe(-check.systemBalance);
  });
});

describe("tax obligations (finance §8)", () => {
  it("dates VAT to the end of the next month and GOSI to the 15th", () => {
    const rows = obligationsFor(readStore(), "2026-10-02T00:00:00.000Z");
    expect(rows.find((r) => r.key === "vat-2026-09")?.dueAt.slice(0, 10)).toBe("2026-10-31");
    expect(rows.find((r) => r.key === "gosi-2026-09")?.dueAt.slice(0, 10)).toBe("2026-10-15");
  });

  it("warns seven days before a deadline", () => {
    const rows = obligationsFor(readStore(), "2026-10-09T00:00:00.000Z");
    expect(rows.find((r) => r.key === "gosi-2026-09")?.status).toBe("due_soon");
    expect(rows.find((r) => r.key === "vat-2026-09")?.status).toBe("upcoming");
  });

  it("pays GOSI only on an approved payroll, and files a month once", async () => {
    const draftPeriod = readStore().PayrollRuns.find((r) => r.status === "draft")?.period ?? "";
    await expect(fileObligation(as("accountant"), { kind: "gosi", period: draftPeriod, reference: "G" })).rejects.toThrow(/approve/);
    await fileObligation(as("accountant"), { kind: "vat", period: draftPeriod, reference: "Z1" });
    await expect(fileObligation(as("accountant"), { kind: "vat", period: draftPeriod, reference: "Z2" })).rejects.toThrow(/already filed/);
  });

  it("adds expenses' VAT to the input side and sums months into quarters", async () => {
    const months = await vatSummary();
    const quarters = await vatQuarters();
    const q = quarters[0];
    const inQuarter = months.filter((m) => q.months.includes(m.period));
    expect(q.net).toBeCloseTo(inQuarter.reduce((sum, m) => sum + m.net, 0), 2);
  });
});
