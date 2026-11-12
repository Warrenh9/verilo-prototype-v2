import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./components/ui";
import { QualifyProvider } from "./context/QualifyContext";

// HashRouter so the static build works from any folder or file host without rewrites.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <QualifyProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </QualifyProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
);
