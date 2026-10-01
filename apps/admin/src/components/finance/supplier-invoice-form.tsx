"use client";

import { Calculator } from "lucide-react";
import { Button, Checkbox, Dropdown, DropdownOption, FormError } from "ui";
import { formatDate, formatMoney, round2 } from "utils";
import { InvoiceableOrder, useSupplierInvoiceForm } from "@/app/(dashboard)/finance/payables/new/use-supplier-invoice-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";

type SupplierInvoiceFormProps = {
  supplierOptions: DropdownOption[];
  orders: InvoiceableOrder[];
};

export const SupplierInvoiceForm = ({ supplierOptions, orders }: SupplierInvoiceFormProps) => {
  const {
    form,
    state,
    isPending,
    onSubmit,
    supplierUuid,
    poUuid,
    grnUuids,
    poOptions,
    order,
    expectedNet,
    expectedVat,
    chooseSupplier,
    choosePo,
    toggleReceipt,
    fillExpected,
  } = useSupplierInvoiceForm(orders);
  const { errors } = form.formState;
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Register and match" columns={2}>
      <Dropdown
        label="Supplier"
        required
        options={supplierOptions}
        value={supplierUuid}
        onChange={chooseSupplier}
        error={errors.supplierUuid?.message}
      />
      <Dropdown
        label="Purchase order"
        required
        options={poOptions}
        value={poUuid}
        onChange={choosePo}
        disabled={!supplierUuid || poOptions.length === 0}
        placeholder={!supplierUuid ? "Pick the supplier first" : poOptions.length === 0 ? "No PO of theirs has receipts to invoice" : "Select…"}
        error={errors.poUuid?.message}
      />

      <div className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-ink">Goods receipts on this invoice</span>
        {order ? (
          <div className="flex flex-col divide-y divide-hairline-soft rounded-control border border-hairline-soft">
            {order.receipts.map((receipt) => (
              <div key={receipt.uuid} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <Checkbox
                  label={`${receipt.number} · received ${formatDate(receipt.receivedAt)}`}
                  checked={grnUuids.includes(receipt.uuid)}
                  onChange={(event) => toggleReceipt(receipt.uuid, event.target.checked)}
                />
                <span className="text-sm text-secondary tabular-nums">{formatMoney(receipt.value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-control border border-dashed border-hairline px-3 py-3 text-sm text-muted">
            Pick the supplier and the PO to list its receipts that are not on an invoice yet.
          </p>
        )}
        <FormError message={errors.grnUuids?.message} />
        {order && order.advancePaid > 0 && (
          <p className="text-xs text-muted">
            This PO carries an advance of {formatMoney(order.advancePaid)}; what is left of it is recovered from this invoice automatically.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-primary-tint-border bg-primary-tint px-4 py-3 md:col-span-2">
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-ink">
            Expected net from the chosen receipts: <span className="font-medium tabular-nums">{formatMoney(expectedNet)}</span>
          </span>
          <span className="text-xs text-secondary">
            VAT 15 % {formatMoney(expectedVat)} · total {formatMoney(round2(expectedNet + expectedVat))} — the invoice must bill exactly the accepted goods at PO prices.
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={fillExpected} disabled={expectedNet === 0}>
          <Calculator size={14} />
          Use these figures
        </Button>
      </div>

      <TextField name="invoiceNumber" label="Supplier invoice number" required placeholder="As printed on the invoice" />
      <TextField name="invoiceDate" label="Invoice date" type="date" required />
      <TextField name="subtotal" label="Net (excl. VAT)" type="number" required />
      <TextField name="vat" label="VAT" type="number" required />
      <TextField name="total" label="Total (incl. VAT)" type="number" required />
    </ActionForm>
  );
};
