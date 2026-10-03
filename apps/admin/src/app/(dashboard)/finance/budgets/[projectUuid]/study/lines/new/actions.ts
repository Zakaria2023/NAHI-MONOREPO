"use server";

import { redirect } from "next/navigation";
import { addStudyLine } from "services";
import { studyLineSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

/** Bound to the project in the form's page (`action.bind(null, projectUuid)`). */
export const addStudyLineAction = async (projectUuid: string, _prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const result = await runAction(data, (actor, input) => addStudyLine(actor, projectUuid, input), { schema: studyLineSchema });
  if (result.error) {
    return result;
  }
  redirect(`/finance/budgets/${projectUuid}/study`);
};
