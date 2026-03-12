// src/api/index.js
const BASE_URL = "https://scan2hire-backend.vercel.app/api"; // Replace with your deployed backend

/**
 * Generic API request
 * @param {string} endpoint - API endpoint, e.g., "/qr-ids"
 * @param {object} options - fetch options: method, body, headers
 * @returns {Promise<any>} - JSON response
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
 * Specific API call to generate QR ID
 */
export const generateQrId = async () => {
  return apiRequest("/qr-ids", { method: "POST" });
};
