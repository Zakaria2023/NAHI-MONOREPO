"use server";

import { redirect } from "next/navigation";
import { registerFixedAsset } from "services";
import { fixedAssetSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const registerAssetAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await registerFixedAsset(actor, input)).uuid;
    },
    { schema: fixedAssetSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/finance/assets/${created}`);
};
