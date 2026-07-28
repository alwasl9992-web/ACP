import { buildings } from "../data/buildings";
import type { Building } from "../models/Building";

class BuildingService {
  getBuildings(): Building[] {
    return buildings;
  }

  getBuildingsByProject(projectId: string): Building[] {
    return buildings.filter((b) => b.projectId === projectId);
  }
}

export default new BuildingService();