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
import type {
  PlatformEmployee,
  PlatformWarehouse,
  PlatformWarehouseItem,
} from "../types/platform";

type WarehouseStatus = "Active" | "Limited" | "Closed";

interface CloudWarehouse extends PlatformWarehouse {
  manager_id: string | null;
  capacity: number;
}

interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  managerId: string | null;
  manager: string;
  capacity: number;
  occupied: number;
  items: number;
  status: WarehouseStatus;
}

interface WarehouseDraft {
  code: string;
  name: string;
  location: string;
  managerId: string;
  capacity: number;
  status: "Active" | "Closed";
}

const demoRows: WarehouseRecord[] = [
  { id: "demo-1", code: "WH-001", name: "المستودع 1", location: "الموقع الرئيسي", managerId: null, manager: "محمد علي", capacity: 1200, occupied: 860, items: 248, status: "Active" },
  { id: "demo-2", code: "WH-002", name: "المستودع 2", location: "الموقع الرئيسي", managerId: null, manager: "خالد عبدالله", capacity: 900, occupied: 770, items: 196, status: "Limited" },
];

const statusLabel: Record<WarehouseStatus, string> = {
  Active: "متاح",
  Limited: "قرب الامتلاء",
  Closed: "مغلق",
};

const emptyDraft: WarehouseDraft = {
  code: "",
  name: "",
  location: "",
  managerId: "",
  capacity: 0,
  status: "Active",
};

function uiStatus(status: PlatformWarehouse["status"], capacity: number, occupied: number): WarehouseStatus {
  if (status === "archived") return "Closed";
  if (capacity > 0 && occupied / capacity >= 0.8) return "Limited";
  return "Active";
}

function databaseStatus(status: WarehouseDraft["status"]): PlatformWarehouse["status"] {
  return status === "Closed" ? "archived" : "active";
}

