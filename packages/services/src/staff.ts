import { readStore } from "../../../db";
import { PortalAccount, StaffUser } from "../../../db/types";

export const listStaff = async (): Promise<StaffUser[]> => readStore().StaffUsers;

export const getStaff = async (uuid: string): Promise<StaffUser | null> =>
  readStore().StaffUsers.find((u) => u.uuid === uuid) ?? null;

export const listPortalAccounts = async (): Promise<PortalAccount[]> => readStore().PortalAccounts;

export const getPortalAccount = async (uuid: string): Promise<PortalAccount | null> =>
  readStore().PortalAccounts.find((a) => a.uuid === uuid) ?? null;
