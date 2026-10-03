import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// PASSWORDS. Stored only as "salt:hash" (scrypt), even in the demo store. When
// Clerk replaces the sign-in, this file and the hashes go with it.

/** Every demo account's password; the sign-in page shows it. */
export const DEMO_PASSWORD = "nahi1234";

export const MIN_PASSWORD_LENGTH = 8;

const KEY_LENGTH = 32;

let demoHash: string | undefined;

export const hashPassword = (password: string, salt: string = randomBytes(16).toString("hex")): string =>
  `${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;

export const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

/** The demo password's hash, worked out once per process — the seed is rebuilt before every test. */
export const demoPasswordHash = (): string => {
  demoHash = demoHash ?? hashPassword(DEMO_PASSWORD, "nahi-demo");
  return demoHash;
};
