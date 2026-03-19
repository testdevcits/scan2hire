import React, { createContext, useState } from "react";
import axios from "axios";

// Base URL for your API
const BASE_URL = "https://scan2hire-backend.vercel.app/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(false);

  // ---------------------
  // Login function
  // ---------------------
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/users/login`, {
        email,
        password,
      });

      if (data.success) {
        setUser(data.data); // data.data should contain { name, role, token, etc. }
        setToken(data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data));
        localStorage.setItem("token", data.data.token);
      }

      setLoading(false);
      return data;
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
      const { data } = await axios.post(`${BASE_URL}/users/signup`, {
        name,
        email,
        mobile,
        password,
        role,
      });

      if (data.success) {
        // Auto-login after signup
        await login(email, password);
      }

      setLoading(false);
      return data;
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
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
