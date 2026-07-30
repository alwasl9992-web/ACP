import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import type { Building } from "../models/Building";

interface AssetProfileProps {
  asset: Building;
  onBack: () => void;
}

type WorkOrderStatus = "Open" | "InProgress" | "Completed";
type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";

interface WorkOrder {
  id: string;
  code: string;
  assetId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
}

const statusLabel = {
  Running: "يعمل",
  Stopped: "متوقف",
  Maintenance: "تحت الصيانة",
} as const;

const criticalityLabel = {
  Critical: "حرج",
  High: "مرتفع",
  Medium: "متوسط",
  Low: "منخفض",
} as const;

const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  Open: "مفتوح",
  InProgress: "قيد التنفيذ",
  Completed: "مكتمل",
};

const workOrderPriorityLabel: Record<WorkOrderPriority, string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "مرتفعة",
  Critical: "حرجة",
};

const assetTypeLabel: Record<string, string> = {
  Building: "مبنى",
  Warehouse: "مستودع",
};

const modules = [
  {
    key: "work-orders",
    title: "أوامر العمل",
    description: "متابعة المهام والإصلاحات المرتبطة بالأصل.",
    active: true,
  },
  {
    key: "preventive-maintenance",
    title: "الصيانة الوقائية",
    description: "جدولة الصيانة الدورية والتنبيه قبل الاستحقاق.",
    active: false,
  },
  {
    key: "incidents",
    title: "البلاغات",
    description: "ربط البلاغات التشغيلية وسجل المعالجة بالأصل.",
    active: false,
  },
  {
    key: "documents",
    title: "المستندات والصور",
    description: "حفظ الضمانات والمخططات والفواتير والصور.",
    active: false,
  },
  {
    key: "timeline",
    title: "السجل الزمني",
    description: "توثيق جميع التغييرات والأحداث على الأصل.",
    active: false,
  },
  {
    key: "qr",
    title: "رمز QR",
    description: "فتح ملف الأصل ميدانيًا عبر المسح المباشر.",
    active: false,
  },
];

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600} sx={{ mt: 0.5, wordBreak: "break-word" }}>
        {value || "غير مسجل"}
      </Typography>
    </Box>
  );
}