export default function Warehouses() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [rows, setRows] = useState<WarehouseRecord[]>([]);
  const [employees, setEmployees] = useState<PlatformEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WarehouseDraft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = demoMode || can(profile?.role, "project.manage");

  const loadWarehouses = useCallback(async () => {
    if (!selectedProject) {
      setRows([]);
      setEmployees([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setRows(demoRows);
        setEmployees([]);
        return;
      }

      const filters = { project_id: `eq.${selectedProject.id}` };
      const [warehouses, employeeRows] = await Promise.all([
        listRecords<CloudWarehouse>("warehouses", { order: "code.asc", filters }),
        listRecords<PlatformEmployee>("employees", { order: "full_name.asc", filters }),
      ]);
      setEmployees(employeeRows);

      const items = await listRecords<PlatformWarehouseItem>("warehouse_items", {
        order: "name.asc",
        filters: {
          warehouse_id: warehouses.length
            ? `in.(${warehouses.map((warehouse) => warehouse.id).join(",")})`
            : "eq.00000000-0000-0000-0000-000000000000",
        },
      });

      const employeeMap = new Map(employeeRows.map((employee) => [employee.id, employee.full_name]));
      const summaries = new Map<string, { occupied: number; items: number }>();
      items.forEach((item) => {
        const current = summaries.get(item.warehouse_id) ?? { occupied: 0, items: 0 };
        current.occupied += Number(item.quantity) || 0;
        current.items += 1;
        summaries.set(item.warehouse_id, current);
      });

      setRows(
        warehouses.map((warehouse) => {
          const summary = summaries.get(warehouse.id) ?? { occupied: 0, items: 0 };
          const capacity = Number(warehouse.capacity) || 0;
          return {
            id: warehouse.id,
            code: warehouse.code,
            name: warehouse.name,
            location: warehouse.location ?? "",
            managerId: warehouse.manager_id,
            manager: warehouse.manager_id ? employeeMap.get(warehouse.manager_id) ?? "موظف غير متاح" : "غير مسند",
            capacity,
            occupied: summary.occupied,
            items: summary.items,
            status: uiStatus(warehouse.status, capacity, summary.occupied),
          };
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل المستودعات.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.location, row.manager].join(" ").toLowerCase().includes(term),
    );
  }, [rows, search]);

  const columns = useMemo<GridColDef<WarehouseRecord>[]>(
    () => [
      { field: "code", headerName: "الرمز", minWidth: 110, flex: 0.6 },
      { field: "name", headerName: "المستودع", minWidth: 170, flex: 1 },
      { field: "location", headerName: "الموقع", minWidth: 150, flex: 0.9 },
      { field: "manager", headerName: "المسؤول", minWidth: 170, flex: 0.9 },
      { field: "capacity", headerName: "السعة", type: "number", minWidth: 100 },
      { field: "occupied", headerName: "الرصيد", type: "number", minWidth: 100 },
      { field: "items", headerName: "الأصناف", type: "number", minWidth: 100 },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 125,
        renderCell: ({ value }) => (
          <Chip size="small" color={value === "Active" ? "success" : value === "Limited" ? "warning" : "default"} label={statusLabel[value as WarehouseStatus]} />
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        minWidth: 160,
        sortable: false,
        renderCell: ({ row }) => canManage ? (
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => startEdit(row)}>تعديل</Button>
            <Button size="small" color="error" onClick={() => void removeWarehouse(row)}>حذف</Button>
          </Stack>
        ) : null,
      },
    ],
    [canManage],
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, code: `WH-${String(rows.length + 1).padStart(3, "0")}` });
    setOpen(true);
  };

  const startEdit = (row: WarehouseRecord) => {
    setEditingId(row.id);
    setDraft({
      code: row.code,
      name: row.name,
      location: row.location,
      managerId: row.managerId ?? "",
      capacity: row.capacity,
      status: row.status === "Closed" ? "Closed" : "Active",
    });
    setOpen(true);
  };

  const resetDialog = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(false);
  };

  const saveWarehouse = async () => {
    if (!selectedProject || !draft.code.trim() || !draft.name.trim() || draft.capacity < 0) {
      setError("رمز المستودع واسمه وسعة غير سالبة مطلوبة.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (demoMode) {
        const existing = rows.find((row) => row.id === editingId);
        const next: WarehouseRecord = {
          id: editingId ?? crypto.randomUUID(),
          code: draft.code.trim(),
          name: draft.name.trim(),
          location: draft.location.trim(),
          managerId: null,
          manager: "مستخدم تجريبي",
          capacity: Number(draft.capacity) || 0,
          occupied: existing?.occupied ?? 0,
          items: existing?.items ?? 0,
          status: draft.status,
        };
        setRows((current) => editingId ? current.map((row) => row.id === editingId ? next : row) : [...current, next]);
      } else {
        const timestamp = new Date().toISOString();
        const payload = {
          code: draft.code.trim(),
          name: draft.name.trim(),
          location: draft.location.trim() || null,
          manager_id: draft.managerId || null,
          capacity: Number(draft.capacity) || 0,
          status: databaseStatus(draft.status),
          updated_at: timestamp,
        };
        if (editingId) {
          await updateRecord<CloudWarehouse>("warehouses", editingId, payload);
        } else {
          await createRecord<CloudWarehouse>("warehouses", {
            project_id: selectedProject.id,
            ...payload,
            created_at: timestamp,
          });
        }
      }

      resetDialog();
      if (!demoMode) await loadWarehouses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ المستودع.");
    } finally {
      setSaving(false);
    }
  };

  const removeWarehouse = async (row: WarehouseRecord) => {
    if (!window.confirm(`حذف المستودع: ${row.name}؟`)) return;
    try {
      if (demoMode) setRows((current) => current.filter((item) => item.id !== row.id));
      else await deleteRecord("warehouses", row.id);
      if (!demoMode) await loadWarehouses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف المستودع.");
    }
  };

  if (!selectedProject) return <Alert severity="info">اختر مشروعًا أولًا لعرض المستودعات.</Alert>;

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">إدارة المستودعات</Typography>
          <Typography color="text.secondary">السعة والمخزون والمسؤولون الفعليون ضمن {selectedProject.name}.</Typography>
        </Box>
        {canManage && <Button variant="contained" onClick={startCreate}>إضافة مستودع</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField fullWidth label="بحث بالرمز أو الاسم أو المسؤول" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Paper>
      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
        {loading ? <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
          <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>

      <Dialog open={open} onClose={resetDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{editingId ? "تعديل المستودع" : "إضافة مستودع"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="رمز المستودع" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
            <TextField label="اسم المستودع" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <TextField label="الموقع" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
            <TextField select label="المسؤول" value={draft.managerId} onChange={(event) => setDraft({ ...draft, managerId: event.target.value })}>
              <MenuItem value="">غير مسند</MenuItem>
              {employees.filter((employee) => employee.status === "active").map((employee) => <MenuItem key={employee.id} value={employee.id}>{employee.full_name} — {employee.employee_no}</MenuItem>)}
            </TextField>
            <TextField type="number" label="السعة" inputProps={{ min: 0 }} value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })} />
            <TextField select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as WarehouseDraft["status"] })}>
              <MenuItem value="Active">متاح</MenuItem>
              <MenuItem value="Closed">مغلق</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveWarehouse()} disabled={saving}>{saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
