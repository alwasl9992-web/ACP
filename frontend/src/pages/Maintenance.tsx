import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";
import type { PlatformIncident } from "../types/platform";

type TicketStatus = "New" | "Assigned" | "InProgress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Critical";

interface CloudIncident extends PlatformIncident {
  category: string | null;
  assignee_text: string | null;
}

interface MaintenanceTicket {
  id: string;
  code: string;
  title: string;
  asset: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  description: string;
  createdAt: string;
}

const demoRows: MaintenanceTicket[] = [
  { id: "demo-1", code: "MT-26001", title: "تسرب مياه في دورة المياه", asset: "مبنى 1", category: "سباكة", priority: "High", status: "InProgress", assignee: "فريق الصيانة المدنية", description: "تم رصد تسرب داخل دورة المياه ويجري تحديد مصدره.", createdAt: "2026-07-31" },
  { id: "demo-2", code: "MT-26002", title: "تعطل قارئ الدخول", asset: "بوابة 2", category: "أنظمة أمنية", priority: "Critical", status: "Assigned", assignee: "فريق الأنظمة", description: "قارئ الدخول لا يستجيب ويحتاج فحصًا عاجلًا.", createdAt: "2026-07-31" },
  { id: "demo-3", code: "MT-26003", title: "فحص تكييف المستودع", asset: "مستودع 1", category: "تكييف", priority: "Medium", status: "New", assignee: "غير مسند", description: "انخفاض ملحوظ في كفاءة التبريد.", createdAt: "2026-07-30" },
];

const statusLabel: Record<TicketStatus, string> = {
  New: "جديد",
  Assigned: "مسند",
  InProgress: "قيد التنفيذ",
  Resolved: "تم الحل",
  Closed: "مغلق",
};

const priorityLabel: Record<TicketPriority, string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "عالية",
  Critical: "حرجة",
};

const emptyDraft: Omit<MaintenanceTicket, "id" | "code" | "createdAt"> = {
  title: "",
  asset: "",
  category: "",
  priority: "Medium",
  status: "New",
  assignee: "غير مسند",
  description: "",
};

function uiPriority(priority: PlatformIncident["priority"]): TicketPriority {
  return priority === "low" ? "Low" : priority === "medium" ? "Medium" : priority === "high" ? "High" : "Critical";
}

function databasePriority(priority: TicketPriority): PlatformIncident["priority"] {
  return priority.toLowerCase() as PlatformIncident["priority"];
}

function uiStatus(status: PlatformIncident["status"]): TicketStatus {
  if (status === "assigned") return "Assigned";
  if (status === "in_progress") return "InProgress";
  if (status === "resolved") return "Resolved";
  if (status === "closed" || status === "cancelled") return "Closed";
  return "New";
}

function databaseStatus(status: TicketStatus): PlatformIncident["status"] {
  if (status === "Assigned") return "assigned";
  if (status === "InProgress") return "in_progress";
  if (status === "Resolved") return "resolved";
  if (status === "Closed") return "closed";
  return "open";
}

function nextReportNo(count: number): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `MT-${year}${month}${String(count + 1).padStart(3, "0")}`;
}