export default function AssetProfile({ asset, onBack }: AssetProfileProps) {
  const [showWorkOrders, setShowWorkOrders] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: "wo-001",
      code: "WO-2026-001",
      assetId: asset.id,
      title: "فحص لوحة الكهرباء الرئيسية",
      description: "فحص القواطع والتوصيلات ودرجة الحرارة وتوثيق النتائج.",
      priority: "High",
      status: "InProgress",
      assignedTo: "فريق الصيانة الكهربائية",
      dueDate: "2026-08-02",
      createdAt: "2026-07-30",
    },
  ]);
  const [newWorkOrder, setNewWorkOrder] = useState({
    title: "",
    description: "",
    priority: "Medium" as WorkOrderPriority,
    assignedTo: "",
    dueDate: "",
  });

  const assetWorkOrders = useMemo(
    () => workOrders.filter((workOrder) => workOrder.assetId === asset.id),
    [asset.id, workOrders],
  );

  const statusColor =
    asset.status === "Running"
      ? "success"
      : asset.status === "Stopped"
        ? "error"
        : "warning";

  const criticalityColor =
    asset.criticality === "Critical"
      ? "error"
      : asset.criticality === "High"
        ? "warning"
        : asset.criticality === "Medium"
          ? "info"
          : "success";

  const openWorkOrders = () => {
    setShowWorkOrders(true);
    window.setTimeout(() => {
      document
        .getElementById("asset-work-orders")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const addWorkOrder = () => {
    const title = newWorkOrder.title.trim();
    if (!title) return;

    const sequence = String(workOrders.length + 1).padStart(3, "0");
    const createdWorkOrder: WorkOrder = {
      id: crypto.randomUUID(),
      code: `WO-2026-${sequence}`,
      assetId: asset.id,
      title,
      description: newWorkOrder.description.trim(),
      priority: newWorkOrder.priority,
      status: "Open",
      assignedTo: newWorkOrder.assignedTo.trim() || "غير مسند",
      dueDate: newWorkOrder.dueDate,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setWorkOrders((current) => [...current, createdWorkOrder]);
    setNewWorkOrder({
      title: "",
      description: "",
      priority: "Medium",
      assignedTo: "",
      dueDate: "",
    });
    setOpenDialog(false);
    setShowWorkOrders(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            ملف الأصل
          </Typography>
          <Typography color="text.secondary">
            {asset.code} — {asset.name}
          </Typography>
        </Box>

        <Button variant="outlined" onClick={onBack}>
          العودة إلى سجل الأصول
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        هذا الملف هو المرجع التشغيلي الموحد للأصل، ويجمع الصيانة والبلاغات
        والمستندات والسجل الزمني في مكان واحد.
      </Alert>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {asset.name}
            </Typography>
            <Typography color="text.secondary">
              {assetTypeLabel[asset.assetType] ?? asset.assetType} • {asset.location}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              color={statusColor}
              label={statusLabel[asset.status] ?? asset.status}
            />
            <Chip
              color={criticalityColor}
              label={`الأهمية: ${criticalityLabel[asset.criticality] ?? asset.criticality}`}
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="رقم الأصل" value={asset.code} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem
              label="نوع الأصل"
              value={assetTypeLabel[asset.assetType] ?? asset.assetType}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الموقع" value={asset.location} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الشركة المصنعة" value={asset.manufacturer} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الموديل" value={asset.model} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الرقم التسلسلي" value={asset.serialNumber} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="رمز QR" value={asset.qrCode} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="تاريخ التركيب" value={asset.installDate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="انتهاء الضمان" value={asset.warrantyExpiry} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DetailItem label="الوصف" value={asset.description} />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        وحدات الأصل
      </Typography>

      <Grid container spacing={2}>
        {modules.map((module) => (
          <Grid key={module.key} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: 3,
                transition: "transform .2s ease, box-shadow .2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {module.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {module.description}
              </Typography>
              <Button
                size="small"
                variant={module.active ? "contained" : "text"}
                disabled={!module.active}
                onClick={module.active ? openWorkOrders : undefined}
              >
                {module.active ? "فتح الوحدة" : "قريبًا"}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {showWorkOrders && (
        <Paper
          id="asset-work-orders"
          sx={{ mt: 4, p: { xs: 2, md: 3 }, borderRadius: 3 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                أوامر العمل
              </Typography>
              <Typography color="text.secondary">
                جميع الأوامر المرتبطة بالأصل {asset.code}
              </Typography>
            </Box>
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
              إنشاء أمر عمل
            </Button>
          </Stack>

          <TableContainer>
            <Table size="small" sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  <TableCell>رقم الأمر</TableCell>
                  <TableCell>العنوان</TableCell>
                  <TableCell>الأولوية</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>المسند إليه</TableCell>
                  <TableCell>تاريخ الاستحقاق</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assetWorkOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      لا توجد أوامر عمل مرتبطة بهذا الأصل.
                    </TableCell>
                  </TableRow>
                ) : (
                  assetWorkOrders.map((workOrder) => (
                    <TableRow key={workOrder.id} hover>
                      <TableCell>{workOrder.code}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{workOrder.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {workOrder.description || "دون وصف"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={workOrderPriorityLabel[workOrder.priority]}
                          color={
                            workOrder.priority === "Critical"
                              ? "error"
                              : workOrder.priority === "High"
                                ? "warning"
                                : workOrder.priority === "Medium"
                                  ? "info"
                                  : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={workOrderStatusLabel[workOrder.status]}
                          color={
                            workOrder.status === "Completed"
                              ? "success"
                              : workOrder.status === "InProgress"
                                ? "warning"
                                : "info"
                          }
                        />
                      </TableCell>
                      <TableCell>{workOrder.assignedTo}</TableCell>
                      <TableCell>{workOrder.dueDate || "غير محدد"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>إنشاء أمر عمل للأصل {asset.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              required
              label="عنوان أمر العمل"
              value={newWorkOrder.title}
              onChange={(event) =>
                setNewWorkOrder((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <TextField
              multiline
              minRows={3}
              label="الوصف"
              value={newWorkOrder.description}
              onChange={(event) =>
                setNewWorkOrder((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <TextField
              select
              label="الأولوية"
              value={newWorkOrder.priority}
              onChange={(event) =>
                setNewWorkOrder((current) => ({
                  ...current,
                  priority: event.target.value as WorkOrderPriority,
                }))
              }
            >
              <MenuItem value="Low">منخفضة</MenuItem>
              <MenuItem value="Medium">متوسطة</MenuItem>
              <MenuItem value="High">مرتفعة</MenuItem>
              <MenuItem value="Critical">حرجة</MenuItem>
            </TextField>
            <TextField
              label="المسند إليه"
              value={newWorkOrder.assignedTo}
              onChange={(event) =>
                setNewWorkOrder((current) => ({
                  ...current,
                  assignedTo: event.target.value,
                }))
              }
            />
            <TextField
              type="date"
              label="تاريخ الاستحقاق"
              slotProps={{ inputLabel: { shrink: true } }}
              value={newWorkOrder.dueDate}
              onChange={(event) =>
                setNewWorkOrder((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={addWorkOrder}
            disabled={!newWorkOrder.title.trim()}
          >
            حفظ أمر العمل
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
