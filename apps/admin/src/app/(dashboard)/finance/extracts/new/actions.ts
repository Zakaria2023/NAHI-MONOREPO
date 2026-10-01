"use server";

import { redirect } from "next/navigation";
import { submitExtract } from "services";
import { extractSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Staff entering an extract on the subcontractor's behalf. */
export const submitExtractAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await submitExtract({ name: actor.name, via: "admin" }, input)).uuid;
    },
    { schema: extractSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/finance/extracts/${created}`);
};
