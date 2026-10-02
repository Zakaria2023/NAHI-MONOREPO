"use server";

import { countFixedAsset, disposeFixedAsset, transferFixedAsset } from "services";
import { assetCountSchema, assetDisposalSchema, assetTransferSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Every action here is bound to its asset in the page (`action.bind(null, uuid)`).

export const transferAssetAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => transferFixedAsset(actor, uuid, input), { schema: assetTransferSchema, success: "Asset moved" });

export const countAssetAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => countFixedAsset(actor, uuid, input), { schema: assetCountSchema, success: "Count recorded" });

export const disposeAssetAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => disposeFixedAsset(actor, uuid, input), { schema: assetDisposalSchema, success: "Asset taken off the books" });