export default function Maintenance() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [rows, setRows] = useState<MaintenanceTicket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = demoMode || can(profile?.role, "record.create");
  const canUpdate = demoMode || can(profile?.role, "record.update");
  const canDelete = demoMode || can(profile?.role, "record.delete");

  const loadTickets = useCallback(async () => {
    if (!selectedProject) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setRows(demoRows);
        return;
      }

      const incidents = await listRecords<CloudIncident>("incidents", {
        order: "created_at.desc",
        filters: { project_id: `eq.${selectedProject.id}` },
      });

      setRows(
        incidents.map((incident) => ({
          id: incident.id,
          code: incident.report_no,
          title: incident.title,
          asset: incident.building_id ? "مبنى مرتبط" : incident.gate_id ? "بوابة مرتبطة" : "المشروع",
          category: incident.category ?? "عام",
          priority: uiPriority(incident.priority),
          status: uiStatus(incident.status),
          assignee: incident.assignee_text ?? "غير مسند",
          description: incident.description,
          createdAt: incident.created_at.slice(0, 10),
        })),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل البلاغات.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || [row.code, row.title, row.asset, row.category, row.assignee]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const startEdit = (row: MaintenanceTicket) => {
    setEditingId(row.id);
    setDraft({
      title: row.title,
      asset: row.asset,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assignee: row.assignee,
      description: row.description,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(false);
  };

  const saveTicket = async () => {
    if (!selectedProject || !draft.title.trim() || !draft.category.trim() || !draft.description.trim()) {
      setError("عنوان البلاغ والتصنيف والوصف مطلوبة.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (demoMode) {
        const existing = rows.find((row) => row.id === editingId);
        const next: MaintenanceTicket = {
          id: editingId ?? crypto.randomUUID(),
          code: existing?.code ?? nextReportNo(rows.length),
          title: draft.title.trim(),
          asset: draft.asset.trim() || "المشروع",
          category: draft.category.trim(),
          priority: draft.priority,
          status: draft.status,
          assignee: draft.assignee.trim() || "غير مسند",
          description: draft.description.trim(),
          createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
        };
        setRows((current) =>
          editingId
            ? current.map((row) => (row.id === editingId ? next : row))
            : [next, ...current],
        );
      } else {
        const timestamp = new Date().toISOString();
        const values: Partial<CloudIncident> = {
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category.trim(),
          assignee_text: draft.assignee.trim() || null,
          priority: databasePriority(draft.priority),
          status: databaseStatus(draft.status),
          updated_at: timestamp,
          resolved_at: draft.status === "Resolved" || draft.status === "Closed" ? timestamp : null,
        };

        if (editingId) {
          await updateRecord<CloudIncident>("incidents", editingId, values);
        } else {
          await createRecord<CloudIncident>("incidents", {
            project_id: selectedProject.id,
            building_id: null,
            gate_id: null,
            report_no: nextReportNo(rows.length),
            title: draft.title.trim(),
            description: draft.description.trim(),
            category: draft.category.trim(),
            assignee_text: draft.assignee.trim() || null,
            priority: databasePriority(draft.priority),
            status: databaseStatus(draft.status),
            assigned_to: null,
            reported_by: profile?.id ?? null,
            due_at: null,
            resolved_at: null,
            created_at: timestamp,
            updated_at: timestamp,
          });
        }
      }

      closeDialog();
      if (!demoMode) await loadTickets();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ البلاغ.");
    } finally {
      setSaving(false);
    }
  };

  const removeTicket = async (row: MaintenanceTicket) => {
    if (!window.confirm(`حذف البلاغ ${row.code}؟`)) return;
    try {
      if (demoMode) setRows((current) => current.filter((item) => item.id !== row.id));
      else await deleteRecord("incidents", row.id);
      if (!demoMode) await loadTickets();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف البلاغ.");
    }
  };

  const columns = useMemo<GridColDef<MaintenanceTicket>[]>(
    () => [
      { field: "code", headerName: "رقم البلاغ", minWidth: 125 },
      { field: "title", headerName: "البلاغ", minWidth: 220, flex: 1.2 },
      { field: "asset", headerName: "الأصل / الموقع", minWidth: 140, flex: 0.7 },
      { field: "category", headerName: "التصنيف", minWidth: 115 },
      {
        field: "priority",
        headerName: "الأولوية",
        minWidth: 105,
        renderCell: ({ value }) => (
          <Chip size="small" color={value === "Critical" ? "error" : value === "High" ? "warning" : value === "Medium" ? "info" : "default"} label={priorityLabel[value as TicketPriority]} />
        ),
      },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 115,
        renderCell: ({ value }) => (
          <Chip size="small" color={value === "Closed" || value === "Resolved" ? "success" : value === "InProgress" ? "warning" : value === "Assigned" ? "info" : "default"} label={statusLabel[value as TicketStatus]} />
        ),
      },
      { field: "assignee", headerName: "المسؤول", minWidth: 150, flex: 0.8 },
      { field: "createdAt", headerName: "التاريخ", minWidth: 110 },
      {
        field: "actions",
        headerName: "الإجراءات",
        minWidth: 155,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            {canUpdate && <Button size="small" onClick={() => startEdit(row)}>تعديل</Button>}
            {canDelete && <Button size="small" color="error" onClick={() => void removeTicket(row)}>حذف</Button>}
          </Stack>
        ),
      },
    ],
    [canDelete, canUpdate],
  );

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لعرض البلاغات.</Alert>;
  }

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة البلاغات</Typography>
          <Typography color="text.secondary">تسجيل البلاغات وإسنادها ومتابعتها ضمن {selectedProject.name}.</Typography>
        </Box>
        {canCreate && <Button variant="contained" onClick={startCreate}>بلاغ جديد</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 3, flex: 1 }}>
          <TextField fullWidth size="small" label="بحث برقم البلاغ أو الأصل أو المسؤول" value={search} onChange={(event) => setSearch(event.target.value)} />
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 220 }}>
          <TextField select fullWidth size="small" label="حالة البلاغ" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TicketStatus)}>
            <MenuItem value="All">جميع الحالات</MenuItem>
            {Object.entries(statusLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Paper>
      </Stack>

      <Paper sx={{ height: 570, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{editingId ? "تعديل البلاغ" : "تسجيل بلاغ صيانة"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="عنوان البلاغ" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <TextField label="الأصل أو الموقع" value={draft.asset} onChange={(event) => setDraft({ ...draft, asset: event.target.value })} />
            <TextField label="التصنيف" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
            <TextField multiline minRows={3} label="وصف البلاغ" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <TextField select label="الأولوية" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TicketPriority })}>
              {Object.entries(priorityLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <TextField select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TicketStatus })}>
              {Object.entries(statusLabel).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <TextField label="المسؤول" value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveTicket()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ البلاغ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
