import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Fetch only the requested public route while ApplicationProvider validates its initial snapshot.
// These imports share Vite's module cache with React.lazy; no duplicate code or API request.
const path = window.location.pathname;
if (
  path.startsWith("/store/") ||
  (path === "/" && window.location.hostname.endsWith(".localhost"))
) {
  void import("./pages/Storefront.jsx").catch(() => {});
} else if (path.startsWith("/menu/")) {
  void import("./pages/DigitalMenu.jsx").catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
