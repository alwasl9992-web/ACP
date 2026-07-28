export interface Gate {
  id: number;
  buildingId: number;
  name: string;
  type: string;
}

export const gates: Gate[] = [
  {
    id: 1,
    buildingId: 1,
    name: "البوابة الرئيسية",
    type: "دخول وخروج",
  },
];