import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ConfirmProvider from "./components/ConfirmProvider.jsx";

createRoot(document.getElementById("root")).render(
  <ConfirmProvider>
    <App />
  </ConfirmProvider>
);
