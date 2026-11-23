import axios from "axios";

const getBaseURL = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  return "https://scan2hire-backend.vercel.app/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: false,
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

// Optional response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "").toLowerCase();
    if (status === 401 && (message.includes("inactive") || message.includes("not authorized") || message.includes("token"))) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login?reason=session-expired");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
