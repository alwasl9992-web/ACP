import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

import { ProjectProvider } from "./context/ProjectContext";
import { BuildingProvider } from "./context/BuildingContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectProvider>
      <BuildingProvider>
        <App />
      </BuildingProvider>
    </ProjectProvider>
  </StrictMode>
);