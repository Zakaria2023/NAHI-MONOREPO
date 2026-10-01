"use server";

import { redirect } from "next/navigation";
import { createStocktake } from "services";
import { stocktakeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createStocktakeAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createStocktake(actor, input)).uuid;
    },
    { schema: stocktakeSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/warehouse/stocktakes/${created}`);
};
