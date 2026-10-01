"use server";

import { redirect } from "next/navigation";
import { createProject } from "services";
import { createProjectSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createProjectAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createProject(actor, input)).uuid;
    },
    { schema: createProjectSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/projects/${created}`);
};
