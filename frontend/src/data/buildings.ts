import type { Building } from "../models/Building";

export const buildings: Building[] = [
  {
    id: "1",
    projectId: "1",

    code: "B-001",

    name: "المبنى الرئيسي",

    description: "الإدارة",

    floors: 2,

    gates: 6,

    status: "Running",

    createdAt: "2026-07-22",

    updatedAt: "2026-07-22",
  },

  {
    id: "2",
    projectId: "1",

    code: "B-002",

    name: "المستودعات",

    description: "المستودع المركزي",

    floors: 1,

    gates: 3,

    status: "Running",

    createdAt: "2026-07-22",

    updatedAt: "2026-07-22",
  },
];