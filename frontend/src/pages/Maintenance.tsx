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

type TicketStatus = "New" | "Assigned" | "InProgress" | "Resolved";
type TicketPriority = "Low" | "Medium" | "High" | "Critical";

interface MaintenanceTicket {
  id: number;
  code: string;
  title: string;
  site: string;
  asset: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string;
  createdAt: string;
}

const initialRows: MaintenanceTicket[] = [
  {
    id: 1,
    code: "MT-26001",
    title: "تسرب مياه في دورة المياه",
    site: "الموقع الرئيسي",
    asset: "مبنى 1",
    category: "سباكة",
    priority: "High",
    status: "InProgress",
    assignee: "فريق الصيانة المدنية",
    createdAt: "2026-07-31",
  },
  {
    id: 2,
    code: "MT-26002",
    title: "تعطل قارئ الدخول",
    site: "الموقع الرئيسي",
    asset: "بوابة 2",
    category: "أنظمة أمنية",
    priority: "Critical",
    status: "Assigned",
    assignee: "فريق الأنظمة",
    createdAt: "2026-07-31",
  },
  {
    id: 3,
    code: "MT-26003",
    title: "فحص تكييف المستودع",
    site: "المستودعات",
    asset: "مستودع 1",
    category: "تكييف",
    priority: "Medium",
    status: "New",
    assignee: "غير مسند",
    createdAt: "2026-07-30",
  },
];

const statusLabel: Record<TicketStatus, string> = {
  New: "جديد",
  Assigned: "مسند",
  InProgress: "قيد التنفيذ",
  Resolved: "مغلق",
};

const priorityLabel: Record<TicketPriority, string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "عالية",
  Critical: "حرجة",
};

export default function Maintenance() {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<MaintenanceTicket, "id" | "code" | "createdAt">>({
    title: "",
    site: "الموقع الرئيسي",
    asset: "",
    category: "",
    priority: "Medium",
    status: "New",
    assignee: "غير مسند",
  });

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || [row.code, row.title, row.site, row.asset, row.category, row.assignee]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const columns: GridColDef<MaintenanceTicket>[] = [
    { field: "code", headerName: "رقم البلاغ", minWidth: 120, flex: 0.65 },
    { field: "title", headerName: "البلاغ", minWidth: 220, flex: 1.3 },
    { field: "asset", headerName: "الأصل / الموقع", minWidth: 150, flex: 0.8 },
    { field: "category", headerName: "التصنيف", minWidth: 120, flex: 0.7 },
    {
      field: "priority",
      headerName: "الأولوية",
      minWidth: 110,
      flex: 0.6,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Critical" ? "error" : value === "High" ? "warning" : value === "Medium" ? "info" : "default"}
          label={priorityLabel[value as TicketPriority]}
        />
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      minWidth: 120,
      flex: 0.7,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          color={value === "Resolved" ? "success" : value === "InProgress" ? "warning" : value === "Assigned" ? "info" : "default"}
          label={statusLabel[value as TicketStatus]}
        />
      ),
    },
    { field: "assignee", headerName: "المسؤول", minWidth: 170, flex: 0.9 },
    { field: "createdAt", headerName: "تاريخ البلاغ", minWidth: 125, flex: 0.7 },
  ];

  const addTicket = () => {
    if (!draft.title.trim() || !draft.asset.trim() || !draft.category.trim()) return;
    const nextNumber = rows.length + 1;
    setRows((current) => [
      ...current,
      {
        ...draft,
        id: Date.now(),
        code: `MT-26${String(nextNumber).padStart(3, "0")}`,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setOpen(false);
    setDraft({
      title: "",
      site: "الموقع الرئيسي",
      asset: "",
      category: "",
      priority: "Medium",
      status: "New",
      assignee: "غير مسند",
    });
  };

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>إدارة البلاغات</Typography>
          <Typography color="text.secondary">تسجيل البلاغات وإسنادها ومتابعة الأولوية وحالة التنفيذ.</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>بلاغ جديد</Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 3, flex: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="بحث برقم البلاغ أو الأصل أو المسؤول"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 220 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="حالة البلاغ"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | TicketStatus)}
          >
            <MenuItem value="All">جميع الحالات</MenuItem>
            <MenuItem value="New">جديد</MenuItem>
            <MenuItem value="Assigned">مسند</MenuItem>
            <MenuItem value="InProgress">قيد التنفيذ</MenuItem>
            <MenuItem value="Resolved">مغلق</MenuItem>
          </TextField>
        </Paper>
      </Stack>

      <Paper sx={{ height: 570, borderRadius: 3, overflow: "hidden" }}>
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
        <DialogTitle>تسجيل بلاغ صيانة</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="عنوان البلاغ" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <TextField label="الموقع" value={draft.site} onChange={(event) => setDraft({ ...draft, site: event.target.value })} />
            <TextField label="الأصل أو المبنى" value={draft.asset} onChange={(event) => setDraft({ ...draft, asset: event.target.value })} />
            <TextField label="التصنيف" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
            <TextField select label="الأولوية" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TicketPriority })}>
              <MenuItem value="Low">منخفضة</MenuItem>
              <MenuItem value="Medium">متوسطة</MenuItem>
              <MenuItem value="High">عالية</MenuItem>
              <MenuItem value="Critical">حرجة</MenuItem>
            </TextField>
            <TextField label="المسؤول" value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={addTicket}>حفظ البلاغ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
