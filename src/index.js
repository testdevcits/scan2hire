import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import "./styles/base.css";

import App from "./app/App";
import AppProviders from "./app/AppProviders";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

reportWebVitals();
