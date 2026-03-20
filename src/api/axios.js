import axios from "axios";

const API = axios.create({
  baseURL: "https://scan2hire-backend.vercel.app/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token from sessionStorage
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token"); // ✅ FIXED

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized, token issue...");
    }
    return Promise.reject(error);
  }
);

export default API;
