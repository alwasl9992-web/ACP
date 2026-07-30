export interface Building {
  id: string;

  projectId: string;

  // الهوية
  code: string;
  name: string;
  description: string;

  // نوع الأصل
  assetType: string;

  // الموقع
  location: string;

  // مواصفات الأصل
  manufacturer: string;
  model: string;
  serialNumber: string;

  // معلومات المبنى (إن كان الأصل مبنى)
  floors: number;
  gates: number;

  // دورة الحياة
  installDate: string;
  warrantyExpiry: string;

  // الأهمية
  criticality: "Low" | "Medium" | "High" | "Critical";

  // الحالة
  status: "Running" | "Maintenance" | "Stopped" | "Completed";

  // التتبع
  qrCode: string;

  createdAt: string;
  updatedAt: string;
}