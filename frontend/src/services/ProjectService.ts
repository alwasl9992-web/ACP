import { projects } from "../data/projects";
import type { Project } from "../models/Project";
import StorageService from "./StorageService";

const STORAGE_KEY = "ACP_PROJECTS";

class ProjectService {
  getProjects(): Project[] {
    const saved = StorageService.read<Project[]>(STORAGE_KEY);

    if (saved) return saved;

    StorageService.write(STORAGE_KEY, projects);
    return [...projects];
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((project) => project.id === id);
  }

  saveProjects(projectList: Project[]): boolean {
    return StorageService.write(STORAGE_KEY, projectList);
  }

  addProject(project: Project): boolean {
    const nextProjects = [...this.getProjects(), project];
    return this.saveProjects(nextProjects);
  }
}

export default new ProjectService();
