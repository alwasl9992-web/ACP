import { projects } from "../data/projects";
import type { Project } from "../models/Project";
import StorageService from "./StorageService";

const STORAGE_KEY = "ACP_PROJECTS";

class ProjectService {
  getProjects(): Project[] {
    const saved = StorageService.read(STORAGE_KEY);

    if (saved) return saved;

    StorageService.write(STORAGE_KEY, projects);

    return projects;
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  saveProjects(projects: Project[]) {
    StorageService.write(STORAGE_KEY, projects);
  }

  addProject(project: Project) {
    const list = this.getProjects();

    list.push(project);

    this.saveProjects(list);
  }
}

export default new ProjectService();