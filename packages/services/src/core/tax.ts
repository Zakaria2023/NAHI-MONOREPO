import { round2 } from "utils";

/** Saudi VAT. Every invoice, quotation and PO in the system uses this one rate. */
export const VAT_RATE = 0.15;

export const vatOf = (net: number): number => round2(net * VAT_RATE);

export const withVat = (net: number): { vat: number; total: number } => {
  const vat = vatOf(net);
  return { vat, total: round2(net + vat) };
};
