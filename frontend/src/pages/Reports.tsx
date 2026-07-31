import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

interface ReportRecord {
  id: number;
  code: string;
  title: string;
  type: "Daily" | "Maintenance" | "Assets" | "Employees";
  location: string;
  period: string;
  status: "Ready" | "Draft" | "Approved";
  owner: string;
}

const initialReports: ReportRecord[] = [
  { id: 1, code: "RPT-260731-01", title: "تقرير التشغيل اليومي", type: "Daily", location: "جميع المواقع", period: "31-07-2026", status: "Ready", owner: "إدارة التشغيل" },
  { id: 2, code: "RPT-260731-02", title: "ملخص البلاغات المفتوحة", type: "Maintenance", location: "الموقع الرئيسي", period: "يوليو 2026", status: "Approved", owner: "إدارة الصيانة" },
  { id: 3, code: "RPT-260731-03", title: "حالة الأصول والمباني", type: "Assets", location: "جميع المواقع", period: "الربع الثالث", status: "Draft", owner: "إدارة الأصول" },
];

const typeLabel = {
  Daily: "تشغيل يومي",
  Maintenance: "بلاغات وصيانة",
  Assets: "أصول ومبانٍ",
  Employees: "موظفون",
} as const;

const statusLabel = {
  Ready: "جاهز",
  Draft: "مسودة",
  Approved: "معتمد",
} as const;

export default function Reports() {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch = !term || [report.code, report.title, report.location, report.owner]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesType = type === "All" || report.type === type;
      return matchesSearch && matchesType;
    });
  }, [reports, search, type]);

  const columns: GridColDef<ReportRecord>[] = [
    { field: "code", headerName: "رقم التقرير", minWidth: 150, flex: 0.8 },
    { field: "title", headerName: "اسم التقرير", minWidth: 220, flex: 1.2 },
    {
      field: "type",
      headerName: "النوع",
      minWidth: 140,
      flex: 0.8,
      valueFormatter: (value) => typeLabel[value as ReportRecord["type"]],
    },
    { field: "location", headerName: "النطاق", minWidth: 150, flex: 0.8 },
    { field: "period", headerName: "الفترة", minWidth: 130, flex: 0.7 },
    { field: "owner", headerName: "الجهة", minWidth: 150, flex: 0.8 },
    {
      field: "status",
      headerName: "الحالة",
      minWidth: 110,
      flex: 0.6,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Approved" ? "success" : value === "Ready" ? "primary" : "warning"}
          label={statusLabel[value as ReportRecord["status"]]}
        />
      ),
    },
  ];

  const generateDailyReport = () => {
    const nextId = Date.now();
    setReports((current) => [
      {
        id: nextId,
        code: `RPT-${String(nextId).slice(-8)}`,
        title: "تقرير تشغيل يومي جديد",
        type: "Daily",
        location: "جميع المواقع",
        period: new Date().toLocaleDateString("ar-SA"),
        status: "Ready",
        owner: "إدارة التشغيل",
      },
      ...current,
    ]);
  };

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>مركز التقارير</Typography>
          <Typography color="text.secondary">إنشاء ومتابعة واعتماد تقارير التشغيل والأصول والموظفين والصيانة.</Typography>
        </Box>
        <Button variant="contained" onClick={generateDailyReport}>إنشاء تقرير يومي</Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">إجمالي التقارير</Typography>
          <Typography variant="h4" fontWeight={800}>{reports.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">المعتمدة</Typography>
          <Typography variant="h4" fontWeight={800}>{reports.filter((report) => report.status === "Approved").length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary">المسودات</Typography>
          <Typography variant="h4" fontWeight={800}>{reports.filter((report) => report.status === "Draft").length}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="بحث في التقارير"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <TextField
            select
            size="small"
            label="نوع التقرير"
            value={type}
            onChange={(event) => setType(event.target.value)}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="All">جميع الأنواع</MenuItem>
            <MenuItem value="Daily">تشغيل يومي</MenuItem>
            <MenuItem value="Maintenance">بلاغات وصيانة</MenuItem>
            <MenuItem value="Assets">أصول ومبانٍ</MenuItem>
            <MenuItem value="Employees">موظفون</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
        <DataGrid
          rows={filteredReports}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ border: 0, direction: "rtl" }}
        />
      </Paper>
    </Box>
  );
}
