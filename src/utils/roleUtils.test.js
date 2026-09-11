import { getUserRoleClaims, isTeamLeadUser } from "./roleUtils";

describe("role utils", () => {
  it("detects team lead role from different role shapes", () => {
    expect(isTeamLeadUser({ role: "teamlead" })).toBe(true);
    expect(isTeamLeadUser({ effectiveRole: "teamlead" })).toBe(true);
    expect(isTeamLeadUser({ user: { role: "teamlead" } })).toBe(true);
    expect(isTeamLeadUser({ role: "employee" })).toBe(false);
  });

  it("collects all role claims without duplicates", () => {
    expect(
      getUserRoleClaims({ role: "employee", workRole: "teamlead", effectiveRole: "employee" })
    ).toEqual(["employee", "teamlead"]);
  });
});
