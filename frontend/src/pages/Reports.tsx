import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/authService";
import { useProject } from "../context/ProjectContext";
import {
  buildVerificationPayload,
  exportReportToExcel,
  openPrintableReport,
  type ReportDefinition,
} from "../reports/exporters";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";
import type { PlatformReport } from "../types/platform";

type ReportType = "Daily" | "Maintenance" | "Assets" | "Employees";
type ReportUiStatus = "Ready" | "Draft" | "Approved";

interface ReportRecord {
  id: string;
  code: string;
  title: string;
  type: ReportType;
  location: string;
  period: string;
  status: ReportUiStatus;
  owner: string;
  createdAt: string;
}

const demoReports: ReportRecord[] = [
  { id: "demo-1", code: "RPT-260731-01", title: "تقرير التشغيل اليومي", type: "Daily", location: "جميع المواقع", period: "31-07-2026", status: "Ready", owner: "إدارة التشغيل", createdAt: "2026-07-31" },
  { id: "demo-2", code: "RPT-260731-02", title: "ملخص البلاغات المفتوحة", type: "Maintenance", location: "الموقع الرئيسي", period: "يوليو 2026", status: "Approved", owner: "إدارة الصيانة", createdAt: "2026-07-31" },
  { id: "demo-3", code: "RPT-260731-03", title: "حالة الأصول والمباني", type: "Assets", location: "جميع المواقع", period: "الربع الثالث", status: "Draft", owner: "إدارة الأصول", createdAt: "2026-07-31" },
];

const typeLabel: Record<ReportType, string> = {
  Daily: "تشغيل يومي",
  Maintenance: "بلاغات وصيانة",
  Assets: "أصول ومبانٍ",
  Employees: "موظفون",
};

const statusLabel: Record<ReportUiStatus, string> = {
  Ready: "بانتظار الاعتماد",
  Draft: "مسودة",
  Approved: "معتمد",
};

function uiStatus(status: PlatformReport["status"]): ReportUiStatus {
  return status === "approved" ? "Approved" : status === "submitted" ? "Ready" : "Draft";
}

function reportType(value: string): ReportType {
  return value === "Maintenance" || value === "Assets" || value === "Employees"
    ? value
    : "Daily";
}

