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
import type { PlatformGate, PlatformReport } from "../types/platform";

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
  payload: Record<string, unknown>;
  createdAt: string;
}

interface GateDailyLog {
  id: string;
  project_id: string;
  gate_id: string;
  log_date: string;
  trucks_count: number;
  visitors_count: number;
  contractors_count: number;
  event_summary: string | null;
  action_taken: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DailyExportRow {
  gate: string;
  trucks: number;
  visitors: number;
  contractors: number;
  event: string;
  action: string;
}

const demoReports: ReportRecord[] = [
  { id: "demo-1", code: "RPT-260731-01", title: "تقرير التشغيل اليومي", type: "Daily", location: "جميع البوابات", period: "31-07-2026", status: "Ready", owner: "إدارة التشغيل", payload: { rows: [{ gate: "مبنى 1 - بوابة 1", trucks: 18, visitors: 42, contractors: 7, event: "لا يوجد", action: "لا يوجد" }] }, createdAt: "2026-07-31" },
  { id: "demo-2", code: "RPT-260731-02", title: "ملخص البلاغات المفتوحة", type: "Maintenance", location: "الموقع الرئيسي", period: "يوليو 2026", status: "Approved", owner: "إدارة الصيانة", payload: { rows: [] }, createdAt: "2026-07-31" },
  { id: "demo-3", code: "RPT-260731-03", title: "حالة الأصول والمباني", type: "Assets", location: "جميع المواقع", period: "الربع الثالث", status: "Draft", owner: "إدارة الأصول", payload: { rows: [] }, createdAt: "2026-07-31" },
];

const typeLabel: Record<ReportType, string> = {
  Daily: "تشغيل يومي",
  Maintenance: "بلاغات وصيانة",
  Assets: "أصول ومبانٍ",
  Employees: "موظفون",
};

const statusLabel: Record<ReportUiStatus, string> = {
  Ready: "جاهز",
  Draft: "مسودة",
  Approved: "معتمد",
};

function uiType(value: string): ReportType {
  if (value === "maintenance") return "Maintenance";
  if (value === "assets") return "Assets";
  if (value === "employees") return "Employees";
  return "Daily";
}

function databaseType(value: ReportType): string {
  return value.toLowerCase();
}

function uiStatus(value: PlatformReport["status"]): ReportUiStatus {
  if (value === "approved" || value === "archived") return "Approved";
  if (value === "submitted") return "Ready";
  return "Draft";
}

function buildReportNo(count: number): string {
  const now = new Date();
  const date = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `RPT-${date}-${String(count + 1).padStart(2, "0")}`;
}

function payloadRows(payload: Record<string, unknown>): DailyExportRow[] {
  const rows = payload.rows;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const item = row as Partial<DailyExportRow>;
    return {
      gate: String(item.gate ?? "-"),
      trucks: Number(item.trucks ?? 0),
      visitors: Number(item.visitors ?? 0),
      contractors: Number(item.contractors ?? 0),
      event: String(item.event ?? "-"),
      action: String(item.action ?? "-"),
    };
  });
}

