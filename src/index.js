import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// HARD-LOCK API PREFIX to avoid React rewriting relative paths
window.__API_PREFIX__ = process.env.REACT_APP_BACKEND_URL || "https://stock-news-backend-e3h7.onrender.com/api";

// Force environment load BEFORE rendering
console.log("API Loaded =", window.__API_PREFIX__);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App API_PREFIX={window.__API_PREFIX__} />
  </React.StrictMode>
);
