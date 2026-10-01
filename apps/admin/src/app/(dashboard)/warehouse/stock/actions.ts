"use server";

import { createItem } from "services";
import { itemSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createItemAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createItem(actor, input), { schema: itemSchema, success: "Item added" });
