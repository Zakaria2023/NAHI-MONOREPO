"use server";

import { closePeriod, tickClosingItem } from "services";
import { closingTickSchema } from "validators";
import { ClosingItem } from "@/db/enum";
import { runAction } from "@/lib/server/run-action";

// Bound to the period (and the item) in the closing card.

export const tickClosingItemAction = async (period: string, item: ClosingItem) =>
  runAction({ period, item }, (actor, input) => tickClosingItem(actor, input), { schema: closingTickSchema, success: "Marked done" });

export const closePeriodAction = async (period: string) =>
  runAction(undefined, (actor) => closePeriod(actor, period), { success: "Period closed" });
