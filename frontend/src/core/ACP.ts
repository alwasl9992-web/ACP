import ProjectService from "../services/ProjectService";

class ACP {

  getProjects() {
    return ProjectService.getProjects();
  }

  getStatistics() {

    const projects = this.getProjects();

    return {

      totalProjects: projects.length,

      totalBuildings: projects.reduce(
        (s, p) => s + p.buildings,
        0
      ),

      totalGates: projects.reduce(
        (s, p) => s + p.gates,
        0
      ),

      totalEmployees: projects.reduce(
        (s, p) => s + p.employees,
        0
      ),

      completion:
        projects.length === 0
          ? 0
          : Math.round(
              projects.reduce(
                (s, p) => s + p.completion,
                0
              ) / projects.length
            ),
    };
  }
}

export default new ACP();