/* eslint-disable */
import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AUTH_SESSION_EXPIRED_EVENT, AUTH_TOKEN_REFRESHED_EVENT } from "../services/httpClient";
import { useApi } from "./ApiContext";
import { IDLE_TIMEOUT_MS } from "../env";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
];

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { authApi } = useApi();
  // Initialize user from sessionStorage
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(false);
  const idleTimerRef = useRef(null);
  const idleCheckRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

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
  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      /* Clear this browser even if the network is unavailable. */
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setLoading(false);
    loggingOutRef.current = false;
  }, [authApi]);

  // Axios owns API token refreshes. Keep React auth state synchronized with
  // storage so route guards, sockets, and components see the current session.
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const refreshedToken = event.detail?.token;
      if (refreshedToken) setToken(refreshedToken);
    };
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  // Keep an active user signed in, but end the session after one hour without
  // any interaction. The timer is local to this browser tab and is reset by
  // normal mouse, keyboard, touch, pointer, and scroll activity.
  useEffect(() => {
    if (!user || !token) return undefined;

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();

    // Browsers throttle timers in background tabs, so also check elapsed time
    // when the tab becomes active again.
    idleCheckRef.current = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) logout();
    }, 60 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (idleCheckRef.current) window.clearInterval(idleCheckRef.current);
      idleTimerRef.current = null;
      idleCheckRef.current = null;
    };
  }, [user, token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
