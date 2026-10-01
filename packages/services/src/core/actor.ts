import { PortalAccount, StaffUser } from "../../../../db/types";

/** Who is doing something. Services check `role` against approval chains. */
export type Actor = Pick<StaffUser, "uuid" | "name" | "role">;

export type PortalActor = Pick<
  PortalAccount,
  "uuid" | "name" | "kind" | "operator" | "subcontractorUuid"
>;
