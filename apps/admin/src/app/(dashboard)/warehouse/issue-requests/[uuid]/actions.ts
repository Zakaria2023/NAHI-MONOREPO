"use server";

import { decideIssueRequest, issueStock } from "services";
import { decisionSchema, issueStockSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the request in the page (`action.bind(null, uuid)`).

export const decideIssueRequestAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideIssueRequest(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

export const issueStockAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => issueStock(actor, uuid, input), { schema: issueStockSchema, success: "Stock issued" });
