import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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

type EmployeeStatus = "Active" | "Leave" | "Suspended";

interface EmployeeRecord {
  id: number;
  employeeNo: string;
  name: string;
  jobTitle: string;
  department: string;
  site: string;
  gate: string;
  phone: string;
  status: EmployeeStatus;
  warnings: number;
  absences: number;
}

const initialRows: EmployeeRecord[] = [
  { id: 1, employeeNo: "EMP-1001", name: "محمد علي عبدالله هزازي", jobTitle: "مشرف بوابة", department: "التشغيل", site: "الموقع الرئيسي", gate: "مبنى 1 - بوابة 1", phone: "05XXXXXXXX", status: "Active", warnings: 0, absences: 1 },
  { id: 2, employeeNo: "EMP-1002", name: "خالد عبدالله يحيى هزازي", jobTitle: "مراقب أمن", department: "الأمن", site: "الموقع الرئيسي", gate: "مبنى 1 - بوابة 2", phone: "05XXXXXXXX", status: "Active", warnings: 1, absences: 0 },
  { id: 3, employeeNo: "EMP-1003", name: "حسين عبدالله حسين هزازي", jobTitle: "أمين مستودع", department: "المستودعات", site: "الموقع الرئيسي", gate: "المستودع 1", phone: "05XXXXXXXX", status: "Leave", warnings: 0, absences: 2 },
];

const statusLabel: Record<EmployeeStatus, string> = {
  Active: "على رأس العمل",
  Leave: "إجازة",
  Suspended: "موقوف",
};

const emptyDraft: Omit<EmployeeRecord, "id" | "warnings" | "absences"> = {
  employeeNo: "",
  name: "",
  jobTitle: "",
  department: "التشغيل",
  site: "الموقع الرئيسي",
  gate: "",
  phone: "",
  status: "Active",
};

export default function Employees() {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.employeeNo, row.name, row.jobTitle, row.department, row.site, row.gate]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const columns: GridColDef<EmployeeRecord>[] = [
    { field: "employeeNo", headerName: "الرقم الوظيفي", minWidth: 130, flex: 0.7 },
    { field: "name", headerName: "اسم الموظف", minWidth: 220, flex: 1.3 },
    { field: "jobTitle", headerName: "المسمى الوظيفي", minWidth: 150, flex: 0.9 },
    { field: "department", headerName: "الإدارة", minWidth: 120, flex: 0.7 },
    { field: "gate", headerName: "موقع التكليف", minWidth: 170, flex: 1 },
    { field: "absences", headerName: "الغيابات", type: "number", minWidth: 90 },
    { field: "warnings", headerName: "الإنذارات", type: "number", minWidth: 90 },
    {
      field: "status",
      headerName: "الحالة",
      minWidth: 130,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Active" ? "success" : value === "Leave" ? "warning" : "error"}
          label={statusLabel[value]}
        />
      ),
    },
  ];

  const addEmployee = () => {
    if (!draft.employeeNo.trim() || !draft.name.trim()) return;
    setRows((current) => [
      ...current,
      { ...draft, id: Date.now(), warnings: 0, absences: 0 },
    ]);
    setDraft(emptyDraft);
    setOpen(false);
  };

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة الموظفين</Typography>
          <Typography color="text.secondary">ملفات الموظفين والتكليفات والغيابات والإنذارات في سجل موحد.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>إضافة موظف</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField
          fullWidth
          size="small"
          label="بحث بالاسم أو الرقم الوظيفي أو الموقع"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Paper>

      <Paper sx={{ height: 580, borderRadius: 3, overflow: "hidden" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          sx={{ border: 0, direction: "rtl" }}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>إضافة موظف جديد</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="الرقم الوظيفي" value={draft.employeeNo} onChange={(e) => setDraft({ ...draft, employeeNo: e.target.value })} />
            <TextField label="اسم الموظف" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label="المسمى الوظيفي" value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} />
            <TextField label="الإدارة" value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
            <TextField label="موقع التكليف" value={draft.gate} onChange={(e) => setDraft({ ...draft, gate: e.target.value })} />
            <TextField label="رقم الجوال" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <TextField select label="الحالة" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as EmployeeStatus })}>
              <MenuItem value="Active">على رأس العمل</MenuItem>
              <MenuItem value="Leave">إجازة</MenuItem>
              <MenuItem value="Suspended">موقوف</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={addEmployee}>حفظ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
