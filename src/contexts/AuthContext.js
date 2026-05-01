import React, { createContext, useState } from "react";
import { authApi } from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user from sessionStorage
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(false);

  // ---------------------
  // Login function
  // ---------------------
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });

      if (data.success) {
        // Save in React state
        setUser(data.data);
        setToken(data.data.token);

        // Save in sessionStorage
        sessionStorage.setItem("user", JSON.stringify(data.data));
        sessionStorage.setItem("token", data.data.token);

        setLoading(false);
        return { success: true, data: data.data };
      }

      setLoading(false);
      return { success: false, message: "Login failed" };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  // ---------------------
  // Signup function
  // ---------------------
  const signup = async (name, email, mobile, password, role = "hr") => {
    setLoading(true);
    try {
      const { data } = await authApi.signup({
        name,
        email,
        mobile,
        password,
        role,
      });

      if (data.success) {
        // Store user info from signup response
        setUser(data.data);
        setToken(data.data.token);

        sessionStorage.setItem("user", JSON.stringify(data.data));
        sessionStorage.setItem("token", data.data.token);

        setLoading(false);
        return { success: true, data: data.data };
      }

      setLoading(false);
      return { success: false, message: "Signup failed" };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || "Signup failed",
      };
    }
  };

  // ---------------------
  // Logout function
  // ---------------------
  const logout = async () => {
    setLoading(true);
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
