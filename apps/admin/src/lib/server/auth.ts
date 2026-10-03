import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { Actor, getStaff, listStaff } from "services";

// THE MVP'S STAND-IN FOR CLERK. There is no sign-in: the acting user is
// whoever the navbar's user switcher last chose, kept in a cookie. This is the
// one file the real identity provider replaces — everything else asks it who
// is acting and passes that Actor into the services, which check the role.

export const STAFF_COOKIE = "erp_user";

/** The acting user; the system admin until someone is chosen. */
export const getCurrentStaff = cache(async (): Promise<Actor> => {
  const uuid = (await cookies()).get(STAFF_COOKIE)?.value;
  const chosen = uuid ? await getStaff(uuid) : null;
  const user = chosen ?? (await listStaff()).find((u) => u.role === "system_admin");
  if (!user) {
    throw new Error("No staff users in the store — run pnpm db:reset");
  }
  return { uuid: user.uuid, name: user.name, role: user.role };
});

/** What a Server Action calls first. Same as above today; Clerk will make it refuse. */
export const requireStaff = (): Promise<Actor> => getCurrentStaff();

export const actAs = async (uuid: string): Promise<void> => {
  (await cookies()).set(STAFF_COOKIE, uuid, { path: "/", sameSite: "lax", httpOnly: true });
};
