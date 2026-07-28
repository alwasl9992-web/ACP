export interface Site {
  id: string;

  code: string;

  name: string;

  city: string;

  address: string;

  manager: string;

  status:
    | "Active"
    | "Inactive"
    | "Maintenance";

  projects: number;

  buildings: number;

  gates: number;

  assets: number;

  employees: number;

  workOrders: number;

  inspections: number;

  documents: number;

  completion: number;

  createdAt: string;

  updatedAt: string;
}