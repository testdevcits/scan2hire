import { createContext, useContext, useMemo } from "react";
import { authApi, candidateApi, employeeApi, hrApi } from "../services/api";
import API from "../services/httpClient";

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const api = useMemo(
    () => ({
      authApi,
      API,
      adminApi: authApi,
      hrApi,
      employeeApi,
      public: {
        auth: {
          requestSignupOtp: authApi.requestSignupOtp,
          verifySignupOtp: authApi.verifySignupOtp,
        },
        candidate: candidateApi,
        password: {
          forgotPassword: employeeApi.forgotPassword,
          resetPassword: employeeApi.resetPassword,
        },
      },
    }),
    []
  );
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside ApiProvider");
  return api;
};
