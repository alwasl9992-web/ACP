import { createContext, useContext, useState } from "react";
import type { Project } from "../models/Project";

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  selectedProject: null,
  setSelectedProject: () => {},
});

export const ProjectProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  return (
    <ProjectContext.Provider
      value={{
        selectedProject,
        setSelectedProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);