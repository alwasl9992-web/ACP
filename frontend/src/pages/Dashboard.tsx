import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";

import ACP from "../core/ACP";
import { useAuth } from "../auth/AuthContext";
import { useProject } from "../context/ProjectContext";
import { listRecords } from "../services/acpRepository";
import type {
  PlatformAsset,
  PlatformBuilding,
  PlatformEmployee,
  PlatformGate,
  PlatformIncident,
  PlatformProject,
  PlatformReport,
  PlatformWarehouse,
} from "../types/platform";

interface DashboardStats {
  projects: number;
  buildings: number;
  assets: number;
  gates: number;
  employees: number;
  warehouses: number;
  incidents: number;
  reports: number;
  openIncidents: number;
  approvedReports: number;
  activeEmployees: number;
  runningAssets: number;
}

const emptyStats: DashboardStats = {
  projects: 0,
  buildings: 0,
  assets: 0,
  gates: 0,
  employees: 0,
  warehouses: 0,
  incidents: 0,
  reports: 0,
  openIncidents: 0,
  approvedReports: 0,
  activeEmployees: 0,
  runningAssets: 0,
};

interface MetricCardProps {
  title: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, helper, icon }: MetricCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        height: "100%",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(7,27,52,.08)" },
        "&::after": {
          content: '""',
          position: "absolute",
          insetInlineEnd: -24,
          top: -24,
          width: 88,
          height: 88,
          borderRadius: "50%",
          bgcolor: "rgba(201,162,39,.10)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography color="text.secondary" variant="body2" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="h3" color="primary.main" sx={{ mt: 0.75, fontSize: { xs: "2rem", md: "2.35rem" } }}>
            {value.toLocaleString("ar-SA")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: "#071B34",
            color: "#D8B64B",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function Dashboard() {
  const { demoMode } = useAuth();
  const { selectedProject } = useProject();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectFilters = useMemo(
    () => (selectedProject ? { project_id: `eq.${selectedProject.id}` } : undefined),
    [selectedProject],
  );

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (demoMode) {
        const demo = ACP.getStatistics();
        setStats({
          ...emptyStats,
          projects: demo.totalProjects,
          buildings: demo.totalBuildings,
          gates: demo.totalGates,
          employees: demo.totalEmployees,
        });
        return;
      }

      const options = projectFilters ? { filters: projectFilters } : {};
      const results = await Promise.allSettled([
        selectedProject
          ? Promise.resolve([{ id: selectedProject.id }] as Pick<PlatformProject, "id">[])
          : listRecords<PlatformProject>("projects", { order: "created_at.desc" }),
        listRecords<PlatformBuilding>("buildings", options),
        listRecords<PlatformAsset>("assets", options),
        listRecords<PlatformGate>("gates", options),
        listRecords<PlatformEmployee>("employees", options),
        listRecords<PlatformWarehouse>("warehouses", options),
        listRecords<PlatformIncident>("incidents", options),
        listRecords<PlatformReport>("reports", options),
      ]);

      const rows = <T,>(index: number): T[] =>
        results[index]?.status === "fulfilled" ? (results[index].value as T[]) : [];

      const projects = rows<PlatformProject>(0);
      const buildings = rows<PlatformBuilding>(1);
      const assets = rows<PlatformAsset>(2);
      const gates = rows<PlatformGate>(3);
      const employees = rows<PlatformEmployee>(4);
      const warehouses = rows<PlatformWarehouse>(5);
      const incidents = rows<PlatformIncident>(6);
      const reports = rows<PlatformReport>(7);

      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed > 0) {
        setError(`تم تحميل البيانات المتاحة، لكن تعذر قراءة ${failed} مصدر بيانات. راجع الصلاحيات أو الاتصال.`);
      }

      setStats({
        projects: projects.length,
        buildings: buildings.length,
        assets: assets.length,
        gates: gates.length,
        employees: employees.length,
        warehouses: warehouses.length,
        incidents: incidents.length,
        reports: reports.length,
        openIncidents: incidents.filter((item) => !["resolved", "closed", "cancelled"].includes(item.status)).length,
        approvedReports: reports.filter((item) => item.status === "approved").length,
        activeEmployees: employees.filter((item) => item.status === "active").length,
        runningAssets: assets.filter((item) => item.operational_status === "Running").length,
      });
    } catch (reason) {
      setStats(emptyStats);
      setError(reason instanceof Error ? reason.message : "تعذر تحميل مؤشرات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, projectFilters, selectedProject]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const assetHealth = stats.assets > 0 ? Math.round((stats.runningAssets / stats.assets) * 100) : 0;
  const employeeActivity = stats.employees > 0 ? Math.round((stats.activeEmployees / stats.employees) * 100) : 0;
  const reportApproval = stats.reports > 0 ? Math.round((stats.approvedReports / stats.reports) * 100) : 0;

  const metrics = [
    { title: "المشاريع", value: stats.projects, helper: "المشاريع المتاحة للحساب", icon: <BusinessCenterOutlinedIcon /> },
    { title: "المباني", value: stats.buildings, helper: "سجلات المباني الفعلية", icon: <DomainOutlinedIcon /> },
    { title: "الأصول", value: stats.assets, helper: "الأصول التشغيلية المسجلة", icon: <Inventory2OutlinedIcon /> },
    { title: "البوابات", value: stats.gates, helper: "البوابات المرتبطة بالمواقع", icon: <ConfirmationNumberOutlinedIcon /> },
    { title: "الموظفون", value: stats.employees, helper: "ملفات الموظفين الفعلية", icon: <BadgeOutlinedIcon /> },
    { title: "المستودعات", value: stats.warehouses, helper: "المستودعات النشطة والمتاحة", icon: <StoreOutlinedIcon /> },
    { title: "البلاغات", value: stats.incidents, helper: `${stats.openIncidents.toLocaleString("ar-SA")} بلاغ مفتوح`, icon: <ReportProblemOutlinedIcon /> },
    { title: "التقارير", value: stats.reports, helper: `${stats.approvedReports.toLocaleString("ar-SA")} تقرير معتمد`, icon: <DescriptionOutlinedIcon /> },
  ];

  return (
    <Box dir="rtl">
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          borderRadius: 4,
          bgcolor: "#071B34",
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            insetInlineStart: -90,
            bottom: -120,
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(201,162,39,.14)",
          },
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} position="relative" zIndex={1}>
          <Box>
            <Typography variant="overline" sx={{ color: "#E7CA70", fontWeight: 900, letterSpacing: ".12em" }}>
              ACP OPERATIONS CENTER
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              لوحة التحكم التنفيذية
            </Typography>
            <Typography sx={{ mt: 1, color: "rgba(255,255,255,.76)" }}>
              {selectedProject ? `بيانات مباشرة للمشروع: ${selectedProject.name}` : "ملخص مباشر لجميع المشاريع المتاحة للحساب"}
            </Typography>
          </Box>
          <Chip
            icon={<ApartmentOutlinedIcon />}
            label={demoMode ? "بيانات تجريبية" : "متصل بقاعدة البيانات"}
            sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: "rgba(255,255,255,.12)", color: "white" }}
          />
        </Stack>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Paper variant="outlined" sx={{ p: 6, display: "grid", placeItems: "center", borderRadius: 3 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">جارٍ قراءة المؤشرات الفعلية…</Typography>
          </Stack>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {metrics.map((metric) => (
              <Grid key={metric.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard {...metric} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { title: "جاهزية الأصول", value: assetHealth, note: `${stats.runningAssets} من ${stats.assets} في حالة تشغيل` },
              { title: "نشاط الموظفين", value: employeeActivity, note: `${stats.activeEmployees} من ${stats.employees} على رأس العمل` },
              { title: "اعتماد التقارير", value: reportApproval, note: `${stats.approvedReports} من ${stats.reports} معتمد` },
            ].map((item) => (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                    <Typography fontWeight={800}>{item.title}</Typography>
                    <Typography fontWeight={900} color="primary.main">{item.value}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    sx={{ height: 8, borderRadius: 99, bgcolor: "#E6EBF2", "& .MuiLinearProgress-bar": { bgcolor: "#C9A227" } }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.25}>
                    {item.note}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
