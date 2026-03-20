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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CandidateProvider>
          <EmployeeProvider>
            {" "}
            {/* <-- wrap EmployeeProvider here */}
            <App />
          </EmployeeProvider>
        </CandidateProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
