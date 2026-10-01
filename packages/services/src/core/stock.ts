import { generateUuid, round2 } from "utils";
import { EntityKind, StockMovementType } from "../../../../db/enum";
import { ChargedTo, QuantityLine, Store } from "../../../../db/types";
import { findOrThrow } from "./lookup";

// Stock is never stored as a number: a balance is the sum of its movements, so
// the item card and the balance can never disagree.

type MovementInput = {
  type: StockMovementType;
  itemUuid: string;
  warehouseUuid: string;
  qty: number;
  unitCost: number;
  refKind: EntityKind;
  refUuid: string;
  refNumber: string;
  projectUuid?: string;
  chargedTo?: ChargedTo;
  at: string;
  by: string;
};

export const stockBalance = (store: Store, itemUuid: string, warehouseUuid?: string): number =>
  round2(
    store.StockMovements.filter(
      (m) => m.itemUuid === itemUuid && (!warehouseUuid || m.warehouseUuid === warehouseUuid),
    ).reduce((sum, m) => sum + m.qty, 0),
  );

/** Weighted average cost of what has come in. What an issue is valued at. */
export const averageCost = (store: Store, itemUuid: string): number => {
  const incoming = store.StockMovements.filter((m) => m.itemUuid === itemUuid && m.qty > 0);
  const qty = incoming.reduce((sum, m) => sum + m.qty, 0);
  if (qty === 0) {
    return findOrThrow(store.Items, itemUuid, "Item").standardCost;
  }
  return round2(incoming.reduce((sum, m) => sum + m.qty * m.unitCost, 0) / qty);
};

/** Throws naming the first line the warehouse cannot cover. */
export const assertStockCovers = (store: Store, warehouseUuid: string, lines: QuantityLine[]): void => {
  for (const line of lines) {
    const available = stockBalance(store, line.itemUuid, warehouseUuid);
    if (available < line.qty) {
      const item = findOrThrow(store.Items, line.itemUuid, "Item");
      throw new Error(`Not enough ${item.name} in stock: ${available} ${item.unit} available, ${line.qty} needed`);
    }
  }
};

export const addMovement = (store: Store, input: MovementInput): void => {
  store.StockMovements.push({ uuid: generateUuid(), ...input, qty: round2(input.qty) });
};
