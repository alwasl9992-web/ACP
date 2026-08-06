import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import DoorFrontOutlinedIcon from "@mui/icons-material/DoorFrontOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationCityOutlinedIcon from "@mui/icons-material/LocationCityOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";

import { useAuth } from "../auth/AuthContext";
import { useProject } from "../context/ProjectContext";
import { listRecords } from "../services/acpRepository";
import type {
  PlatformAsset,
  PlatformBuilding,
  PlatformGate,
  PlatformWarehouse,
} from "../types/platform";

interface SiteSummary {
  id: string;
  code: string;
  name: string;
  address: string;
  status: PlatformBuilding["status"];
  gates: number;
  assets: number;
}

const statusLabel: Record<PlatformBuilding["status"], string> = {
  active: "نشط",
  inactive: "غير نشط",
  archived: "مؤرشف",
};

export default function SitesPage() {
  const { selectedProject } = useProject();
  const { demoMode } = useAuth();
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [warehouses, setWarehouses] = useState<PlatformWarehouse[]>([]);
  const [unassignedAssets, setUnassignedAssets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    if (!selectedProject) {
      setSites([]);
      setWarehouses([]);
      setUnassignedAssets(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setSites([
          { id: "demo-site-1", code: "BLD-01", name: "المبنى الرئيسي", address: selectedProject.location || "الموقع الرئيسي", status: "active", gates: 3, assets: 6 },
          { id: "demo-site-2", code: "BLD-02", name: "مبنى الخدمات", address: selectedProject.location || "الموقع الرئيسي", status: "active", gates: 1, assets: 3 },
        ]);
        setWarehouses([]);
        setUnassignedAssets(0);
        return;
      }

      const filters = { project_id: `eq.${selectedProject.id}` };
      const [buildings, gates, assets, warehouseRows] = await Promise.all([
        listRecords<PlatformBuilding>("buildings", { order: "code.asc", filters }),
        listRecords<PlatformGate>("gates", { order: "code.asc", filters }),
        listRecords<PlatformAsset>("assets", { order: "code.asc", filters }),
        listRecords<PlatformWarehouse>("warehouses", { order: "code.asc", filters }),
      ]);

      const gateCount = new Map<string, number>();
      gates.forEach((gate) => {
        if (gate.building_id) gateCount.set(gate.building_id, (gateCount.get(gate.building_id) ?? 0) + 1);
      });
      const assetCount = new Map<string, number>();
      assets.forEach((asset) => {
        if (asset.building_id) assetCount.set(asset.building_id, (assetCount.get(asset.building_id) ?? 0) + 1);
      });

      setSites(
        buildings.map((building) => ({
          id: building.id,
          code: building.code,
          name: building.name,
          address: building.address || selectedProject.location || "لم يسجل عنوان تفصيلي",
          status: building.status,
          gates: gateCount.get(building.id) ?? 0,
          assets: assetCount.get(building.id) ?? 0,
        })),
      );
      setWarehouses(warehouseRows);
      setUnassignedAssets(assets.filter((asset) => !asset.building_id).length);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل المواقع التشغيلية.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, selectedProject]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const totals = useMemo(
    () => ({
      buildings: sites.length,
      gates: sites.reduce((sum, item) => sum + item.gates, 0),
      assignedAssets: sites.reduce((sum, item) => sum + item.assets, 0),
      warehouses: warehouses.length,
    }),
    [sites, warehouses.length],
  );

  if (!selectedProject) {
    return <Alert severity="info">اختر مشروعًا أولًا لعرض المواقع التشغيلية.</Alert>;
  }

  return (
    <Box dir="rtl">
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
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: "#E7CA70", fontWeight: 900 }}>
              OPERATIONAL LOCATIONS
            </Typography>
            <Typography variant="h4">إدارة المواقع</Typography>
            <Typography sx={{ mt: 0.75, color: "rgba(255,255,255,.74)" }}>
              عرض مباشر للمباني والبوابات والأصول والمستودعات ضمن {selectedProject.name}.
            </Typography>
          </Box>
          <Chip
            icon={<LocationCityOutlinedIcon />}
            label={`${totals.buildings.toLocaleString("ar-SA")} موقع مبني`}
            sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: "rgba(255,255,255,.13)", color: "white" }}
          />
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 6, display: "grid", placeItems: "center", borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center"><CircularProgress /><Typography color="text.secondary">جارٍ تحميل المواقع الفعلية…</Typography></Stack>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { title: "المباني", value: totals.buildings, icon: <ApartmentOutlinedIcon /> },
              { title: "البوابات المرتبطة", value: totals.gates, icon: <DoorFrontOutlinedIcon /> },
              { title: "الأصول المرتبطة", value: totals.assignedAssets, icon: <Inventory2OutlinedIcon /> },
              { title: "المستودعات", value: totals.warehouses, icon: <StoreOutlinedIcon /> },
            ].map((item) => (
              <Grid key={item.title} size={{ xs: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box><Typography variant="body2" color="text.secondary" fontWeight={700}>{item.title}</Typography><Typography variant="h4" color="primary.main" sx={{ mt: 0.5 }}>{item.value.toLocaleString("ar-SA")}</Typography></Box>
                    <Box sx={{ color: "secondary.main" }}>{item.icon}</Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {unassignedAssets > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              يوجد {unassignedAssets.toLocaleString("ar-SA")} أصل غير مربوط بمبنى. يمكن ربطه من سجل الأصول لتحسين دقة التقارير.
            </Alert>
          )}

          {sites.length === 0 ? (
            <Alert severity="info">لا توجد مبانٍ مسجلة لهذا المشروع حتى الآن.</Alert>
          ) : (
            <Grid container spacing={2}>
              {sites.map((site) => (
                <Grid key={site.id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Box minWidth={0}>
                        <Typography variant="caption" color="secondary.dark" fontWeight={900}>{site.code}</Typography>
                        <Typography variant="h6" sx={{ mt: 0.25 }}>{site.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{site.address}</Typography>
                      </Box>
                      <Chip size="small" color={site.status === "active" ? "success" : site.status === "inactive" ? "warning" : "default"} label={statusLabel[site.status]} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" icon={<DoorFrontOutlinedIcon />} label={`${site.gates} بوابة`} />
                      <Chip size="small" variant="outlined" icon={<Inventory2OutlinedIcon />} label={`${site.assets} أصل`} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
