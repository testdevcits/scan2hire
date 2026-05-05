import { createContext, useContext, useMemo } from "react";
import { ToastContainer, toast as notify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastContext = createContext(null);
const baseToastOptions = {
  style: {
    color: "#111827",
    fontFamily: "Montserrat, Arial, sans-serif",
  },
  icon: false,
};

export const ToastProvider = ({ children }) => {
  const toast = useMemo(() => {
    const show = (type, message) => {
      const toastId = `${type}-${message}`;
      if (notify.isActive(toastId)) return;
      const progressStyle =
        type === "error" ? { background: "#dc2626" } : { background: "#f84525" };
      notify[type](message, { toastId, ...baseToastOptions, progressStyle });
    };

    return {
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
      warning: (message) => show("warning", message),
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={3}
        toastClassName="scan2hire-toast"
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};
