"use client";

import { useWatch } from "react-hook-form";
import { nowIso, round2, sumBy, toDateInput } from "utils";
import { supplierInvoiceSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { registerSupplierInvoiceAction } from "./actions";

/** A PO with receipts not yet on an invoice, as the register form needs it. */
export type InvoiceableOrder = {
  uuid: string;
  number: string;
  supplierUuid: string;
  advancePaid: number;
  receipts: { uuid: string; number: string; receivedAt: string; value: number }[];
};

/** Saudi VAT, for the hint only — the service checks the figures itself (docs/finance.md). */
const VAT_RATE = 0.15;

export const useSupplierInvoiceForm = (orders: InvoiceableOrder[]) => {
  const { form, state, isPending, onSubmit } = useActionForm(supplierInvoiceSchema, registerSupplierInvoiceAction, {
    supplierUuid: "",
    poUuid: "",
    grnUuids: [],
    invoiceNumber: "",
    invoiceDate: toDateInput(nowIso()),
    subtotal: 0,
    vat: 0,
    total: 0,
  });
  const [supplierUuid, poUuid, grnUuids] = useWatch({ control: form.control, name: ["supplierUuid", "poUuid", "grnUuids"] });
  const chosenGrns = grnUuids ?? [];
  const revalidate = { shouldValidate: form.formState.isSubmitted };

  const poOptions = orders
    .filter((o) => o.supplierUuid === supplierUuid)
    .map((o) => ({ value: o.uuid, label: o.number, hint: `${o.receipts.length} receipt(s) not yet invoiced` }));
  const order = orders.find((o) => o.uuid === poUuid && o.supplierUuid === supplierUuid);
  const expectedNet = round2(sumBy(order?.receipts.filter((r) => chosenGrns.includes(r.uuid)) ?? [], (r) => r.value));
  const expectedVat = round2(expectedNet * VAT_RATE);

  const chooseSupplier = (value: string) => {
    form.setValue("supplierUuid", value, revalidate);
    form.setValue("poUuid", "");
    form.setValue("grnUuids", []);
  };

  /** A new PO starts with all of its open receipts ticked. */
  const choosePo = (value: string) => {
    form.setValue("poUuid", value, revalidate);
    form.setValue("grnUuids", orders.find((o) => o.uuid === value)?.receipts.map((r) => r.uuid) ?? [], revalidate);
  };

  const toggleReceipt = (uuid: string, checked: boolean) =>
    form.setValue("grnUuids", checked ? [...chosenGrns, uuid] : chosenGrns.filter((u) => u !== uuid), revalidate);

  const fillExpected = () => {
    form.setValue("subtotal", expectedNet, revalidate);
    form.setValue("vat", expectedVat, revalidate);
    form.setValue("total", round2(expectedNet + expectedVat), revalidate);
  };

  return {
    form,
    state,
    isPending,
    onSubmit,
    supplierUuid: supplierUuid ?? "",
    poUuid: poUuid ?? "",
    grnUuids: chosenGrns,
    poOptions,
    order,
    expectedNet,
    expectedVat,
    chooseSupplier,
    choosePo,
    toggleReceipt,
    fillExpected,
  };
};
