import axios from "axios";
import { API_BASE_URL } from "../env";

export const AUTH_TOKEN_REFRESHED_EVENT = "scan2hire:auth-token-refreshed";
export const AUTH_SESSION_EXPIRED_EVENT = "scan2hire:auth-session-expired";

const API = axios.create({
  baseURL: API_BASE_URL,
  // Carries only the HttpOnly refresh cookie. The access token stays in the
  // Authorization header, not a browser-readable cookie.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (!config.skipAuth && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "").toLowerCase();
    const request = error.config || {};
    const isRefreshRequest = String(request.url || "").endsWith("/users/refresh");
    if (status === 401 && !request._retriedAfterRefresh && !isRefreshRequest) {
      request._retriedAfterRefresh = true;
      try {
        refreshPromise ||= API.post("/users/refresh", {}, { skipAuth: true });
        const response = await refreshPromise;
        const token = response.data?.data?.token;
        if (!token) throw new Error("Refresh did not return an access token");
        sessionStorage.setItem("token", token);
        window.dispatchEvent(new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, { detail: { token } }));
        request.headers = { ...request.headers, Authorization: `Bearer ${token}` };
        return API(request);
      } catch {
        // The session cleanup below handles an invalid refresh session.
      } finally {
        refreshPromise = null;
      }
    }
    if (
      status === 401 &&
      (request._retriedAfterRefresh ||
        isRefreshRequest ||
        message.includes("inactive") ||
        message.includes("not authorized") ||
        message.includes("token"))
    ) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
      if (window.location.pathname !== "/login") {
        window.location.replace("/login?reason=session-expired");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
