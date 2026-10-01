import { generateUuid } from "utils";
import { EntityKind } from "../../../../db/enum";
import { Store } from "../../../../db/types";

type ActivityInput = {
  actorName: string;
  entity: EntityKind;
  entityUuid: string;
  entityLabel: string;
  action: string;
  detail?: string;
  at?: string;
};

/**
 * The audit log every document asks for. Called inside the same `transact` as
 * the change it records, so a change and its log entry are written together or
 * not at all.
 */
export const logActivity = (store: Store, input: ActivityInput): void => {
  store.Activity.unshift({
    uuid: generateUuid(),
    at: input.at ?? new Date().toISOString(),
    actorName: input.actorName,
    entity: input.entity,
    entityUuid: input.entityUuid,
    entityLabel: input.entityLabel,
    action: input.action,
    detail: input.detail,
  });
};
