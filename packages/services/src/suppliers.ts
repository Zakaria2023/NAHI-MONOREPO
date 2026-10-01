import { generateUuid, nowIso } from "utils";
import { SupplierInput } from "validators";
import { readStore, transact } from "../../../db";
import { Supplier } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole } from "./core/lookup";

export type SupplierRow = Supplier & {
  poCount: number;
  /** Mean of every evaluation's three scores, 1–5; null before the first. */
  rating: number | null;
  evaluations: number;
};

const SUPPLIER_EDITORS = ["system_admin", "procurement", "accountant", "finance_manager"] as const;

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Finance §1 input control: no second supplier with the same name or VAT number. */
export const supplierDuplicateBlocker = (
  suppliers: Supplier[],
  input: Pick<Supplier, "name" | "vatNumber">,
): string | null => {
  if (suppliers.some((s) => normalise(s.name) === normalise(input.name))) {
    return "A supplier with this name already exists";
  }
  if (suppliers.some((s) => s.vatNumber === input.vatNumber.trim())) {
    return "A supplier with this VAT number already exists";
  }
  return null;
};

export const listSuppliers = async (): Promise<SupplierRow[]> => {
  const store = readStore();
  return store.Suppliers.map((supplier) => {
    const pos = store.PurchaseOrders.filter((po) => po.supplierUuid === supplier.uuid);
    const evaluations = pos.flatMap((po) => (po.evaluation ? [po.evaluation] : []));
    const rating =
      evaluations.length === 0
        ? null
        : Math.round(
            (evaluations.reduce((sum, e) => sum + (e.quality + e.onTime + e.price) / 3, 0) /
              evaluations.length) *
              10,
          ) / 10;
    return { ...supplier, poCount: pos.length, rating, evaluations: evaluations.length };
  });
};

export const createSupplier = async (actor: Actor, input: SupplierInput): Promise<Supplier> => {
  assertRole(actor.role, [...SUPPLIER_EDITORS], "register suppliers");
  return transact((store) => {
    const blocker = supplierDuplicateBlocker(store.Suppliers, input);
    if (blocker) {
      throw new Error(blocker);
    }
    const supplier: Supplier = { uuid: generateUuid(), ...input, createdAt: nowIso() };
    store.Suppliers.push(supplier);
    logActivity(store, {
      actorName: actor.name,
      entity: "supplier",
      entityUuid: supplier.uuid,
      entityLabel: supplier.name,
      action: "Supplier registered",
      detail: supplier.vatNumber,
    });
    return supplier;
  });
};
