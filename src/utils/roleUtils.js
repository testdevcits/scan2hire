export const getUserRoleClaims = (user = {}) => {
  const nestedUser = user?.user || {};
  const claims = [
    user?.role,
    user?.workRole,
    user?.effectiveRole,
    user?.employeeWorkRole,
    nestedUser?.role,
    nestedUser?.workRole,
    nestedUser?.effectiveRole,
  ].filter(Boolean);

  return [...new Set(claims)];
};

export const isTeamLeadUser = (user = {}) => getUserRoleClaims(user).includes("teamlead");
