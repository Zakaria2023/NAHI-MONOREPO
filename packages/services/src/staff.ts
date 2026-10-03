import { readStore } from "../../../db";
import { PortalAccount } from "../../../db/types";
import { StaffAccount, toStaffAccount } from "./auth";

export const listStaff = async (): Promise<StaffAccount[]> => readStore().StaffUsers.map(toStaffAccount);

export const getStaff = async (uuid: string): Promise<StaffAccount | null> => {
  const user = readStore().StaffUsers.find((u) => u.uuid === uuid);
  return user ? toStaffAccount(user) : null;
};

export const listPortalAccounts = async (): Promise<PortalAccount[]> => readStore().PortalAccounts;

export const getPortalAccount = async (uuid: string): Promise<PortalAccount | null> =>
  readStore().PortalAccounts.find((a) => a.uuid === uuid) ?? null;