export default function Reports() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"All" | ReportType>("All");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
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

      const cloudReports = await listRecords<PlatformReport>("reports", {
        order: "created_at.desc",
        filters: { project_id: `eq.${selectedProject.id}` },
      });

      setReports(
        cloudReports.map((report) => ({
          id: report.id,
          code: report.report_no,
          title: report.title,
          type: uiType(report.report_type),
          location: selectedProject.location || "المشروع",
          period: report.period_start && report.period_end
            ? `${report.period_start} — ${report.period_end}`
            : report.period_start ?? report.created_at.slice(0, 10),
          status: uiStatus(report.status),
          owner: report.created_by ? "مستخدم معتمد" : "نظام ACP",
          payload: report.payload,
          createdAt: report.created_at.slice(0, 10),
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
      const matchesSearch = !term || [report.code, report.title, report.location, report.owner]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesType = type === "All" || report.type === type;
      return matchesSearch && matchesType;
    });
  }, [reports, search, type]);

  const buildDefinition = (report: ReportRecord): ReportDefinition<DailyExportRow> => ({
    reportNo: report.code,
    title: report.title,
    subtitle: `${typeLabel[report.type]} — ${report.period}`,
    projectName: selectedProject?.name,
    generatedBy: profile?.full_name ?? report.owner,
    approvalStatus: statusLabel[report.status],
    verificationPath: `/reports/verify/${encodeURIComponent(report.code)}`,
    columns: [
      { key: "gate", label: "البوابة / الموقع" },
      { key: "trucks", label: "الشاحنات" },
      { key: "visitors", label: "الزوار" },
      { key: "contractors", label: "المقاولون" },
      { key: "event", label: "الحدث" },
      { key: "action", label: "الإجراء" },
    ],
    rows: payloadRows(report.payload),
  });

  const generateDailyReport = async () => {
    if (!selectedProject) return;
    setGenerating(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      let rows: DailyExportRow[];

      if (demoMode) {
        rows = [
          { gate: "مبنى 1 - بوابة 1", trucks: 18, visitors: 42, contractors: 7, event: "لا يوجد", action: "لا يوجد" },
          { gate: "مبنى 1 - بوابة 2", trucks: 11, visitors: 24, contractors: 4, event: "زيارة مورد", action: "تم التحقق والتسجيل" },
        ];
      } else {
        const [logs, gates] = await Promise.all([
          listRecords<GateDailyLog>("gate_daily_logs", {
            filters: { project_id: `eq.${selectedProject.id}`, log_date: `eq.${today}` },
          }),
          listRecords<PlatformGate>("gates", {
            filters: { project_id: `eq.${selectedProject.id}` },
          }),
        ]);
        const gateMap = new Map(gates.map((gate) => [gate.id, gate.name]));
        rows = logs.map((log) => ({
          gate: gateMap.get(log.gate_id) ?? log.gate_id,
          trucks: log.trucks_count,
          visitors: log.visitors_count,
          contractors: log.contractors_count,
          event: log.event_summary ?? "لا يوجد",
          action: log.action_taken ?? "لا يوجد",
        }));
      }

      const reportNo = buildReportNo(reports.length);
      const record: ReportRecord = {
        id: crypto.randomUUID(),
        code: reportNo,
        title: "تقرير التشغيل اليومي",
        type: "Daily",
        location: selectedProject.location || "جميع المواقع",
        period: today,
        status: "Ready",
        owner: profile?.full_name ?? "إدارة التشغيل",
        payload: { rows, generated_at: new Date().toISOString(), version: 1 },
        createdAt: today,
      };

      if (demoMode) {
        setReports((current) => [record, ...current]);
      } else {
        const timestamp = new Date().toISOString();
        await createRecord<PlatformReport>("reports", {
          project_id: selectedProject.id,
          report_no: reportNo,
          report_type: databaseType("Daily"),
          title: record.title,
          period_start: today,
          period_end: today,
          status: "submitted",
          payload: record.payload,
          qr_payload: `/reports/verify/${reportNo}`,
          created_by: profile?.id ?? null,
          approved_by: null,
          approved_at: null,
          created_at: timestamp,
          updated_at: timestamp,
        });
        await loadReports();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء التقرير اليومي.");
    } finally {
      setGenerating(false);
    }
  };

  const approveReport = async (report: ReportRecord) => {
    try {
      if (demoMode) {
        setReports((current) => current.map((item) => item.id === report.id ? { ...item, status: "Approved" } : item));
      } else {
        const timestamp = new Date().toISOString();
        await updateRecord<PlatformReport>("reports", report.id, {
          status: "approved",
          approved_by: profile?.id ?? null,
          approved_at: timestamp,
          updated_at: timestamp,
        });
        await loadReports();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر اعتماد التقرير.");
    }
  };

  const removeReport = async (report: ReportRecord) => {
    if (!window.confirm(`حذف التقرير ${report.code}؟`)) return;
    try {
      if (demoMode) setReports((current) => current.filter((item) => item.id !== report.id));
      else await deleteRecord("reports", report.id);
      if (!demoMode) await loadReports();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف التقرير.");
    }
  };

  const columns = useMemo<GridColDef<ReportRecord>[]>(
    () => [
      { field: "code", headerName: "رقم التقرير", minWidth: 150 },
      { field: "title", headerName: "اسم التقرير", minWidth: 210, flex: 1.1 },
      { field: "type", headerName: "النوع", minWidth: 130, valueFormatter: (value) => typeLabel[value as ReportType] },
      { field: "period", headerName: "الفترة", minWidth: 130 },
      { field: "owner", headerName: "إعداد", minWidth: 145 },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 105,
        renderCell: ({ value }) => (
          <Chip size="small" color={value === "Approved" ? "success" : value === "Ready" ? "primary" : "warning"} label={statusLabel[value as ReportUiStatus]} />
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        minWidth: 290,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Button size="small" onClick={() => openPrintableReport(buildDefinition(row))}>PDF</Button>
            <Button size="small" onClick={() => exportReportToExcel(buildDefinition(row))}>Excel</Button>
            {canApprove && row.status !== "Approved" && <Button size="small" color="success" onClick={() => void approveReport(row)}>اعتماد</Button>}
            {canDelete && <Button size="small" color="error" onClick={() => void removeReport(row)}>حذف</Button>}
          </Stack>
        ),
      },
    ],
    [canApprove, canDelete, profile?.full_name, selectedProject?.name],
  );

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لإنشاء التقارير.</Alert>;
  }

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>مركز التقارير</Typography>
          <Typography color="text.secondary">تقارير محفوظة وقابلة للاعتماد والتصدير PDF وExcel والتحقق عبر QR.</Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" onClick={() => void generateDailyReport()} disabled={generating}>
            {generating ? <CircularProgress size={22} color="inherit" /> : "إنشاء تقرير يومي"}
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}><Typography variant="body2" color="text.secondary">إجمالي التقارير</Typography><Typography variant="h4" fontWeight={800}>{reports.length}</Typography></Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}><Typography variant="body2" color="text.secondary">المعتمدة</Typography><Typography variant="h4" fontWeight={800}>{reports.filter((report) => report.status === "Approved").length}</Typography></Paper>
        <Paper sx={{ p: 2, flex: 1, borderRadius: 3 }}><Typography variant="body2" color="text.secondary">المسودات</Typography><Typography variant="h4" fontWeight={800}>{reports.filter((report) => report.status === "Draft").length}</Typography></Paper>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth size="small" label="بحث في التقارير" value={search} onChange={(event) => setSearch(event.target.value)} />
          <TextField select size="small" label="نوع التقرير" value={type} onChange={(event) => setType(event.target.value as "All" | ReportType)} sx={{ minWidth: 190 }}>
            <MenuItem value="All">جميع الأنواع</MenuItem>
            {Object.entries(typeLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={filteredReports} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>
    </Box>
  );
}
