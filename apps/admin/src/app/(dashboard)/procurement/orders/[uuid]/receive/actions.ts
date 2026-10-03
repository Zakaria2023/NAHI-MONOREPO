"use server";

import { redirect } from "next/navigation";
import { receiveGoods } from "services";
import { goodsReceiptSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const receiveGoodsAction = async (uuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => receiveGoods(actor, uuid, input), { schema: goodsReceiptSchema });
  if (result.error) {
    return result;
  }
  redirect(`/procurement/orders/${uuid}`);
};
