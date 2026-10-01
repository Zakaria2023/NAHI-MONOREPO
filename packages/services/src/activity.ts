import { readStore, resetStore } from "../../../db";
import { ActivityEntry } from "../../../db/types";
import { Actor } from "./core/actor";
import { assertRole } from "./core/lookup";

export type ActivityFilters = {
  search?: string;
  limit?: number;
};

export const listActivity = async (filters: ActivityFilters = {}): Promise<ActivityEntry[]> => {
  const search = filters.search?.trim().toLowerCase();
  return readStore()
    .Activity.filter(
      (a) =>
        !search ||
        [a.entityLabel, a.action, a.actorName, a.detail ?? ""].some((v) =>
          v.toLowerCase().includes(search),
        ),
    )
    .slice(0, filters.limit ?? 200);
};

/** Settings → Reset demo data. */
export const resetDemoData = async (actor: Actor): Promise<void> => {
  assertRole(actor.role, ["system_admin"], "reset the demo data");
  resetStore();
};
