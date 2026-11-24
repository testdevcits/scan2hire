import { createContext, useContext, useMemo } from "react";
import { authApi } from "../api";
import API from "../api/axios";
import hrApi from "../api/modules/hrApi";
import employeeApi from "../api/modules/employeeApi";
import { publicAuthApi, publicCandidateApi, publicPasswordApi } from "../api/modules/publicApi";
import adminApi from "../api/modules/adminApi";

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const api = useMemo(() => ({
    authApi,
    API,
    adminApi,
    hrApi,
    employeeApi,
    public: {
      auth: publicAuthApi,
      candidate: publicCandidateApi,
      password: publicPasswordApi,
    },
  }), []);
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside ApiProvider");
  return api;
};
