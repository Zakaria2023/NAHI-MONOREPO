import { describe, expect, it } from "vitest";
import { chainState, decide } from "./approvals";
import { Actor } from "./actor";

const as = (role: Actor["role"]): Actor => ({ uuid: role, name: role, role });
const CHAIN = ["direct_manager", "procurement"] as const;

describe("approval chains", () => {
  it("takes decisions only from the role whose turn it is", () => {
    expect(() => decide([...CHAIN], [], { actor: as("procurement"), decision: "approved" })).toThrow(/Direct manager/);
    const first = decide([...CHAIN], [], { actor: as("direct_manager"), decision: "approved" });
    expect(chainState([...CHAIN], first).nextRole).toBe("procurement");
    const second = decide([...CHAIN], first, { actor: as("procurement"), decision: "approved" });
    expect(chainState([...CHAIN], second).complete).toBe(true);
  });

  it("ends the chain on a rejection, which needs a reason", () => {
    expect(() => decide([...CHAIN], [], { actor: as("direct_manager"), decision: "rejected" })).toThrow(/reason/);
    const rejected = decide([...CHAIN], [], { actor: as("direct_manager"), decision: "rejected", note: "No budget" });
    expect(chainState([...CHAIN], rejected)).toMatchObject({ rejected: true, nextRole: null });
    expect(() => decide([...CHAIN], rejected, { actor: as("procurement"), decision: "approved" })).toThrow(/rejected/);
  });
});
