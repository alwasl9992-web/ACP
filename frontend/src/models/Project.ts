export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;

  location: string;

  status: "Planning" | "Running" | "Completed" | "Stopped";

  startDate: string;
  endDate: string;

  manager: string;

  completion: number;

  buildings: number;
  gates: number;
  assets: number;
  employees: number;

  createdAt: string;
  updatedAt: string;
}