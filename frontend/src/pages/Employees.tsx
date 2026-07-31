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
import type { PlatformEmployee } from "../types/platform";

type EmployeeStatus = "Active" | "Leave" | "Suspended";

interface EmployeeRecord {
  id: string;
  assignmentId?: string;
  employeeNo: string;
  name: string;
  jobTitle: string;
  department: string;
  assignment: string;
  phone: string;
  status: EmployeeStatus;
  warnings: number;
  absences: number;
}

interface EmployeeAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  building_id: string | null;
  gate_id: string | null;
  department: string | null;
  assignment_title: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AttendanceEvent {
  id: string;
  employee_id: string;
  event_type: "present" | "absent" | "late" | "leave";
}

interface EmployeeWarning {
  id: string;
  employee_id: string;
}

const demoRows: EmployeeRecord[] = [
  { id: "demo-1", employeeNo: "EMP-1001", name: "محمد علي عبدالله هزازي", jobTitle: "مشرف بوابة", department: "التشغيل", assignment: "مبنى 1 - بوابة 1", phone: "05XXXXXXXX", status: "Active", warnings: 0, absences: 1 },
  { id: "demo-2", employeeNo: "EMP-1002", name: "خالد عبدالله يحيى هزازي", jobTitle: "مراقب أمن", department: "الأمن", assignment: "مبنى 1 - بوابة 2", phone: "05XXXXXXXX", status: "Active", warnings: 1, absences: 0 },
  { id: "demo-3", employeeNo: "EMP-1003", name: "حسين عبدالله حسين هزازي", jobTitle: "أمين مستودع", department: "المستودعات", assignment: "المستودع 1", phone: "05XXXXXXXX", status: "Leave", warnings: 0, absences: 2 },
];

const statusLabel: Record<EmployeeStatus, string> = {
  Active: "على رأس العمل",
  Leave: "إجازة",
  Suspended: "موقوف",
};

const emptyDraft: Omit<EmployeeRecord, "id" | "assignmentId" | "warnings" | "absences"> = {
  employeeNo: "",
  name: "",
  jobTitle: "",
  department: "التشغيل",
  assignment: "",
  phone: "",
  status: "Active",
};

function uiStatus(status: PlatformEmployee["status"]): EmployeeStatus {
  return status === "active" ? "Active" : status === "inactive" ? "Leave" : "Suspended";
}

function databaseStatus(status: EmployeeStatus): PlatformEmployee["status"] {
  return status === "Active" ? "active" : status === "Leave" ? "inactive" : "archived";
}

