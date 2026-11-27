export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://scan2hire-backend.vercel.app/api";

export const IDLE_TIMEOUT_MS = Number(process.env.REACT_APP_IDLE_TIMEOUT_MS) || 60 * 60 * 1000;
