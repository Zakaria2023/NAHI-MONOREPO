"use server";

import { redirect } from "next/navigation";
import { createItem } from "services";
import { itemSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createItemAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createItem(actor, input)).uuid;
    },
    { schema: itemSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/warehouse/items/${created}`);
};
