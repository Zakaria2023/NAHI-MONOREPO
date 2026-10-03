import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Actor, getStaff } from "services";

// THE MVP'S STAND-IN FOR CLERK. Staff sign in with an e-mail and password on
// /sign-in (or, for the demo, switch user from the sidebar); who is signed in
// is kept in a cookie. This is the one file the real identity provider
// replaces — everything else asks it who is acting and passes that Actor into
// the services, which check the role.

export const STAFF_COOKIE = "erp_user";

const COOKIE_OPTIONS = { path: "/", sameSite: "lax", httpOnly: true } as const;

/** The signed-in staff member, or null when nobody is. */
export const getSignedInStaff = cache(async (): Promise<Actor | null> => {
  const uuid = (await cookies()).get(STAFF_COOKIE)?.value;
  const user = uuid ? await getStaff(uuid) : null;
  return user ? { uuid: user.uuid, name: user.name, role: user.role } : null;
});

/** The signed-in staff member; anyone else is sent to sign in. */
export const getCurrentStaff = cache(async (): Promise<Actor> => {
  const actor = await getSignedInStaff();
  if (!actor) {
    redirect("/sign-in");
  }
  return actor;
});

/** What a Server Action calls first. */
export const requireStaff = (): Promise<Actor> => getCurrentStaff();

export const startSession = async (uuid: string): Promise<void> => {
  (await cookies()).set(STAFF_COOKIE, uuid, COOKIE_OPTIONS);
};

export const endSession = async (): Promise<void> => {
  (await cookies()).delete(STAFF_COOKIE);
};
