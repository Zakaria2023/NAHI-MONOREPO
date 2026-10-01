import { formatMoney, generateUuid, nextDocumentNumber, round2, toIso } from "utils";
import {
  AddLabTestInput,
  AddPermitInput,
  CertificateInvoiceInput,
  IssuePermitInput,
  LabTestResultInput,
  MobilyStepInput,
} from "validators";
import { transact } from "../../../db";
import {
  CERTIFICATE_LABELS,
  LABORATORY_LABELS,
  LAB_TEST_STATUS_LABELS,
  LAB_TEST_SUBJECT_LABELS,
  MOBILY_STEP_LABELS,
  PERMIT_AUTHORITY_LABELS,
} from "../../../db/label";
import { CustomerInvoice, MobilyWorkflow, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { withVat } from "./core/tax";
import { editableProject, mobilyContext } from "./projects";
import { certificateInvoiceBlocker, invoiceDueAt, mobilyStepBlocker } from "./rules/mobily";

const mobilyOf = (project: Project): MobilyWorkflow => {
  if (!project.mobily) {
    throw new Error("Not a Mobily project");
  }
  return project.mobily;
};

const log = (store: Store, actor: Actor, project: Project, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "project",
    entityUuid: project.uuid,
    entityLabel: project.code,
    action,
    detail,
  });

/** Records one dated step, after every rule in section 6 that gates it. */
export const recordMobilyStep = async (
  actor: Actor,
  projectUuid: string,
  input: MobilyStepInput,
): Promise<void> => {
  const at = toIso(input.at);
  assertNotFuture(at);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = mobilyOf(project);
    if (input.step === "po_received") {
      const poNumber = input.poNumber?.trim() || project.poNumber;
      if (!poNumber) {
        throw new Error("Enter the PO number Mobily issued");
      }
      project.poNumber = poNumber;
    }
    const blocker = mobilyStepBlocker(input.step, mobilyContext(store, project, at));
    if (blocker) {
      throw new Error(blocker);
    }
    workflow.steps[input.step] = { at, by: actor.name, note: input.note?.trim() || undefined };
    log(store, actor, project, MOBILY_STEP_LABELS[input.step], input.note);
  });
};

/** Rule 2: the permit and its expected duration; the end date is derived from them. */
export const addMobilyPermit = async (
  actor: Actor,
  projectUuid: string,
  input: AddPermitInput,
): Promise<void> => {
  const requestedAt = toIso(input.requestedAt);
  assertNotFuture(requestedAt);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = mobilyOf(project);
    if (!workflow.steps.po_received) {
      throw new Error("Permits are requested once the PO is received");
    }
    workflow.permits.push({
      uuid: generateUuid(),
      authority: input.authority,
      reference: input.reference,
      requestedAt,
      durationDays: input.durationDays,
    });
    log(store, actor, project, "Permit requested", `${PERMIT_AUTHORITY_LABELS[input.authority]} ${input.reference} — ${input.durationDays} days`);
  });
};

export const issueMobilyPermit = async (
  actor: Actor,
  projectUuid: string,
  input: IssuePermitInput,
): Promise<void> => {
  const issuedAt = toIso(input.issuedAt);
  assertNotFuture(issuedAt);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const permit = findOrThrow(mobilyOf(project).permits, input.permitUuid, "Permit");
    if (permit.issuedAt) {
      throw new Error("The permit is already issued");
    }
    if (issuedAt < permit.requestedAt) {
      throw new Error("A permit cannot be issued before it was requested");
    }
    permit.issuedAt = issuedAt;
    log(store, actor, project, "Permit issued", `${PERMIT_AUTHORITY_LABELS[permit.authority]} ${permit.reference}`);
  });
};

/** Rule 3: a lab test starts pending and shows its status in Implementation. */
export const addMobilyLabTest = async (
  actor: Actor,
  projectUuid: string,
  input: AddLabTestInput,
): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    mobilyOf(project).labTests.push({
      uuid: generateUuid(),
      lab: input.lab,
      subject: input.subject,
      status: "pending",
    });
    log(store, actor, project, "Lab test requested", `${LABORATORY_LABELS[input.lab]} — ${LAB_TEST_SUBJECT_LABELS[input.subject]}`);
  });

export const recordMobilyLabTestResult = async (
  actor: Actor,
  projectUuid: string,
  input: LabTestResultInput,
): Promise<void> => {
  const testedAt = toIso(input.testedAt);
  assertNotFuture(testedAt);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const test = findOrThrow(mobilyOf(project).labTests, input.testUuid, "Lab test");
    test.status = input.status;
    test.testedAt = testedAt;
    test.note = input.note?.trim() || undefined;
    log(
      store,
      actor,
      project,
      `Lab test ${LAB_TEST_STATUS_LABELS[input.status].toLowerCase()}`,
      `${LABORATORY_LABELS[test.lab]} — ${LAB_TEST_SUBJECT_LABELS[test.subject]}`,
    );
  });
};

/**
 * Rules 7 and 8: an invoice per certificate, only once the certificate is in,
 * due 60 days after it is submitted on I-Supplier.
 */
export const createCertificateInvoice = async (
  actor: Actor,
  projectUuid: string,
  input: CertificateInvoiceInput,
): Promise<CustomerInvoice> => {
  assertRole(actor.role, FINANCE_EDITORS, "create customer invoices");
  const submittedAt = toIso(input.submittedAt);
  assertNotFuture(submittedAt);
  return transact((store) => {
    const project = findOrThrow(store.Projects, projectUuid, "Project");
    const blocker = certificateInvoiceBlocker(input.kind, mobilyContext(store, project, submittedAt));
    if (blocker) {
      throw new Error(blocker);
    }
    const amount = round2(input.amount);
    const invoice: CustomerInvoice = {
      uuid: generateUuid(),
      number: nextDocumentNumber("CI", store.CustomerInvoices.map((i) => i.number)),
      projectUuid,
      basis: input.kind,
      amount,
      ...withVat(amount),
      submittedAt,
      dueAt: invoiceDueAt(submittedAt),
      createdBy: actor.name,
    };
    store.CustomerInvoices.push(invoice);
    log(store, actor, project, `${CERTIFICATE_LABELS[input.kind]} invoice submitted on I-Supplier`, `${invoice.number} — ${formatMoney(invoice.total)}`);
    logActivity(store, {
      actorName: actor.name,
      entity: "customer_invoice",
      entityUuid: invoice.uuid,
      entityLabel: invoice.number,
      action: "Invoice created",
      detail: `${project.code} ${CERTIFICATE_LABELS[input.kind]}`,
    });
    return invoice;
  });
};
