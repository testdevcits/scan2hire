import React, { createContext, useState, useEffect } from "react";

// Create the context
export const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const storedMode = sessionStorage.getItem("themeMode");
    return storedMode || "light";
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const storedColor = sessionStorage.getItem("primaryColor");
    return storedColor || "#f59e0b"; // default amber-500
  });

  // Save to sessionStorage whenever changed
  useEffect(() => {
    sessionStorage.setItem("themeMode", mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    sessionStorage.setItem("primaryColor", primaryColor);
  }, [primaryColor]);

  // Toggle light/dark mode
  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Change primary color
  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  return (
    <ThemeContext.Provider
      value={{ mode, primaryColor, toggleMode, changePrimaryColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
