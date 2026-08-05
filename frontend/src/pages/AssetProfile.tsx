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
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/authService";
import type { Building } from "../models/Building";
import { buildQrImageUrl } from "../reports/exporters";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";

interface AssetProfileProps {
  asset: Building;
  onBack: () => void;
}

type WorkOrderStatus = "Open" | "InProgress" | "Completed" | "Cancelled";
type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";

interface WorkOrder {
  id: string;
  project_id: string;
  asset_id: string;
  code: string;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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
  Cancelled: "ملغي",
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
  مبنى: "مبنى",
};

function DetailItem({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      <Typography fontWeight={700} sx={{ mt: 0.5, wordBreak: "break-word" }}>
        {value || "غير مسجل"}
      </Typography>
    </Box>
  );
}

function nextWorkOrderCode(count: number): string {
  const year = new Date().getFullYear();
  return `WO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export default function AssetProfile({ asset, onBack }: AssetProfileProps) {
  const { profile, demoMode } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newWorkOrder, setNewWorkOrder] = useState({
    title: "",
    description: "",
    priority: "Medium" as WorkOrderPriority,
    assignedTo: "",
    dueDate: "",
  });

  const canCreate = demoMode || can(profile?.role, "record.create");
  const canUpdate = demoMode || can(profile?.role, "record.update");
  const canDelete = demoMode || can(profile?.role, "record.delete");

  const qrPayload = asset.qrCode || `ACP-ASSET:${asset.id}`;
  const qrImageUrl = buildQrImageUrl(qrPayload);

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const timestamp = new Date().toISOString();
        setWorkOrders([
          {
            id: "demo-work-order",
            project_id: asset.projectId,
            asset_id: asset.id,
            code: "WO-DEMO-0001",
            title: "فحص تشغيلي للأصل",
            description: "معاينة الحالة العامة وتوثيق الملاحظات.",
            priority: "Medium",
            status: "Open",
            assigned_to: "فريق التشغيل",
            due_date: null,
            created_by: profile?.id ?? null,
            completed_at: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ]);
        return;
      }

      const rows = await listRecords<WorkOrder>("work_orders", {
        order: "created_at.desc",
        filters: { asset_id: `eq.${asset.id}` },
      });
      setWorkOrders(rows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل أوامر العمل.");
    } finally {
      setLoading(false);
    }
  }, [asset.id, asset.projectId, demoMode, profile?.id]);

  useEffect(() => {
    void loadWorkOrders();
  }, [loadWorkOrders]);

  const activeOrders = useMemo(
    () => workOrders.filter((item) => item.status === "Open" || item.status === "InProgress").length,
    [workOrders],
  );

  const resetDialog = () => {
    setOpenDialog(false);
    setNewWorkOrder({ title: "", description: "", priority: "Medium", assignedTo: "", dueDate: "" });
  };

  const addWorkOrder = async () => {
    const title = newWorkOrder.title.trim();
    if (!title) return;

    setSaving(true);
    setError(null);
    try {
      const timestamp = new Date().toISOString();
      const record: WorkOrder = {
        id: crypto.randomUUID(),
        project_id: asset.projectId,
        asset_id: asset.id,
        code: nextWorkOrderCode(workOrders.length),
        title,
        description: newWorkOrder.description.trim() || null,
        priority: newWorkOrder.priority,
        status: "Open",
        assigned_to: newWorkOrder.assignedTo.trim() || null,
        due_date: newWorkOrder.dueDate || null,
        created_by: profile?.id ?? null,
        completed_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      };

      if (demoMode) setWorkOrders((current) => [record, ...current]);
      else await createRecord<WorkOrder>("work_orders", record);

      resetDialog();
      if (!demoMode) await loadWorkOrders();
      setNotice("تم إنشاء أمر العمل وحفظه بنجاح.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء أمر العمل.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (workOrder: WorkOrder, status: WorkOrderStatus) => {
    setError(null);
    try {
      const timestamp = new Date().toISOString();
      const changes = {
        status,
        completed_at: status === "Completed" ? timestamp : null,
        updated_at: timestamp,
      };
      if (demoMode) {
        setWorkOrders((current) => current.map((item) => item.id === workOrder.id ? { ...item, ...changes } : item));
      } else {
        await updateRecord<WorkOrder>("work_orders", workOrder.id, changes);
        await loadWorkOrders();
      }
      setNotice(`تم تحديث حالة الأمر إلى: ${workOrderStatusLabel[status]}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحديث أمر العمل.");
    }
  };

  const removeWorkOrder = async (workOrder: WorkOrder) => {
    if (!window.confirm(`حذف أمر العمل ${workOrder.code}؟`)) return;
    setError(null);
    try {
      if (demoMode) setWorkOrders((current) => current.filter((item) => item.id !== workOrder.id));
      else {
        await deleteRecord("work_orders", workOrder.id);
        await loadWorkOrders();
      }
      setNotice("تم حذف أمر العمل.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف أمر العمل.");
    }
  };

  const copyQrCode = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setNotice("تم نسخ رمز الأصل.");
    } catch {
      setError("تعذر نسخ الرمز تلقائيًا. اضغط مطولًا على النص لنسخه.");
    }
  };

  const printQrLabel = () => {
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setError("تعذر فتح بطاقة الطباعة. تحقق من السماح بفتح النوافذ للموقع.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${asset.code}</title><style>body{font-family:Tahoma,Arial;text-align:center;margin:0;padding:24px;color:#071b34}.label{width:90mm;min-height:55mm;margin:auto;border:2px solid #071b34;border-top:8px solid #c9a227;border-radius:12px;padding:18px}.brand{font-weight:900;font-size:20px}.name{font-size:18px;font-weight:800;margin:12px 0}.code{font-family:monospace;word-break:break-all;font-size:11px}.qr{width:150px;height:150px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">طباعة</button><section class="label"><div class="brand">ACP ENTERPRISE</div><div class="name">${asset.name}</div>${qrImageUrl ? `<img class="qr" src="${qrImageUrl}" alt="QR">` : ""}<div class="code">${qrPayload}</div></section></body></html>`);
    printWindow.document.close();
  };

  const statusColor = asset.status === "Running" ? "success" : asset.status === "Stopped" ? "error" : "warning";
  const criticalityColor = asset.criticality === "Critical" ? "error" : asset.criticality === "High" ? "warning" : asset.criticality === "Medium" ? "info" : "success";

  return (
    <Box sx={{ pb: 4 }} dir="rtl">
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          borderRadius: 4,
          bgcolor: "#071B34",
          color: "white",
          borderBottom: "5px solid #C9A227",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: "#E7CA70", fontWeight: 900 }}>ASSET OPERATIONS</Typography>
            <Typography variant="h4">{asset.name}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,.72)", mt: 0.5 }}>{asset.code} — {asset.location || "الموقع غير مسجل"}</Typography>
          </Box>
          <Button variant="outlined" onClick={onBack} sx={{ color: "white", borderColor: "rgba(255,255,255,.55)", "&:hover": { borderColor: "white" } }}>
            العودة إلى سجل الأصول
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: "100%" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h5">بيانات الأصل</Typography>
                <Typography color="text.secondary">المرجع التشغيلي والتعريفي المعتمد للأصل.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip color={statusColor} label={statusLabel[asset.status] ?? asset.status} />
                <Chip color={criticalityColor} label={`الأهمية: ${criticalityLabel[asset.criticality] ?? asset.criticality}`} />
              </Stack>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="رقم الأصل" value={asset.code} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="نوع الأصل" value={assetTypeLabel[asset.assetType] ?? asset.assetType} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="الموقع" value={asset.location} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="الشركة المصنعة" value={asset.manufacturer} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="الموديل" value={asset.model} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="الرقم التسلسلي" value={asset.serialNumber} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="تاريخ التركيب" value={asset.installDate} /></Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}><DetailItem label="انتهاء الضمان" value={asset.warrantyExpiry} /></Grid>
              <Grid size={{ xs: 12 }}><DetailItem label="الوصف" value={asset.description} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: "100%", textAlign: "center", bgcolor: "#FBFCFE" }}>
            <QrCode2OutlinedIcon sx={{ fontSize: 36, color: "secondary.main" }} />
            <Typography variant="h5" sx={{ mt: 1 }}>هوية QR للأصل</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.75, mb: 2 }}>
              رمز فعلي قابل للمسح والطباعة، وليس شريحة غير متوفرة.
            </Typography>
            {qrImageUrl ? (
              <Box component="img" src={qrImageUrl} alt={`QR للأصل ${asset.code}`} sx={{ width: 190, maxWidth: "100%", aspectRatio: "1", bgcolor: "white", p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }} />
            ) : (
              <Alert severity="warning">تعذر توليد QR لأن الاتصال السحابي غير مهيأ.</Alert>
            )}
            <Typography sx={{ mt: 1.5, fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{qrPayload}</Typography>
            <Stack direction={{ xs: "column", sm: "row", lg: "column", xl: "row" }} spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => void copyQrCode()}>نسخ الرمز</Button>
              <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={printQrLabel}>طباعة البطاقة</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <EngineeringOutlinedIcon color="primary" />
              <Typography variant="h5">أوامر العمل</Typography>
              <Chip size="small" color={activeOrders > 0 ? "warning" : "success"} label={`${activeOrders} نشط`} />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>أوامر محفوظة في قاعدة البيانات ومرتبطة مباشرة بالأصل.</Typography>
          </Box>
          {canCreate && <Button variant="contained" startIcon={<AddTaskOutlinedIcon />} onClick={() => setOpenDialog(true)}>إنشاء أمر عمل</Button>}
        </Stack>

        {loading ? (
          <Box sx={{ py: 5, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : workOrders.length === 0 ? (
          <Alert severity="info">لا توجد أوامر عمل مرتبطة بهذا الأصل.</Alert>
        ) : (
          <>
            <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
              {workOrders.map((workOrder) => (
                <Paper key={workOrder.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box><Typography fontWeight={800}>{workOrder.title}</Typography><Typography variant="caption" color="text.secondary">{workOrder.code}</Typography></Box>
                    <Chip size="small" label={workOrderStatusLabel[workOrder.status]} color={workOrder.status === "Completed" ? "success" : workOrder.status === "InProgress" ? "warning" : workOrder.status === "Cancelled" ? "default" : "info"} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>{workOrder.description || "دون وصف"}</Typography>
                  <Typography variant="caption">المسند إليه: {workOrder.assigned_to || "غير مسند"} — الاستحقاق: {workOrder.due_date || "غير محدد"}</Typography>
                  {canUpdate && workOrder.status !== "Completed" && workOrder.status !== "Cancelled" && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                      {workOrder.status === "Open" && <Button size="small" onClick={() => void changeStatus(workOrder, "InProgress")}>بدء التنفيذ</Button>}
                      <Button size="small" color="success" onClick={() => void changeStatus(workOrder, "Completed")}>إكمال</Button>
                      <Button size="small" color="warning" onClick={() => void changeStatus(workOrder, "Cancelled")}>إلغاء</Button>
                      {canDelete && <Button size="small" color="error" onClick={() => void removeWorkOrder(workOrder)}>حذف</Button>}
                    </Stack>
                  )}
                </Paper>
              ))}
            </Stack>

            <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>رقم الأمر</TableCell><TableCell>العنوان</TableCell><TableCell>الأولوية</TableCell><TableCell>الحالة</TableCell><TableCell>المسند إليه</TableCell><TableCell>الاستحقاق</TableCell><TableCell>الإجراءات</TableCell></TableRow></TableHead>
                <TableBody>
                  {workOrders.map((workOrder) => (
                    <TableRow key={workOrder.id} hover>
                      <TableCell>{workOrder.code}</TableCell>
                      <TableCell><Typography fontWeight={700}>{workOrder.title}</Typography><Typography variant="caption" color="text.secondary">{workOrder.description || "دون وصف"}</Typography></TableCell>
                      <TableCell><Chip size="small" label={workOrderPriorityLabel[workOrder.priority]} color={workOrder.priority === "Critical" ? "error" : workOrder.priority === "High" ? "warning" : workOrder.priority === "Medium" ? "info" : "default"} /></TableCell>
                      <TableCell><Chip size="small" label={workOrderStatusLabel[workOrder.status]} color={workOrder.status === "Completed" ? "success" : workOrder.status === "InProgress" ? "warning" : workOrder.status === "Cancelled" ? "default" : "info"} /></TableCell>
                      <TableCell>{workOrder.assigned_to || "غير مسند"}</TableCell>
                      <TableCell>{workOrder.due_date || "غير محدد"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {canUpdate && workOrder.status === "Open" && <Button size="small" onClick={() => void changeStatus(workOrder, "InProgress")}>بدء</Button>}
                          {canUpdate && !["Completed", "Cancelled"].includes(workOrder.status) && <Button size="small" color="success" startIcon={<VerifiedOutlinedIcon />} onClick={() => void changeStatus(workOrder, "Completed")}>إكمال</Button>}
                          {canDelete && <Button size="small" color="error" onClick={() => void removeWorkOrder(workOrder)}>حذف</Button>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={resetDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>إنشاء أمر عمل للأصل {asset.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField required label="عنوان أمر العمل" value={newWorkOrder.title} onChange={(event) => setNewWorkOrder((current) => ({ ...current, title: event.target.value }))} />
            <TextField multiline minRows={3} label="الوصف" value={newWorkOrder.description} onChange={(event) => setNewWorkOrder((current) => ({ ...current, description: event.target.value }))} />
            <TextField select label="الأولوية" value={newWorkOrder.priority} onChange={(event) => setNewWorkOrder((current) => ({ ...current, priority: event.target.value as WorkOrderPriority }))}>
              <MenuItem value="Low">منخفضة</MenuItem><MenuItem value="Medium">متوسطة</MenuItem><MenuItem value="High">مرتفعة</MenuItem><MenuItem value="Critical">حرجة</MenuItem>
            </TextField>
            <TextField label="المسند إليه" value={newWorkOrder.assignedTo} onChange={(event) => setNewWorkOrder((current) => ({ ...current, assignedTo: event.target.value }))} />
            <TextField type="date" label="تاريخ الاستحقاق" slotProps={{ inputLabel: { shrink: true } }} value={newWorkOrder.dueDate} onChange={(event) => setNewWorkOrder((current) => ({ ...current, dueDate: event.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={resetDialog}>إلغاء</Button><Button variant="contained" onClick={() => void addWorkOrder()} disabled={!newWorkOrder.title.trim() || saving}>{saving ? <CircularProgress size={22} color="inherit" /> : "حفظ أمر العمل"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
