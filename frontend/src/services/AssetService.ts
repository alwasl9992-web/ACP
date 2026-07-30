import { buildings as assets } from "../data/buildings";
import type { Building as Asset } from "../models/Building";

class AssetService {
  getAssets(): Asset[] {
    return assets;
  }

  getAssetsByProject(projectId: string): Asset[] {
    return assets.filter((asset) => asset.projectId === projectId);
  }
}

export default new AssetService();
