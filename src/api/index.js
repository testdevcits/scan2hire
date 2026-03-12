// src/api/index.js

const BASE_URL = "https://scan2hire-backend.vercel.app/api";

/**
 * Generic API request handler
 * @param {string} endpoint
 * @param {object} options
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`[API ERROR] ${endpoint}:`, err);
    throw err;
  }
};

/**
 * Generate QR ID
 */
export const generateQrId = () => {
  return apiRequest("/qr-ids", {
    method: "POST",
  });
};

/**
 * Save Candidate Form
 */
export const saveCandidate = (data) => {
  return apiRequest("/candidates", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Send OTP to candidate email
 */
export const sendOtp = (data) => {
  return apiRequest("/candidates/send-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Verify OTP
 */
export const verifyOtp = (data) => {
  return apiRequest("/candidates/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
