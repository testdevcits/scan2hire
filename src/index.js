import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Import Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CandidateProvider } from "./contexts/Hr/CandidateContext";
import { EmployeeProvider } from "./contexts/Hr/EmployeeContext"; // <-- new
import { ToastProvider } from "./contexts/ToastContext";
import { ModalProvider } from "./contexts/ModalContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <CandidateProvider>
              <EmployeeProvider>
                <App />
              </EmployeeProvider>
            </CandidateProvider>
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
