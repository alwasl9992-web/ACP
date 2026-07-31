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

type WarehouseStatus = "Active" | "Limited" | "Closed";

interface WarehouseRecord {
  id: number;
  code: string;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  occupied: number;
  items: number;
  status: WarehouseStatus;
}

const initialRows: WarehouseRecord[] = [
  { id: 1, code: "WH-001", name: "المستودع 1", location: "الموقع الرئيسي", manager: "محمد علي", capacity: 1200, occupied: 860, items: 248, status: "Active" },
  { id: 2, code: "WH-002", name: "المستودع 2", location: "الموقع الرئيسي", manager: "خالد عبدالله", capacity: 900, occupied: 770, items: 196, status: "Limited" },
  { id: 3, code: "WH-003", name: "المستودع 3", location: "الواحة", manager: "حسين عبدالله", capacity: 650, occupied: 310, items: 114, status: "Active" },
];

const statusLabel: Record<WarehouseStatus, string> = {
  Active: "متاح",
  Limited: "قرب الامتلاء",
  Closed: "مغلق",
};

export default function Warehouses() {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<WarehouseRecord, "id" | "occupied" | "items">>({
    code: "",
    name: "",
    location: "",
    manager: "",
    capacity: 0,
    status: "Active",
  });

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.location, row.manager].join(" ").toLowerCase().includes(term),
    );
  }, [rows, search]);

  const columns: GridColDef<WarehouseRecord>[] = [
    { field: "code", headerName: "الرمز", minWidth: 110, flex: 0.6 },
    { field: "name", headerName: "المستودع", minWidth: 170, flex: 1 },
    { field: "location", headerName: "الموقع", minWidth: 150, flex: 0.9 },
    { field: "manager", headerName: "المسؤول", minWidth: 150, flex: 0.9 },
    { field: "capacity", headerName: "السعة", type: "number", minWidth: 100, flex: 0.6 },
    { field: "occupied", headerName: "المشغول", type: "number", minWidth: 100, flex: 0.6 },
    { field: "items", headerName: "عدد الأصناف", type: "number", minWidth: 115, flex: 0.7 },
    {
      field: "status",
      headerName: "الحالة",
      minWidth: 125,
      flex: 0.7,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Active" ? "success" : value === "Limited" ? "warning" : "default"}
          label={statusLabel[value as WarehouseStatus]}
        />
      ),
    },
  ];

  const addWarehouse = () => {
    if (!draft.code.trim() || !draft.name.trim() || draft.capacity <= 0) return;
    setRows((current) => [...current, { ...draft, id: Date.now(), occupied: 0, items: 0 }]);
    setOpen(false);
    setDraft({ code: "", name: "", location: "", manager: "", capacity: 0, status: "Active" });
  };

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة المستودعات</Typography>
          <Typography color="text.secondary">متابعة السعة والمخزون والمسؤولين وحالة كل مستودع.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>إضافة مستودع</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <TextField fullWidth size="small" label="بحث بالرمز أو الاسم أو المسؤول" value={search} onChange={(event) => setSearch(event.target.value)} />
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
        <DialogTitle>إضافة مستودع جديد</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="رمز المستودع" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            <TextField label="اسم المستودع" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label="الموقع" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <TextField label="المسؤول" value={draft.manager} onChange={(e) => setDraft({ ...draft, manager: e.target.value })} />
            <TextField type="number" label="السعة" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })} />
            <TextField select label="الحالة" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as WarehouseStatus })}>
              <MenuItem value="Active">متاح</MenuItem>
              <MenuItem value="Limited">قرب الامتلاء</MenuItem>
              <MenuItem value="Closed">مغلق</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={addWarehouse}>حفظ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
