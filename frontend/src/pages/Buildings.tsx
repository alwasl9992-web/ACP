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
import type { Building } from "../models/Building";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";
import BuildingService from "../services/BuildingService";
import type { PlatformAsset } from "../types/platform";

interface BuildingsProps {
  onOpenAsset: (asset: Building) => void;
}

type AssetDraft = Pick<
  Building,
  "code" | "name" | "description" | "assetType" | "location" | "manufacturer" | "model" | "serialNumber" | "floors" | "gates" | "installDate" | "warrantyExpiry" | "criticality" | "status"
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
      if (demoMode) {
        setAssets(BuildingService.getBuildingsByProject(selectedProject.id));
      } else {
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

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const columns = useMemo<GridColDef<Building>[]>(
    () => [
      { field: "code", headerName: "رقم الأصل", width: 130 },
      { field: "name", headerName: "اسم الأصل", flex: 1, minWidth: 180 },
      { field: "assetType", headerName: "النوع", width: 140 },
      { field: "location", headerName: "الموقع", width: 180 },
      {
        field: "criticality",
        headerName: "الأهمية",
        width: 140,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={
              params.value === "Critical"
                ? "error"
                : params.value === "High"
                  ? "warning"
                  : params.value === "Medium"
                    ? "info"
                    : "success"
            }
          />
        ),
      },
      {
        field: "status",
        headerName: "الحالة",
        width: 140,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={
              params.value === "Running"
                ? "success"
                : params.value === "Stopped"
                  ? "error"
                  : "warning"
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: "الإجراءات",
        width: 250,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => onOpenAsset(params.row)}>
              فتح
            </Button>
            {canManage && (
              <Button size="small" onClick={() => startEdit(params.row)}>تعديل</Button>
            )}
            {canManage && (
              <Button color="error" size="small" onClick={() => void removeAsset(params.row)}>
                حذف
              </Button>
            )}
          </Stack>
        ),
      },
    ],
    [canManage, onOpenAsset],
  );

  const resetDialog = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(false);
  };

  const startCreate = () => {
    setDraft({
      ...emptyDraft,
      code: `AST-${String(assets.length + 1).padStart(3, "0")}`,
    });
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
        createdAt:
          assets.find((asset) => asset.id === editingId)?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      if (demoMode) {
        if (editingId) BuildingService.updateBuilding(localAsset);
        else BuildingService.addBuilding(localAsset);
      } else if (editingId) {
        await updateRecord<PlatformAsset>("assets", editingId, {
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
        });
      } else {
        await createRecord<PlatformAsset>("assets", {
          project_id: selectedProject.id,
          building_id: null,
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
          created_at: timestamp,
          updated_at: timestamp,
        });
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

  if (!selectedProject) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">الرجاء اختيار مشروع أولاً.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }} dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>سجل الأصول</Typography>
          <Typography color="text.secondary">المشروع الحالي: {selectedProject.name}</Typography>
        </Box>
        {canManage && <Button variant="contained" onClick={startCreate}>إضافة أصل</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: "100%", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <DataGrid
            rows={assets}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            sx={{ border: 0, direction: "rtl" }}
          />
        )}
      </Paper>

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
                <MenuItem value="Low">منخفضة</MenuItem>
                <MenuItem value="Medium">متوسطة</MenuItem>
                <MenuItem value="High">عالية</MenuItem>
                <MenuItem value="Critical">حرجة</MenuItem>
              </TextField>
              <TextField fullWidth select label="الحالة" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Building["status"] })}>
                <MenuItem value="Running">تشغيل</MenuItem>
                <MenuItem value="Maintenance">صيانة</MenuItem>
                <MenuItem value="Stopped">متوقف</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveAsset()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
