"use server";

import { redirect } from "next/navigation";
import { createIssueRequest } from "services";
import { issueRequestSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createIssueRequestAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createIssueRequest(actor, input)).uuid;
    },
    { schema: issueRequestSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/warehouse/issue-requests/${created}`);
};
