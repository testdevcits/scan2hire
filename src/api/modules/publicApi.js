// APIs intentionally available before login: candidate forms, OTP and
// password recovery.
import { candidateApi, employeeApi, authApi } from "../api";

export const publicCandidateApi = candidateApi;
export const publicPasswordApi = {
  forgotPassword: employeeApi.forgotPassword,
  resetPassword: employeeApi.resetPassword,
};
export const publicAuthApi = {
  requestSignupOtp: authApi.requestSignupOtp,
  verifySignupOtp: authApi.verifySignupOtp,
};
