import type { Site } from "./Site";

class SiteService {
  private sites: Site[] = [];

  getSites(): Site[] {
    return this.sites;
  }

  getSite(id: string): Site | undefined {
    return this.sites.find((site) => site.id === id);
  }

  addSite(site: Site): void {
    this.sites.push(site);
  }

  updateSite(updatedSite: Site): void {
    this.sites = this.sites.map((site) =>
      site.id === updatedSite.id ? updatedSite : site
    );
  }

  deleteSite(id: string): void {
    this.sites = this.sites.filter((site) => site.id !== id);
  }
}

export default new SiteService();