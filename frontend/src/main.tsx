import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

import { AuthProvider } from "./auth/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { BuildingProvider } from "./context/BuildingContext";
import { NavigationProvider } from "./context/NavigationContext";
import { registerServiceWorker } from "./offline/registerServiceWorker";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <ProjectProvider>
          <BuildingProvider>
            <App />
          </BuildingProvider>
        </ProjectProvider>
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>,
);
