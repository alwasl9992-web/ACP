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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/authService";
import { useProject } from "../context/ProjectContext";
import type { Building } from "../models/Building";
import { createRecord, deleteRecord, listRecords, updateRecord } from "../services/acpRepository";
import BuildingService from "../services/BuildingService";
import type { PlatformAsset } from "../types/platform";

interface BuildingsProps {
  onOpenAsset: (asset: Building) => void;
}

type AssetDraft = Pick<Building,
  "code" | "name" | "description" | "assetType" | "location" | "manufacturer" |
  "model" | "serialNumber" | "floors" | "gates" | "installDate" |
  "warrantyExpiry" | "criticality" | "status"
>;

const emptyDraft: AssetDraft = {
  code: "",
  name: "",
  description: "",
  assetType: "مبنى",
  location: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  floors: 0,
  gates: 0,
  installDate: "",
  warrantyExpiry: "",
  criticality: "Medium",
  status: "Running",
};

const statusLabel: Record<Building["status"], string> = {
  Running: "يعمل",
  Maintenance: "تحت الصيانة",
  Stopped: "متوقف",
};

const criticalityLabel: Record<Building["criticality"], string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "عالية",
  Critical: "حرجة",
};

function platformToBuilding(asset: PlatformAsset): Building {
  return {
    id: asset.id,
    projectId: asset.project_id,
    code: asset.code,
    name: asset.name,
    description: asset.description ?? "",
    assetType: asset.asset_type,
    location: asset.location ?? "",
    manufacturer: asset.manufacturer ?? "",
    model: asset.model ?? "",
    serialNumber: asset.serial_number ?? "",
    floors: asset.floors,
    gates: asset.gates_count,
    installDate: asset.install_date ?? "",
    warrantyExpiry: asset.warranty_expiry ?? "",
    criticality: asset.criticality,
    status: asset.operational_status,
    qrCode: asset.qr_code ?? `ACP-ASSET:${asset.id}`,
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
  };
}

function criticalityColor(value: Building["criticality"]): "error" | "warning" | "info" | "success" {
  if (value === "Critical") return "error";
  if (value === "High") return "warning";
  if (value === "Medium") return "info";
  return "success";
}

function statusColor(value: Building["status"]): "success" | "error" | "warning" {
  if (value === "Running") return "success";
  if (value === "Stopped") return "error";
  return "warning";
}

