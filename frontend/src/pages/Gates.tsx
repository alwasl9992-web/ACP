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

interface GateRecord {
  id: number;
  code: string;
  name: string;
  site: string;
  building: string;
  status: "Active" | "Maintenance" | "Closed";
  supervisor: string;
  trucksToday: number;
  visitorsToday: number;
}

const initialRows: GateRecord[] = [
  { id: 1, code: "GT-001", name: "الاستقبال - بوابة 1", site: "الموقع الرئيسي", building: "مبنى 1", status: "Active", supervisor: "محمد علي", trucksToday: 18, visitorsToday: 42 },
  { id: 2, code: "GT-002", name: "بوابة 2", site: "الموقع الرئيسي", building: "مبنى 1", status: "Active", supervisor: "خالد عبدالله", trucksToday: 11, visitorsToday: 24 },
  { id: 3, code: "GT-007", name: "بوابة 1", site: "الموقع الرئيسي", building: "مبنى 2", status: "Maintenance", supervisor: "حسين عبدالله", trucksToday: 6, visitorsToday: 13 },
];

const statusLabel = {
  Active: "تشغيل",
  Maintenance: "صيانة",
  Closed: "مغلقة",
} as const;

export default function Gates() {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<GateRecord, "id">>({
    code: "",
    name: "",
    site: "الموقع الرئيسي",
    building: "مبنى 1",
    status: "Active",
    supervisor: "",
    trucksToday: 0,
    visitorsToday: 0,
  });

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.site, row.building, row.supervisor]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const columns: GridColDef<GateRecord>[] = [
    { field: "code", headerName: "رمز البوابة", minWidth: 120, flex: 0.7 },
    { field: "name", headerName: "اسم البوابة", minWidth: 190, flex: 1.2 },
    { field: "building", headerName: "الموقع", minWidth: 130, flex: 0.8 },
    { field: "supervisor", headerName: "المشرف", minWidth: 150, flex: 0.9 },
    { field: "trucksToday", headerName: "الشاحنات اليوم", type: "number", minWidth: 130, flex: 0.7 },
    { field: "visitorsToday", headerName: "الزوار اليوم", type: "number", minWidth: 120, flex: 0.7 },
    {
      field: "status",
      headerName: "الحالة",
      minWidth: 110,
      flex: 0.6,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Active" ? "success" : value === "Maintenance" ? "warning" : "default"}
          label={statusLabel[value]}
        />
      ),
    },
  ];

  const addGate = () => {
    if (!draft.code.trim() || !draft.name.trim()) return;
    setRows((current) => [...current, { ...draft, id: Date.now() }]);
    setOpen(false);
    setDraft({
      code: "",
      name: "",
      site: "الموقع الرئيسي",
      building: "مبنى 1",
      status: "Active",
      supervisor: "",
      trucksToday: 0,
      visitorsToday: 0,
    });
  };

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة البوابات</Typography>
          <Typography color="text.secondary">متابعة التشغيل والحركة اليومية والمشرفين لكل بوابة.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>إضافة بوابة</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField
          fullWidth
          size="small"
          label="بحث بالرمز أو الاسم أو المشرف"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }}>
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
        <DialogTitle>إضافة بوابة جديدة</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="رمز البوابة" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            <TextField label="اسم البوابة" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label="المبنى" value={draft.building} onChange={(e) => setDraft({ ...draft, building: e.target.value })} />
            <TextField label="المشرف" value={draft.supervisor} onChange={(e) => setDraft({ ...draft, supervisor: e.target.value })} />
            <TextField select label="الحالة" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as GateRecord["status"] })}>
              <MenuItem value="Active">تشغيل</MenuItem>
              <MenuItem value="Maintenance">صيانة</MenuItem>
              <MenuItem value="Closed">مغلقة</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={addGate}>حفظ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
