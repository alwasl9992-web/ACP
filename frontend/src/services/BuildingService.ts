import { buildings } from "../data/buildings";
import type { Building } from "../models/Building";
import StorageService from "./StorageService";

const STORAGE_KEY = "ACP_ASSETS";

class BuildingService {
  getBuildings(): Building[] {
    const saved = StorageService.read(STORAGE_KEY) as Building[] | null;
    if (saved) return saved;
    StorageService.write(STORAGE_KEY, buildings);
    return buildings;
  }

  getBuildingsByProject(projectId: string): Building[] {
    return this.getBuildings().filter((building) => building.projectId === projectId);
  }

  saveBuildings(items: Building[]): void {
    StorageService.write(STORAGE_KEY, items);
  }

  addBuilding(item: Building): void {
    this.saveBuildings([...this.getBuildings(), item]);
  }

  updateBuilding(item: Building): void {
    this.saveBuildings(
      this.getBuildings().map((current) =>
        current.id === item.id ? item : current,
      ),
    );
  }

  deleteBuilding(id: string): void {
    this.saveBuildings(this.getBuildings().filter((item) => item.id !== id));
  }
}

export default new BuildingService();
