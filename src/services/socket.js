import { io } from "socket.io-client";
import API from "./httpClient";

const getSocketURL = () => {
  const baseURL = API.defaults.baseURL || "";
  return baseURL.replace(/\/api\/?$/, "") || "https://scan2hire-backend.vercel.app";
};

export const createSocket = () =>
  io(getSocketURL(), {
    transports: ["websocket", "polling"],
    auth: {
      token: sessionStorage.getItem("token") || "",
    },
  });
