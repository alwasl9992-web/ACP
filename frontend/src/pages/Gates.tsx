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
import type { PlatformBuilding, PlatformGate } from "../types/platform";

type GateStatus = "Active" | "Maintenance" | "Closed";

interface GateRecord {
  id: string;
  logId?: string;
  code: string;
  name: string;
  buildingId: string | null;
  building: string;
  status: GateStatus;
  supervisor: string;
  trucksToday: number;
  visitorsToday: number;
  contractorsToday: number;
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

const demoRows: GateRecord[] = [
  { id: "demo-1", code: "GT-001", name: "الاستقبال - بوابة 1", buildingId: null, building: "مبنى 1", status: "Active", supervisor: "محمد علي", trucksToday: 18, visitorsToday: 42, contractorsToday: 7 },
  { id: "demo-2", code: "GT-002", name: "بوابة 2", buildingId: null, building: "مبنى 1", status: "Active", supervisor: "خالد عبدالله", trucksToday: 11, visitorsToday: 24, contractorsToday: 4 },
  { id: "demo-3", code: "GT-007", name: "بوابة 1", buildingId: null, building: "مبنى 2", status: "Maintenance", supervisor: "حسين عبدالله", trucksToday: 6, visitorsToday: 13, contractorsToday: 2 },
];

const statusLabel: Record<GateStatus, string> = {
  Active: "تشغيل",
  Maintenance: "صيانة",
  Closed: "مغلقة",
};

const emptyDraft: Omit<GateRecord, "id" | "logId"> = {
  code: "",
  name: "",
  buildingId: null,
  building: "",
  status: "Active",
  supervisor: "",
  trucksToday: 0,
  visitorsToday: 0,
  contractorsToday: 0,
};

function databaseStatus(status: GateStatus): PlatformGate["status"] {
  return status === "Active" ? "active" : status === "Maintenance" ? "inactive" : "archived";
}

function uiStatus(status: PlatformGate["status"]): GateStatus {
  return status === "active" ? "Active" : status === "inactive" ? "Maintenance" : "Closed";
}

export default function Gates() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [rows, setRows] = useState<GateRecord[]>([]);
  const [buildings, setBuildings] = useState<PlatformBuilding[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = demoMode || can(profile?.role, "project.manage");

  const loadGates = useCallback(async () => {
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

      const today = new Date().toISOString().slice(0, 10);
      const [gateRows, logRows, buildingRows] = await Promise.all([
        listRecords<PlatformGate>("gates", {
          order: "code.asc",
          filters: { project_id: `eq.${selectedProject.id}` },
        }),
        listRecords<GateDailyLog>("gate_daily_logs", {
          filters: {
            project_id: `eq.${selectedProject.id}`,
            log_date: `eq.${today}`,
          },
        }),
        listRecords<PlatformBuilding>("buildings", {
          order: "code.asc",
          filters: { project_id: `eq.${selectedProject.id}` },
        }),
      ]);

      setBuildings(buildingRows);
      const buildingMap = new Map(buildingRows.map((item) => [item.id, item.name]));
      const logMap = new Map(logRows.map((item) => [item.gate_id, item]));
      setRows(
        gateRows.map((gate) => {
          const log = logMap.get(gate.id);
          return {
            id: gate.id,
            logId: log?.id,
            code: gate.code,
            name: gate.name,
            buildingId: gate.building_id,
            building: gate.building_id ? buildingMap.get(gate.building_id) ?? "-" : "-",
            status: uiStatus(gate.status),
            supervisor: "-",
            trucksToday: log?.trucks_count ?? 0,
            visitorsToday: log?.visitors_count ?? 0,
            contractorsToday: log?.contractors_count ?? 0,
          };
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل البوابات.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadGates();
  }, [loadGates]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.building, row.supervisor]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const columns = useMemo<GridColDef<GateRecord>[]>(
    () => [
      { field: "code", headerName: "رمز البوابة", minWidth: 120, flex: 0.7 },
      { field: "name", headerName: "اسم البوابة", minWidth: 190, flex: 1.2 },
      { field: "building", headerName: "المبنى", minWidth: 130, flex: 0.8 },
      { field: "trucksToday", headerName: "الشاحنات", type: "number", minWidth: 100 },
      { field: "visitorsToday", headerName: "الزوار", type: "number", minWidth: 90 },
      { field: "contractorsToday", headerName: "المقاولون", type: "number", minWidth: 100 },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 110,
        renderCell: ({ value }) => (
          <Chip
            size="small"
            color={value === "Active" ? "success" : value === "Maintenance" ? "warning" : "default"}
            label={statusLabel[value as GateStatus]}
          />
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        minWidth: 160,
        sortable: false,
        renderCell: ({ row }) =>
          canManage ? (
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => startEdit(row)}>تعديل</Button>
              <Button size="small" color="error" onClick={() => void removeGate(row)}>حذف</Button>
            </Stack>
          ) : null,
      },
    ],
    [canManage],
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      code: `GT-${String(rows.length + 1).padStart(3, "0")}`,
    });
    setOpen(true);
  };

  const startEdit = (row: GateRecord) => {
    setEditingId(row.id);
    setDraft({
      code: row.code,
      name: row.name,
      buildingId: row.buildingId,
      building: row.building,
      status: row.status,
      supervisor: row.supervisor === "-" ? "" : row.supervisor,
      trucksToday: row.trucksToday,
      visitorsToday: row.visitorsToday,
      contractorsToday: row.contractorsToday,
    });
    setOpen(true);
  };

  const resetDialog = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(false);
  };