function payloadText(payload: Record<string, unknown>, key: string, fallback = "-"): string {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function makeReportNo(count: number): string {
  const now = new Date();
  const date = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `RPT-${date}-${String(count + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"All" | ReportType>("All");
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = demoMode || can(profile?.role, "report.create");
  const canApprove = demoMode || can(profile?.role, "report.approve");
  const canDelete = demoMode || can(profile?.role, "record.delete");

  const loadReports = useCallback(async () => {
    if (!selectedProject) {
      setReports([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setReports(demoReports);
        return;
      }

      const rows = await listRecords<PlatformReport>("reports", {
        order: "created_at.desc",
        filters: { project_id: `eq.${selectedProject.id}` },
      });
      setReports(
        rows.map((row) => ({
          id: row.id,
          code: row.report_no,
          title: row.title,
          type: reportType(row.report_type),
          location: payloadText(row.payload, "location", selectedProject.name),
          period: payloadText(row.payload, "period", row.period_start ?? "-"),
          status: uiStatus(row.status),
          owner: payloadText(row.payload, "owner", "نظام ACP"),
          createdAt: row.created_at.slice(0, 10),
        })),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل التقارير.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch =
        !term ||
        [report.code, report.title, report.location, report.owner]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return matchesSearch && (type === "All" || report.type === type);
    });
  }, [reports, search, type]);

  const buildDefinition = useCallback(
    (report: ReportRecord): ReportDefinition<ReportRecord> => ({
      reportNo: report.code,
      title: report.title,
      subtitle: typeLabel[report.type],
      projectName: selectedProject?.name,
      generatedBy: report.owner,
      generatedAt: new Date(),
      approvalStatus: statusLabel[report.status],
      verificationPath: `/reports/verify/${encodeURIComponent(report.code)}`,
      columns: [
        { key: "code", label: "رقم التقرير" },
        { key: "title", label: "اسم التقرير" },
        { key: "type", label: "النوع", format: (value) => typeLabel[value as ReportType] },
        { key: "location", label: "النطاق" },
        { key: "period", label: "الفترة" },
        { key: "status", label: "الحالة", format: (value) => statusLabel[value as ReportUiStatus] },
        { key: "owner", label: "الإعداد" },
      ],
      rows: [report],
    }),
    [selectedProject?.name],
  );

  const createDailyReport = async () => {
    if (!selectedProject) return;
    setWorkingId("new");
    setError(null);
    try {
      const timestamp = new Date().toISOString();
      const code = makeReportNo(reports.length);
      const next: ReportRecord = {
        id: crypto.randomUUID(),
        code,
        title: "تقرير التشغيل اليومي",
        type: "Daily",
        location: selectedProject.name,
        period: new Date().toLocaleDateString("ar-SA"),
        status: "Draft",
        owner: profile?.full_name ?? "إدارة التشغيل",
        createdAt: timestamp.slice(0, 10),
      };

      if (demoMode) {
        setReports((current) => [next, ...current]);
      } else {
        await createRecord<PlatformReport>("reports", {
          project_id: selectedProject.id,
          report_no: code,
          report_type: "Daily",
          title: next.title,
          period_start: timestamp.slice(0, 10),
          period_end: timestamp.slice(0, 10),
          status: "draft",
          payload: {
            location: next.location,
            period: next.period,
            owner: next.owner,
          },
          qr_payload: buildVerificationPayload(code),
          created_by: profile?.id ?? null,
          approved_by: null,
          approved_at: null,
          created_at: timestamp,
          updated_at: timestamp,
        });
        await loadReports();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء التقرير.");
    } finally {
      setWorkingId(null);
    }
  };

  const changeStatus = async (report: ReportRecord, status: ReportUiStatus) => {
    setWorkingId(report.id);
    setError(null);
    try {
      if (demoMode) {
        setReports((current) =>
          current.map((item) => (item.id === report.id ? { ...item, status } : item)),
        );
      } else {
        const timestamp = new Date().toISOString();
        await updateRecord<PlatformReport>("reports", report.id, {
          status: status === "Approved" ? "approved" : status === "Ready" ? "submitted" : "draft",
          approved_by: status === "Approved" ? profile?.id ?? null : null,
          approved_at: status === "Approved" ? timestamp : null,
          updated_at: timestamp,
        });
        await loadReports();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحديث حالة التقرير.");
    } finally {
      setWorkingId(null);
    }
  };

  const removeReport = async (report: ReportRecord) => {
    if (!window.confirm(`حذف التقرير: ${report.code}؟`)) return;
    setWorkingId(report.id);
    try {
      if (demoMode) setReports((current) => current.filter((item) => item.id !== report.id));
      else {
        await deleteRecord("reports", report.id);
        await loadReports();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف التقرير.");
    } finally {
      setWorkingId(null);
    }
  };

  const columns = useMemo<GridColDef<ReportRecord>[]>(
    () => [
      { field: "code", headerName: "رقم التقرير", minWidth: 150, flex: 0.8 },
      { field: "title", headerName: "اسم التقرير", minWidth: 220, flex: 1.2 },
      {
        field: "type",
        headerName: "النوع",
        minWidth: 140,
        flex: 0.8,
        valueFormatter: (value) => typeLabel[value as ReportType],
      },
      { field: "period", headerName: "الفترة", minWidth: 130, flex: 0.7 },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 130,
        flex: 0.7,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            color={value === "Approved" ? "success" : value === "Ready" ? "primary" : "warning"}
            label={statusLabel[value as ReportUiStatus]}
          />
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        minWidth: 390,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Button size="small" onClick={() => openPrintableReport(buildDefinition(row))}>PDF</Button>
            <Button size="small" onClick={() => exportReportToExcel(buildDefinition(row))}>Excel</Button>
            {canCreate && row.status === "Draft" && (
              <Button size="small" onClick={() => void changeStatus(row, "Ready")}>إرسال</Button>
            )}
            {canApprove && row.status === "Ready" && (
              <Button size="small" color="success" onClick={() => void changeStatus(row, "Approved")}>اعتماد</Button>
            )}
            {canDelete && (
              <Button size="small" color="error" onClick={() => void removeReport(row)}>حذف</Button>
            )}
          </Stack>
        ),
      },
    ],
    [buildDefinition, canApprove, canCreate, canDelete],
  );

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لعرض التقارير.</Alert>;
  }

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>مركز التقارير</Typography>
          <Typography color="text.secondary">إنشاء واعتماد وتصدير تقارير {selectedProject.name}.</Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" onClick={() => void createDailyReport()} disabled={workingId === "new"}>
            {workingId === "new" ? <CircularProgress size={22} color="inherit" /> : "إنشاء تقرير يومي"}
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
          <TextField fullWidth size="small" label="بحث في التقارير" value={search} onChange={(event) => setSearch(event.target.value)} />
          <TextField select size="small" label="نوع التقرير" value={type} onChange={(event) => setType(event.target.value as "All" | ReportType)} sx={{ minWidth: 190 }}>
            <MenuItem value="All">جميع الأنواع</MenuItem>
            <MenuItem value="Daily">تشغيل يومي</MenuItem>
            <MenuItem value="Maintenance">بلاغات وصيانة</MenuItem>
            <MenuItem value="Assets">أصول ومبانٍ</MenuItem>
            <MenuItem value="Employees">موظفون</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={filteredReports} columns={columns} loading={Boolean(workingId && workingId !== "new")} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>
    </Box>
  );
}
