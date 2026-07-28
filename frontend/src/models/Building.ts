export interface Building {
  id: string;

  projectId: string;

  code: string;

  name: string;

  description: string;

  floors: number;

  gates: number;

  status: "Running" | "Completed";

  createdAt: string;

  updatedAt: string;
}