  const saveGate = async () => {
    if (!selectedProject || !draft.code.trim() || !draft.name.trim()) {
      setError("رمز البوابة واسمها مطلوبان.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (demoMode) {
        const next: GateRecord = {
          ...draft,
          id: editingId ?? crypto.randomUUID(),
          building:
            buildings.find((item) => item.id === draft.buildingId)?.name || draft.building || "-",
        };
        setRows((current) =>
          editingId
            ? current.map((item) => (item.id === editingId ? next : item))
            : [...current, next],
        );
      } else {
        const timestamp = new Date().toISOString();
        let gateId = editingId;
        if (editingId) {
          await updateRecord<PlatformGate>("gates", editingId, {
            code: draft.code.trim(),
            name: draft.name.trim(),
            building_id: draft.buildingId,
            status: databaseStatus(draft.status),
            updated_at: timestamp,
          });
        } else {
          const created = await createRecord<PlatformGate>("gates", {
            project_id: selectedProject.id,
            building_id: draft.buildingId,
            code: draft.code.trim(),
            name: draft.name.trim(),
            status: databaseStatus(draft.status),
            created_at: timestamp,
            updated_at: timestamp,
          });
          gateId = created.id;
        }

        if (gateId) {
          const existing = rows.find((item) => item.id === editingId);
          const logPayload = {
            project_id: selectedProject.id,
            gate_id: gateId,
            log_date: new Date().toISOString().slice(0, 10),
            trucks_count: Number(draft.trucksToday) || 0,
            visitors_count: Number(draft.visitorsToday) || 0,
            contractors_count: Number(draft.contractorsToday) || 0,
            event_summary: null,
            action_taken: null,
            created_by: profile?.id ?? null,
            created_at: timestamp,
            updated_at: timestamp,
          };
          if (existing?.logId) {
            await updateRecord<GateDailyLog>("gate_daily_logs", existing.logId, logPayload);
          } else {
            await createRecord<GateDailyLog>("gate_daily_logs", logPayload);
          }
        }
      }

      resetDialog();
      if (!demoMode) await loadGates();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ البوابة.");
    } finally {
      setSaving(false);
    }
  };

  const removeGate = async (row: GateRecord) => {
    if (!window.confirm(`حذف البوابة: ${row.name}؟`)) return;
    try {
      if (demoMode) setRows((current) => current.filter((item) => item.id !== row.id));
      else await deleteRecord("gates", row.id);
      if (!demoMode) await loadGates();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف البوابة.");
    }
  };

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لعرض البوابات.</Alert>;
  }

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة البوابات</Typography>
          <Typography color="text.secondary">الحركة اليومية للبوابات ضمن {selectedProject.name}.</Typography>
        </Box>
        {canManage && <Button variant="contained" onClick={startCreate}>إضافة بوابة</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField fullWidth size="small" label="بحث بالرمز أو الاسم أو المبنى" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>

      <Dialog open={open} onClose={resetDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{editingId ? "تعديل البوابة" : "إضافة بوابة"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="رمز البوابة" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
            <TextField label="اسم البوابة" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            {!demoMode && (
              <TextField select label="المبنى" value={draft.buildingId ?? ""} onChange={(event) => setDraft({ ...draft, buildingId: event.target.value || null })}>
                <MenuItem value="">بدون مبنى</MenuItem>
                {buildings.map((building) => <MenuItem key={building.id} value={building.id}>{building.name}</MenuItem>)}
              </TextField>
            )}
            <TextField select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as GateStatus })}>
              <MenuItem value="Active">تشغيل</MenuItem>
              <MenuItem value="Maintenance">صيانة</MenuItem>
              <MenuItem value="Closed">مغلقة</MenuItem>
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth type="number" label="الشاحنات اليوم" value={draft.trucksToday} onChange={(event) => setDraft({ ...draft, trucksToday: Number(event.target.value) })} />
              <TextField fullWidth type="number" label="الزوار اليوم" value={draft.visitorsToday} onChange={(event) => setDraft({ ...draft, visitorsToday: Number(event.target.value) })} />
              <TextField fullWidth type="number" label="المقاولون اليوم" value={draft.contractorsToday} onChange={(event) => setDraft({ ...draft, contractorsToday: Number(event.target.value) })} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveGate()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
