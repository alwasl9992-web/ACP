export interface Site {
  id: string;
  code: string;

  name: string;
  city: string;
  region: string;

  type: "حكومي" | "خاص";

  status: "نشط" | "متوقف" | "تحت الإنشاء";

  projects: number;
  assets: number;

  manager: string;

  createdAt: string;
}