export default function Employees() {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [rows, setRows] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = demoMode || can(profile?.role, "project.manage");

  const loadEmployees = useCallback(async () => {
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

      const [employees, assignments, attendance, warnings] = await Promise.all([
        listRecords<PlatformEmployee>("employees", {
          order: "employee_no.asc",
          filters: { project_id: `eq.${selectedProject.id}` },
        }),
        listRecords<EmployeeAssignment>("employee_assignments", {
          filters: {
            project_id: `eq.${selectedProject.id}`,
            is_active: "eq.true",
          },
        }),
        listRecords<AttendanceEvent>("attendance_events", {
          filters: {
            project_id: `eq.${selectedProject.id}`,
            event_type: "eq.absent",
          },
        }),
        listRecords<EmployeeWarning>("employee_warnings", {
          filters: { project_id: `eq.${selectedProject.id}` },
        }),
      ]);

      const assignmentMap = new Map(assignments.map((item) => [item.employee_id, item]));
      const absenceCount = new Map<string, number>();
      attendance.forEach((item) => absenceCount.set(item.employee_id, (absenceCount.get(item.employee_id) ?? 0) + 1));
      const warningCount = new Map<string, number>();
      warnings.forEach((item) => warningCount.set(item.employee_id, (warningCount.get(item.employee_id) ?? 0) + 1));

      setRows(
        employees.map((employee) => {
          const assignment = assignmentMap.get(employee.id);
          return {
            id: employee.id,
            assignmentId: assignment?.id,
            employeeNo: employee.employee_no,
            name: employee.full_name,
            jobTitle: employee.job_title ?? "",
            department: assignment?.department ?? "",
            assignment: assignment?.assignment_title ?? "",
            phone: employee.phone ?? "",
            status: uiStatus(employee.status),
            warnings: warningCount.get(employee.id) ?? 0,
            absences: absenceCount.get(employee.id) ?? 0,
          };
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل الموظفين.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.employeeNo, row.name, row.jobTitle, row.department, row.assignment]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const columns = useMemo<GridColDef<EmployeeRecord>[]>(
    () => [
      { field: "employeeNo", headerName: "الرقم الوظيفي", minWidth: 130, flex: 0.7 },
      { field: "name", headerName: "اسم الموظف", minWidth: 220, flex: 1.3 },
      { field: "jobTitle", headerName: "المسمى الوظيفي", minWidth: 150, flex: 0.9 },
      { field: "department", headerName: "الإدارة", minWidth: 120, flex: 0.7 },
      { field: "assignment", headerName: "موقع التكليف", minWidth: 170, flex: 1 },
      { field: "absences", headerName: "الغيابات", type: "number", minWidth: 90 },
      { field: "warnings", headerName: "الإنذارات", type: "number", minWidth: 90 },
      {
        field: "status",
        headerName: "الحالة",
        minWidth: 130,
        renderCell: ({ value }) => (
          <Chip size="small" color={value === "Active" ? "success" : value === "Leave" ? "warning" : "error"} label={statusLabel[value as EmployeeStatus]} />
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
              <Button size="small" color="error" onClick={() => void removeEmployee(row)}>حذف</Button>
            </Stack>
          ) : null,
      },
    ],
    [canManage],
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, employeeNo: `EMP-${String(rows.length + 1001)}` });
    setOpen(true);
  };

  const startEdit = (row: EmployeeRecord) => {
    setEditingId(row.id);
    setDraft({
      employeeNo: row.employeeNo,
      name: row.name,
      jobTitle: row.jobTitle,
      department: row.department,
      assignment: row.assignment,
      phone: row.phone,
      status: row.status,
    });
    setOpen(true);
  };

  const resetDialog = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(false);
  };

  const saveEmployee = async () => {
    if (!selectedProject || !draft.employeeNo.trim() || !draft.name.trim()) {
      setError("الرقم الوظيفي واسم الموظف مطلوبان.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (demoMode) {
        const existing = rows.find((item) => item.id === editingId);
        const next: EmployeeRecord = {
          ...draft,
          id: editingId ?? crypto.randomUUID(),
          warnings: existing?.warnings ?? 0,
          absences: existing?.absences ?? 0,
        };
        setRows((current) => editingId ? current.map((item) => item.id === editingId ? next : item) : [...current, next]);
      } else {
        const timestamp = new Date().toISOString();
        let employeeId = editingId;
        if (editingId) {
          await updateRecord<PlatformEmployee>("employees", editingId, {
            employee_no: draft.employeeNo.trim(),
            full_name: draft.name.trim(),
            job_title: draft.jobTitle.trim() || null,
            phone: draft.phone.trim() || null,
            status: databaseStatus(draft.status),
            updated_at: timestamp,
          });
        } else {
          const created = await createRecord<PlatformEmployee>("employees", {
            project_id: selectedProject.id,
            user_id: null,
            employee_no: draft.employeeNo.trim(),
            full_name: draft.name.trim(),
            job_title: draft.jobTitle.trim() || null,
            phone: draft.phone.trim() || null,
            status: databaseStatus(draft.status),
            hired_at: null,
            created_at: timestamp,
            updated_at: timestamp,
          });
          employeeId = created.id;
        }

        if (employeeId) {
          const existing = rows.find((item) => item.id === editingId);
          const assignmentPayload = {
            project_id: selectedProject.id,
            employee_id: employeeId,
            building_id: null,
            gate_id: null,
            department: draft.department.trim() || null,
            assignment_title: draft.assignment.trim() || null,
            starts_at: new Date().toISOString().slice(0, 10),
            ends_at: null,
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
          };
          if (existing?.assignmentId) {
            await updateRecord<EmployeeAssignment>("employee_assignments", existing.assignmentId, assignmentPayload);
          } else {
            await createRecord<EmployeeAssignment>("employee_assignments", assignmentPayload);
          }
        }
      }

      resetDialog();
      if (!demoMode) await loadEmployees();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ الموظف.");
    } finally {
      setSaving(false);
    }
  };

  const removeEmployee = async (row: EmployeeRecord) => {
    if (!window.confirm(`حذف الموظف: ${row.name}؟`)) return;
    try {
      if (demoMode) setRows((current) => current.filter((item) => item.id !== row.id));
      else await deleteRecord("employees", row.id);
      if (!demoMode) await loadEmployees();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف الموظف.");
    }
  };

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لعرض الموظفين.</Alert>;
  }

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة الموظفين</Typography>
          <Typography color="text.secondary">الملفات والتكليفات والغيابات والإنذارات ضمن {selectedProject.name}.</Typography>
        </Box>
        {canManage && <Button variant="contained" onClick={startCreate}>إضافة موظف</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField fullWidth size="small" label="بحث بالاسم أو الرقم الوظيفي أو الموقع" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Paper>

      <Paper sx={{ height: 580, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid rows={filteredRows} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} sx={{ border: 0, direction: "rtl" }} />
        )}
      </Paper>

      <Dialog open={open} onClose={resetDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{editingId ? "تعديل الموظف" : "إضافة موظف"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="الرقم الوظيفي" value={draft.employeeNo} onChange={(event) => setDraft({ ...draft, employeeNo: event.target.value })} />
            <TextField label="اسم الموظف" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <TextField label="المسمى الوظيفي" value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} />
            <TextField label="الإدارة" value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} />
            <TextField label="موقع التكليف" value={draft.assignment} onChange={(event) => setDraft({ ...draft, assignment: event.target.value })} />
            <TextField label="رقم الجوال" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            <TextField select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as EmployeeStatus })}>
              <MenuItem value="Active">على رأس العمل</MenuItem>
              <MenuItem value="Leave">إجازة</MenuItem>
              <MenuItem value="Suspended">موقوف</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveEmployee()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
