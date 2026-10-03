"use server";

import { redirect } from "next/navigation";
import { createTask } from "services";
import { taskSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createTaskAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createTask(actor, input)).uuid;
    },
    { schema: taskSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/tasks/${created}`);
};
