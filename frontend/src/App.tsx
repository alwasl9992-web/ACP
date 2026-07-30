import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";

import ACP from "./config/acp.config";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import SitesPage from "./sites/SitesPage";
import ProjectsPage from "./pages/ProjectsPage";
import Buildings from "./pages/Buildings";
import Gates from "./pages/Gates";
import Employees from "./pages/Employees";
import Warehouses from "./pages/Warehouses";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const drawerWidth = 276;

const menu = [
  { key: "landing", title: "الموقع التعريفي", icon: PublicRoundedIcon },
  { key: "dashboard", title: "لوحة التحكم", icon: DashboardRoundedIcon },
  { key: "sites", title: "المواقع", icon: LocationOnRoundedIcon },
  { key: "projects", title: "المشاريع", icon: AccountTreeRoundedIcon },
  { key: "assets", title: "الأصول", icon: ApartmentRoundedIcon },
  { key: "gates", title: "البوابات", icon: MeetingRoomRoundedIcon },
  { key: "employees", title: "الموظفون", icon: GroupsRoundedIcon },
  { key: "warehouses", title: "المستودعات", icon: WarehouseRoundedIcon },
  { key: "maintenance", title: "البلاغات والصيانة", icon: BuildCircleRoundedIcon },
  { key: "reports", title: "التقارير", icon: AssessmentRoundedIcon },
  { key: "settings", title: "الإعدادات", icon: SettingsRoundedIcon },
];

export default function App() {
  const [page, setPage] = useState("landing");

  const renderPage = () => {
    switch (page) {
      case "landing":
        return <LandingPage />;
      case "sites":
        return <SitesPage />;
      case "projects":
        return <ProjectsPage />;
      case "assets":
        return <Buildings />;
      case "gates":
        return <Gates />;
      case "employees":
        return <Employees />;
      case "warehouses":
        return <Warehouses />;
      case "maintenance":
        return <Maintenance />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const activeTitle = menu.find((item) => item.key === page)?.title ?? "الموقع التعريفي";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", direction: "rtl", bgcolor: "#f3f6fb" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,.94)",
          color: "#10243e",
          borderBottom: "1px solid #e5eaf1",
          backdropFilter: "blur(14px)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
          <Box sx={{ width: { xs: 0, md: drawerWidth - 16 }, display: { xs: "none", md: "block" } }} />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "#8a6a2f", fontWeight: 800, letterSpacing: 1 }}>
                ACP ENTERPRISE · ASSET • CONNECT • PROTECT
              </Typography>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {activeTitle}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.2} alignItems="center">
              <Chip
                label="نسخة ديمو جاهزة للعرض"
                size="small"
                sx={{ display: { xs: "none", sm: "flex" }, bgcolor: "#eaf7ef", color: "#18794e", fontWeight: 800 }}
              />
              <Tooltip title="الإشعارات">
                <IconButton sx={{ border: "1px solid #e5eaf1" }}>
                  <NotificationsNoneRoundedIcon />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ width: 38, height: 38, bgcolor: "#10243e", fontSize: 14, fontWeight: 800 }}>ACP</Avatar>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: { xs: 76, md: drawerWidth },
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: { xs: 76, md: drawerWidth },
            boxSizing: "border-box",
            bgcolor: "#0d223d",
            color: "#dce6f2",
            borderLeft: 0,
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
        <Box sx={{ px: { xs: 1, md: 2 }, py: 2 }}>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              mb: 2,
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(197,155,65,.22), rgba(255,255,255,.04))",
              border: "1px solid rgba(197,155,65,.24)",
            }}
          >
            <Typography sx={{ color: "#d7b86d", fontWeight: 900, fontSize: 20 }}>{ACP.name}</Typography>
            <Typography variant="caption" sx={{ color: "#9fb0c4" }}>
              الإصدار {ACP.version} · منصة الإدارة المؤسسية
            </Typography>
          </Box>

          <List sx={{ display: "grid", gap: 0.65 }}>
            {menu.map((item) => {
              const Icon = item.icon;
              const selected = page === item.key;
              return (
                <Tooltip key={item.key} title={item.title} placement="left" disableHoverListener={false}>
                  <ListItemButton
                    selected={selected}
                    onClick={() => setPage(item.key)}
                    sx={{
                      minHeight: 48,
                      borderRadius: 2.5,
                      justifyContent: { xs: "center", md: "flex-start" },
                      px: { xs: 1.2, md: 1.5 },
                      color: selected ? "#fff" : "#b9c7d8",
                      "&.Mui-selected": {
                        bgcolor: "rgba(197,155,65,.2)",
                        color: "#fff",
                        boxShadow: "inset -3px 0 #d2ad59",
                      },
                      "&.Mui-selected:hover": { bgcolor: "rgba(197,155,65,.25)" },
                      "&:hover": { bgcolor: "rgba(255,255,255,.07)", color: "#fff" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 0, md: 42 }, color: selected ? "#d7b86d" : "inherit" }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      sx={{ display: { xs: "none", md: "block" } }}
                      primaryTypographyProps={{ fontWeight: selected ? 800 : 600, fontSize: 14 }}
                    />
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          mr: { xs: "76px", md: `${drawerWidth}px` },
          pt: { xs: "64px", md: "72px" },
        }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2.5, lg: 3.5 }, maxWidth: 1600, mx: "auto" }}>{renderPage()}</Box>
      </Box>
    </Box>
  );
}
