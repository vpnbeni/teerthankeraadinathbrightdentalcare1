import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { store } from "./store/store.js";
import { initializeAuthGuard } from "./utils/authGuard.js";
import "./index.css";

// Initialize authentication guard to prevent admin token conflicts
initializeAuthGuard();

ReactDOM.createRoot(document.getElementById("root")).render(
  // Remove StrictMode in production to prevent double API calls
  process.env.NODE_ENV === "development" ? (
    <React.StrictMode>
      <Provider store={store}>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </HashRouter>
      </Provider>
    </React.StrictMode>
  ) : (
    <Provider store={store}>
      <HashRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </HashRouter>
    </Provider>
  )
);