export default function Buildings({ onOpenAsset }: BuildingsProps) {
  const { selectedProject } = useProject();
  const { profile, demoMode } = useAuth();
  const [assets, setAssets] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(emptyDraft);

  const canManage = demoMode || can(profile?.role, "project.manage");

  const loadAssets = useCallback(async () => {
    if (!selectedProject) {
      setAssets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (demoMode) setAssets(BuildingService.getBuildingsByProject(selectedProject.id));
      else {
        const rows = await listRecords<PlatformAsset>("assets", {
          order: "created_at.desc",
          filters: { project_id: `eq.${selectedProject.id}` },
        });
        setAssets(rows.map(platformToBuilding));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل الأصول.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  const resetDialog = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(false);
  };

  const startCreate = () => {
    setDraft({ ...emptyDraft, code: `AST-${String(assets.length + 1).padStart(3, "0")}` });
    setEditingId(null);
    setOpen(true);
  };

  const startEdit = (asset: Building) => {
    setDraft({
      code: asset.code,
      name: asset.name,
      description: asset.description,
      assetType: asset.assetType,
      location: asset.location,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serialNumber,
      floors: asset.floors,
      gates: asset.gates,
      installDate: asset.installDate,
      warrantyExpiry: asset.warrantyExpiry,
      criticality: asset.criticality,
      status: asset.status,
    });
    setEditingId(asset.id);
    setOpen(true);
  };

  const saveAsset = async () => {
    if (!selectedProject || !draft.code.trim() || !draft.name.trim()) {
      setError("رقم الأصل واسمه مطلوبان.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const timestamp = new Date().toISOString();
      const localAsset: Building = {
        id: editingId ?? crypto.randomUUID(),
        projectId: selectedProject.id,
        ...draft,
        qrCode: `ACP-ASSET:${editingId ?? draft.code}`,
        createdAt: assets.find((asset) => asset.id === editingId)?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      if (demoMode) {
        if (editingId) BuildingService.updateBuilding(localAsset);
        else BuildingService.addBuilding(localAsset);
      } else {
        const payload = {
          code: draft.code.trim(),
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          asset_type: draft.assetType.trim(),
          location: draft.location.trim() || null,
          manufacturer: draft.manufacturer.trim() || null,
          model: draft.model.trim() || null,
          serial_number: draft.serialNumber.trim() || null,
          floors: Number(draft.floors) || 0,
          gates_count: Number(draft.gates) || 0,
          install_date: draft.installDate || null,
          warranty_expiry: draft.warrantyExpiry || null,
          criticality: draft.criticality,
          operational_status: draft.status,
          qr_code: localAsset.qrCode,
          updated_at: timestamp,
        };
        if (editingId) await updateRecord<PlatformAsset>("assets", editingId, payload);
        else {
          await createRecord<PlatformAsset>("assets", {
            project_id: selectedProject.id,
            building_id: null,
            ...payload,
            created_at: timestamp,
          });
        }
      }
      resetDialog();
      await loadAssets();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ الأصل.");
    } finally {
      setSaving(false);
    }
  };

  const removeAsset = async (asset: Building) => {
    if (!window.confirm(`حذف الأصل: ${asset.name}؟`)) return;
    setError(null);
    try {
      if (demoMode) BuildingService.deleteBuilding(asset.id);
      else await deleteRecord("assets", asset.id);
      await loadAssets();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف الأصل.");
    }
  };

  const columns = useMemo<GridColDef<Building>[]>(() => [
    { field: "code", headerName: "رقم الأصل", width: 130 },
    { field: "name", headerName: "اسم الأصل", flex: 1, minWidth: 180 },
    { field: "assetType", headerName: "النوع", width: 140 },
    { field: "location", headerName: "الموقع", width: 180 },
    { field: "criticality", headerName: "الأهمية", width: 140, renderCell: ({ value }) => <Chip size="small" label={criticalityLabel[value as Building["criticality"]]} color={criticalityColor(value as Building["criticality"])} /> },
    { field: "status", headerName: "الحالة", width: 140, renderCell: ({ value }) => <Chip size="small" label={statusLabel[value as Building["status"]]} color={statusColor(value as Building["status"])} /> },
    {
      field: "actions",
      headerName: "الإجراءات",
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => onOpenAsset(row)}>فتح</Button>
          {canManage && <Button size="small" onClick={() => startEdit(row)}>تعديل</Button>}
          {canManage && <Button color="error" size="small" onClick={() => void removeAsset(row)}>حذف</Button>}
        </Stack>
      ),
    },
  ], [canManage, onOpenAsset]);

  if (!selectedProject) return <Alert severity="info">اختر مشروعًا أولًا لعرض الأصول.</Alert>;

  return (
    <Box dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">سجل الأصول</Typography>
          <Typography color="text.secondary">المشروع الحالي: {selectedProject.name}</Typography>
        </Box>
        {canManage && <Button variant="contained" onClick={startCreate}>إضافة أصل</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Paper variant="outlined" sx={{ minHeight: 300, display: "grid", placeItems: "center", borderRadius: 3 }}><CircularProgress /></Paper>
      ) : assets.length === 0 ? (
        <Alert severity="info">لا توجد أصول مسجلة لهذا المشروع.</Alert>
      ) : (
        <>
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {assets.map((asset) => (
              <Paper key={asset.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="flex-start">
                  <Box minWidth={0}>
                    <Typography variant="caption" color="secondary.dark" fontWeight={900}>{asset.code}</Typography>
                    <Typography variant="h6" sx={{ mt: 0.25 }}>{asset.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{asset.assetType} — {asset.location || "الموقع غير مسجل"}</Typography>
                  </Box>
                  <Chip size="small" label={statusLabel[asset.status]} color={statusColor(asset.status)} />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                  <Chip size="small" variant="outlined" label={`الأهمية: ${criticalityLabel[asset.criticality]}`} color={criticalityColor(asset.criticality)} />
                  <Chip size="small" variant="outlined" label={`${asset.floors} طابق`} />
                  <Chip size="small" variant="outlined" label={`${asset.gates} بوابة`} />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <Button variant="contained" startIcon={<LaunchOutlinedIcon />} onClick={() => onOpenAsset(asset)}>فتح الأصل</Button>
                  {canManage && <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => startEdit(asset)}>تعديل</Button>}
                  {canManage && <Button color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => void removeAsset(asset)}>حذف</Button>}
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Paper sx={{ height: 600, width: "100%", overflow: "hidden", display: { xs: "none", md: "block" } }}>
            <DataGrid rows={assets} columns={columns} disableRowSelectionOnClick pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }} sx={{ border: 0, direction: "rtl" }} />
          </Paper>
        </>
      )}

      <Dialog open={open} onClose={resetDialog} fullWidth maxWidth="md" dir="rtl">
        <DialogTitle>{editingId ? "تعديل الأصل" : "إضافة أصل"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="رقم الأصل" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
              <TextField fullWidth label="اسم الأصل" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Stack>
            <TextField label="الوصف" multiline minRows={2} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="النوع" value={draft.assetType} onChange={(event) => setDraft({ ...draft, assetType: event.target.value })} />
              <TextField fullWidth label="الموقع" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth label="الشركة المصنعة" value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} />
              <TextField fullWidth label="الموديل" value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
              <TextField fullWidth label="الرقم التسلسلي" value={draft.serialNumber} onChange={(event) => setDraft({ ...draft, serialNumber: event.target.value })} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth type="number" label="عدد الطوابق" value={draft.floors} onChange={(event) => setDraft({ ...draft, floors: Number(event.target.value) })} />
              <TextField fullWidth type="number" label="عدد البوابات" value={draft.gates} onChange={(event) => setDraft({ ...draft, gates: Number(event.target.value) })} />
              <TextField fullWidth select label="الأهمية" value={draft.criticality} onChange={(event) => setDraft({ ...draft, criticality: event.target.value as Building["criticality"] })}>
                <MenuItem value="Low">منخفضة</MenuItem><MenuItem value="Medium">متوسطة</MenuItem><MenuItem value="High">عالية</MenuItem><MenuItem value="Critical">حرجة</MenuItem>
              </TextField>
              <TextField fullWidth select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Building["status"] })}>
                <MenuItem value="Running">تشغيل</MenuItem><MenuItem value="Maintenance">صيانة</MenuItem><MenuItem value="Stopped">متوقف</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={resetDialog}>إلغاء</Button><Button variant="contained" onClick={() => void saveAsset()} disabled={saving}>{saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
