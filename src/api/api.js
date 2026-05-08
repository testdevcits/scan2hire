import API from "./axios";

export const authApi = {
  login: (payload) => API.post("/users/login", payload),
  signup: (payload) => API.post("/users/signup", payload),
  requestSignupOtp: (payload) => API.post("/users/signup/request-otp", payload),
  verifySignupOtp: (payload) => API.post("/users/signup/verify-otp", payload),
  getProfile: () => API.get("/users/me"),
  updateProfile: (payload) => API.put("/users/me", payload),
  getSettings: () => API.get("/users/settings"),
  updateSettings: (payload) => API.put("/users/settings", payload),
  verifyVaultPassword: (payload) => API.post("/users/settings/verify-vault", payload),
  updateMyDocuments: (payload) => API.patch("/users/me/documents", payload),
  getMyAccountCredentials: () => API.get("/users/me/account-credentials"),
  createMyAccountCredential: (payload) => API.post("/users/me/account-credentials", payload),
  deleteMyAccountCredential: (credentialId) => API.delete(`/users/me/account-credentials/${credentialId}`),
  getHrs: (role) => API.get("/users/hrs", { params: role ? { role } : undefined }),
  createHr: (payload) => API.post("/users/hrs", payload),
  updateUser: (userId, payload) => API.put(`/users/${userId}`, payload),
  deactivateUser: (userId) => API.patch(`/users/${userId}/deactivate`),
  activateUser: (userId) => API.patch(`/users/${userId}/activate`),
  deleteUser: (userId) => API.delete(`/users/${userId}`),
  getNotifications: () => API.get("/users/notifications"),
  markNotificationRead: (notificationId) => API.patch(`/users/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => API.delete(`/users/notifications/${notificationId}`),
};

export const candidateApi = {
  save: (payload) => API.post("/candidates", payload),
  sendOtp: (payload) => API.post("/candidates/send-otp", payload),
  resendOtp: (payload) => API.post("/candidates/resend-otp", payload),
  verifyOtp: (payload) => API.post("/candidates/verify-otp", payload),
};

export const hrApi = {
  getCandidates: () => API.get("/hr/candidates"),
  getCandidate: (candidateId) => API.get(`/hr/candidates/${candidateId}`),
  updateCandidateStatus: (candidateId, payload) =>
    API.put(`/hr/candidates/${candidateId}/status`, payload),
  convertCandidateToEmployee: (candidateId, payload) =>
    API.post(`/hr/candidates/${candidateId}/convert-to-employee`, payload),
  deactivateCandidate: (candidateId) =>
    API.patch(`/hr/candidates/${candidateId}/deactivate`),
  activateCandidate: (candidateId) =>
    API.patch(`/hr/candidates/${candidateId}/activate`),
  deleteCandidate: (candidateId) => API.delete(`/hr/candidates/${candidateId}`),
  getEmployees: () => API.get("/hr/employees"),
  getEmployee: (employeeId) => API.get(`/hr/employees/${employeeId}`),
  createEmployee: (payload) => API.post("/hr/employees", payload),
  updateEmployee: (employeeId, payload) => API.put(`/hr/employees/${employeeId}`, payload),
  getEmployeeAccountCredentials: (employeeId) =>
    API.get(`/hr/employees/${employeeId}/account-credentials`),
  deactivateEmployee: (employeeId) =>
    API.patch(`/hr/employees/${employeeId}/deactivate`),
  activateEmployee: (employeeId) =>
    API.patch(`/hr/employees/${employeeId}/activate`),
  deleteEmployee: (employeeId) => API.delete(`/hr/employees/${employeeId}`),
  getAttendance: (month) => API.get("/hr/attendance", { params: { month } }),
  getEmployeeMonthlyReport: (employeeId, month) =>
    API.get(`/hr/attendance/employees/${employeeId}/monthly`, { params: { month } }),
  getLeaves: (params) => API.get("/hr/leaves", { params }),
  reviewLeave: (leaveId, payload) => API.patch(`/hr/leaves/${leaveId}`, payload),
  getCalendar: (month, year) => API.get("/hr/calendar", { params: { month, year } }),
  upsertCalendar: (payload) => API.post("/hr/calendar", payload),
  deleteCalendar: (dateKey) => API.delete(`/hr/calendar/${dateKey}`),
  getEmployeeCredentials: (vaultPassword) =>
    API.get("/hr/employee-credentials", { params: { vaultPassword } }),
  getEmployeeAccess: () => API.get("/hr/employee-access"),
  updateEmployeeAccess: (employeeId, payload) =>
    API.put(`/hr/employee-access/${employeeId}`, payload),
  assignTeamLeadEmployees: (teamLeadId, payload) =>
    API.put(`/hr/employee-access/team-leads/${teamLeadId}/assign`, payload),
  getSystemAllotments: (params) => API.get("/hr/system-allotments", { params }),
  createSystemAllotment: (payload) => API.post("/hr/system-allotments", payload),
  importSystemAllotments: (rows) => API.post("/hr/system-allotments/import", { rows }),
  bulkDeleteSystemAllotments: (rows) => API.post("/hr/system-allotments/bulk-delete", { rows }),
  updateSystemAllotment: (allotmentId, payload) =>
    API.put(`/hr/system-allotments/${allotmentId}`, payload),
  deleteSystemAllotment: (allotmentId) => API.delete(`/hr/system-allotments/${allotmentId}`),
};

export const employeeApi = {
  getProfile: () => API.get("/employees/me"),
  getMyAccess: () => API.get("/employees/me/access"),
  updateProfileImage: (payload) => API.patch("/employees/me/profile-image", payload),
  getMyAccountCredentials: () => API.get("/employees/me/account-credentials"),
  createMyAccountCredential: (payload) => API.post("/employees/me/account-credentials", payload),
  deleteMyAccountCredential: (credentialId) => API.delete(`/employees/me/account-credentials/${credentialId}`),
  requestDocumentOtp: () => API.post("/employees/me/documents/otp"),
  updateDocuments: (payload) => API.patch("/employees/me/documents", payload),
  getAttendance: () => API.get("/employees/attendance"),
  startDay: () => API.post("/employees/attendance/start"),
  endDay: () => API.post("/employees/attendance/end"),
  startBreak: (payload) => API.post("/employees/attendance/break/start", payload),
  endBreak: () => API.post("/employees/attendance/break/end"),
  getLeaves: () => API.get("/employees/leaves"),
  applyLeave: (payload) => API.post("/employees/leaves", payload),
  getCalendar: (month, year) => API.get("/employees/calendar", { params: { month, year } }),
  getAssignedCandidates: () => API.get("/employees/candidates"),
  getInterviewLogs: () => API.get("/employees/interview-logs"),
  updateRound: (candidateId, payload) =>
    API.put(`/employees/candidates/${candidateId}/round`, payload),
  getSystemAllotments: (params) => API.get("/employees/system-allotments", { params }),
  getSystemAllotmentEmployees: () => API.get("/employees/system-allotments/employees"),
  createSystemAllotment: (payload) => API.post("/employees/system-allotments", payload),
  importSystemAllotments: (rows) => API.post("/employees/system-allotments/import", { rows }),
  bulkDeleteSystemAllotments: (rows) => API.post("/employees/system-allotments/bulk-delete", { rows }),
  updateSystemAllotment: (allotmentId, payload) =>
    API.put(`/employees/system-allotments/${allotmentId}`, payload),
  deleteSystemAllotment: (allotmentId) => API.delete(`/employees/system-allotments/${allotmentId}`),
  forgotPassword: (payload) => API.post("/employees/forgot-password", payload),
  resetPassword: (payload) => API.post("/employees/reset-password", payload),
  changePassword: (payload) => API.post("/employees/me/change-password", payload),
};
