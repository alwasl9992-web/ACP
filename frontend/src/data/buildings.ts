import type { Building } from "../models/Building";

export const buildings: Building[] = [
  {
    id: "1",
    projectId: "1",

    // الهوية
    code: "AST-001",
    name: "المبنى الرئيسي",
    description: "مبنى الإدارة الرئيسية",

    // نوع الأصل
    assetType: "Building",

    // الموقع
    location: "المنطقة الشمالية",

    // الشركة المصنعة
    manufacturer: "ACP Construction",
    model: "Office Complex",
    serialNumber: "BLD-2026-0001",

    // خصائص المبنى
    floors: 2,
    gates: 6,

    // دورة الحياة
    installDate: "2026-01-10",
    warrantyExpiry: "2031-01-10",

    // الأهمية
    criticality: "Critical",

    // الحالة
    status: "Running",

    // QR
    qrCode: "AST-001",

    createdAt: "2026-07-22",
    updatedAt: "2026-07-22",
  },

  {
    id: "2",
    projectId: "1",

    code: "AST-002",
    name: "المستودع المركزي",
    description: "المستودع الرئيسي للمشروع",

    assetType: "Warehouse",

    location: "المنطقة الغربية",

    manufacturer: "ACP Storage",
    model: "Warehouse V2",
    serialNumber: "WAR-2026-0002",

    floors: 1,
    gates: 3,

    installDate: "2026-02-05",
    warrantyExpiry: "2031-02-05",

    criticality: "High",

    status: "Running",

    qrCode: "AST-002",

    createdAt: "2026-07-22",
    updatedAt: "2026-07-22",
  },
];