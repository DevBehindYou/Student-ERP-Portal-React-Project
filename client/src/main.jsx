import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ConfirmProvider from "./components/ConfirmProvider.jsx";
import ThemeProvider from "./components/ThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </ThemeProvider>
);
