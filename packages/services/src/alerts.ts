import { daysUntil, formatDate, nowIso } from "utils";
import { readStore } from "../../../db";
import { EntityKind } from "../../../db/enum";
import { CUSTOMER_INVOICE_BASIS_LABELS, PERMIT_AUTHORITY_LABELS } from "../../../db/label";
import { Store } from "../../../db/types";
import { mobilyContext } from "./projects";
import {
  facEligibleAt,
  finalClearanceDueAt,
  isMobilyStageComplete,
  permitExpiry,
} from "./rules/mobily";
import { designWaitEndsAt, milestoneNeedsC09 } from "./rules/stc";

// THE ALERTS the documents ask for — before permits expire, before FAC and Final
// Clearance fall due (Mobily §7), the STC 24-hour countdown and C09 warning
// (STC §6), late deliveries and overdue custody counts (procurement §1, §3),
// invoices past due (finance §1, §3). Computed on read: nothing is stored, so an
// alert can never outlive the condition that raised it.

export type AlertSeverity = "danger" | "warning" | "info";

export type Alert = {
  key: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  /** What the alert is about; the app turns it into a link. */
  target: { kind: EntityKind; uuid: string };
  dueAt?: string;
};

export type AlertCollector = (store: Store, now: string) => Alert[];

const PERMIT_WARNING_DAYS = 7;
const FAC_WARNING_DAYS = 30;
const FINAL_CLEARANCE_WARNING_DAYS = 60;
const INVOICE_WARNING_DAYS = 7;

const SEVERITY_ORDER: Record<AlertSeverity, number> = { danger: 0, warning: 1, info: 2 };

const dueSeverity = (days: number): AlertSeverity => (days < 0 ? "danger" : "warning");

const mobilyAlerts: AlertCollector = (store, now) =>
  store.Projects.flatMap((project): Alert[] => {
    if (!project.mobily) {
      return [];
    }
    const target = { kind: "project" as const, uuid: project.uuid };
    const ctx = mobilyContext(store, project, now);
    const worksOpen = !isMobilyStageComplete("implementation", ctx);
    const permits = project.mobily.permits
      .filter((permit) => permit.issuedAt && worksOpen)
      .flatMap((permit): Alert[] => {
        const expiresAt = permitExpiry(permit);
        const days = daysUntil(expiresAt, now);
        return days > PERMIT_WARNING_DAYS
          ? []
          : [
              {
                key: `permit-${permit.uuid}`,
                severity: dueSeverity(days),
                title: days < 0 ? "Permit expired" : `Permit expires in ${days} day(s)`,
                detail: `${project.code} — ${PERMIT_AUTHORITY_LABELS[permit.authority]} ${permit.reference}, ${formatDate(expiresAt)}`,
                target,
                dueAt: expiresAt,
              },
            ];
      });
    const alerts: Alert[] = [...permits];
    const fac = facEligibleAt(project.mobily);
    if (fac && !project.mobily.steps.fac_submitted) {
      const days = daysUntil(fac, now);
      if (days <= FAC_WARNING_DAYS) {
        alerts.push({
          key: `fac-${project.uuid}`,
          severity: days <= 0 ? "danger" : "warning",
          title: days <= 0 ? "FAC can be requested now" : `FAC opens in ${days} day(s)`,
          detail: `${project.code} — one year after PAC, ${formatDate(fac)}`,
          target,
          dueAt: fac,
        });
      }
    }
    const clearance = finalClearanceDueAt(project.mobily);
    if (clearance && !project.mobily.steps.final_clearance) {
      const days = daysUntil(clearance, now);
      if (days <= FINAL_CLEARANCE_WARNING_DAYS) {
        alerts.push({
          key: `clearance-${project.uuid}`,
          severity: days <= 0 ? "danger" : "warning",
          title: days <= 0 ? "Final Clearance is due" : `Final Clearance due in ${days} day(s)`,
          detail: `${project.code} — two years after Party Clearance, ${formatDate(clearance)}`,
          target,
          dueAt: clearance,
        });
      }
    }
    return alerts;
  });

const stcAlerts: AlertCollector = (store, now) =>
  store.Projects.flatMap((project): Alert[] => {
    const wf = project.stc;
    if (!wf) {
      return [];
    }
    const target = { kind: "project" as const, uuid: project.uuid };
    const alerts: Alert[] = [];
    const endsAt = designWaitEndsAt(wf);
    if (wf.stage === "design" && endsAt) {
      const ready = new Date(endsAt).getTime() <= new Date(now).getTime();
      alerts.push({
        key: `design-${project.uuid}`,
        severity: "info",
        title: ready ? "Ready to move to M2" : "24-hour wait running",
        detail: `${project.code} — M2 opens ${formatDate(endsAt)}`,
        target,
        dueAt: endsAt,
      });
    }
    if (wf.stage === "m3" && milestoneNeedsC09(wf)) {
      alerts.push({
        key: `c09-${project.uuid}`,
        severity: "warning",
        title: "Milestone needs a C09",
        detail: `${project.code} — quantity increased or new UPL; approving now rejects it`,
        target,
      });
    }
    return alerts;
  });

const customerInvoiceAlerts: AlertCollector = (store, now) =>
  store.CustomerInvoices.filter((invoice) => !invoice.paidAt).flatMap((invoice): Alert[] => {
    const days = daysUntil(invoice.dueAt, now);
    if (days > INVOICE_WARNING_DAYS) {
      return [];
    }
    const project = store.Projects.find((p) => p.uuid === invoice.projectUuid);
    return [
      {
        key: `ci-${invoice.uuid}`,
        severity: dueSeverity(days),
        title: days < 0 ? `Customer invoice overdue ${-days} day(s)` : `Customer invoice due in ${days} day(s)`,
        detail: `${invoice.number} — ${project?.code ?? ""} ${CUSTOMER_INVOICE_BASIS_LABELS[invoice.basis]}`,
        target: { kind: "customer_invoice", uuid: invoice.uuid },
        dueAt: invoice.dueAt,
      },
    ];
  });

const COLLECTORS: AlertCollector[] = [mobilyAlerts, stcAlerts, customerInvoiceAlerts];

/** Other modules add their collectors as they arrive. */
export const registerAlertCollector = (collector: AlertCollector): void => {
  if (!COLLECTORS.includes(collector)) {
    COLLECTORS.push(collector);
  }
};

export const listAlerts = async (): Promise<Alert[]> => {
  const store = readStore();
  const now = nowIso();
  return COLLECTORS.flatMap((collect) => collect(store, now)).sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
};
