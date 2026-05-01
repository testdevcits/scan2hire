import API from "./axios";

export const authApi = {
  login: (payload) => API.post("/users/login", payload),
  signup: (payload) => API.post("/users/signup", payload),
  requestSignupOtp: (payload) => API.post("/users/signup/request-otp", payload),
  verifySignupOtp: (payload) => API.post("/users/signup/verify-otp", payload),
  getProfile: () => API.get("/users/me"),
  updateMyDocuments: (payload) => API.patch("/users/me/documents", payload),
  getHrs: () => API.get("/users/hrs"),
  createHr: (payload) => API.post("/users/hrs", payload),
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
  deactivateEmployee: (employeeId) =>
    API.patch(`/hr/employees/${employeeId}/deactivate`),
  activateEmployee: (employeeId) =>
    API.patch(`/hr/employees/${employeeId}/activate`),
  deleteEmployee: (employeeId) => API.delete(`/hr/employees/${employeeId}`),
  getAttendance: (month) => API.get("/hr/attendance", { params: { month } }),
  getEmployeeMonthlyReport: (employeeId, month) =>
    API.get(`/hr/attendance/employees/${employeeId}/monthly`, { params: { month } }),
  getLeaves: () => API.get("/hr/leaves"),
  reviewLeave: (leaveId, payload) => API.patch(`/hr/leaves/${leaveId}`, payload),
  getCalendar: (month) => API.get("/hr/calendar", { params: { month } }),
  upsertCalendar: (payload) => API.post("/hr/calendar", payload),
};

export const employeeApi = {
  getProfile: () => API.get("/employees/me"),
  requestDocumentOtp: () => API.post("/employees/me/documents/otp"),
  updateDocuments: (payload) => API.patch("/employees/me/documents", payload),
  getAttendance: () => API.get("/employees/attendance"),
  startDay: () => API.post("/employees/attendance/start"),
  endDay: () => API.post("/employees/attendance/end"),
  startBreak: (payload) => API.post("/employees/attendance/break/start", payload),
  endBreak: () => API.post("/employees/attendance/break/end"),
  getLeaves: () => API.get("/employees/leaves"),
  applyLeave: (payload) => API.post("/employees/leaves", payload),
  getCalendar: (month) => API.get("/employees/calendar", { params: { month } }),
  getAssignedCandidates: () => API.get("/employees/candidates"),
  updateRound: (candidateId, payload) =>
    API.put(`/employees/candidates/${candidateId}/round`, payload),
  forgotPassword: (payload) => API.post("/employees/forgot-password", payload),
  resetPassword: (payload) => API.post("/employees/reset-password", payload),
};

export const qrApi = {
  generate: () => API.post("/qr-ids"),
};
