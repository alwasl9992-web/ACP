import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DoorFrontOutlinedIcon from "@mui/icons-material/DoorFrontOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationCityOutlinedIcon from "@mui/icons-material/LocationCityOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";

import ACP from "./config/acp.config";
import BrandMark from "./components/BrandMark";
import LoginPage from "./auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import SitesPage from "./sites/SitesPage";
import ProjectsPage from "./pages/ProjectsPage";
import Buildings from "./pages/Buildings";
import AssetProfile from "./pages/AssetProfile";
import Gates from "./pages/Gates";
import Employees from "./pages/Employees";
import Warehouses from "./pages/Warehouses";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import { useAuth } from "./auth/AuthContext";
import { useNavigation } from "./context/NavigationContext";
import type { Building } from "./models/Building";
import { enableAutomaticSync } from "./services/acpRepository";

const drawerWidth = 270;

export default function App() {
  const { page, navigate } = useNavigation();
  const { profile, session, loading, configured, demoMode, signOut } = useAuth();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Building | null>(null);
  const [syncText, setSyncText] = useState("جاهز");

  useEffect(
    () =>
      enableAutomaticSync((result) => {
        if (result.failed > 0) setSyncText(`فشل مزامنة ${result.failed}`);
        else if (result.remaining > 0) setSyncText(`بانتظار المزامنة: ${result.remaining}`);
        else if (result.applied > 0) setSyncText(`تمت مزامنة ${result.applied}`);
        else setSyncText(navigator.onLine ? "متصل" : "دون اتصال");
      }),
    [],
  );

  useEffect(() => {
    if (!mobileLayout) setMobileMenuOpen(false);
  }, [mobileLayout]);

  const menu = useMemo(() => {
    const items = [
      { key: "dashboard", title: "لوحة التحكم", icon: <DashboardOutlinedIcon /> },
      { key: "sites", title: "المواقع", icon: <LocationCityOutlinedIcon /> },
      { key: "projects", title: "المشاريع", icon: <ApartmentOutlinedIcon /> },
      { key: "assets", title: "الأصول", icon: <Inventory2OutlinedIcon /> },
      { key: "gates", title: "البوابات", icon: <DoorFrontOutlinedIcon /> },
      { key: "employees", title: "الموظفون", icon: <BadgeOutlinedIcon /> },
      { key: "warehouses", title: "المستودعات", icon: <StoreOutlinedIcon /> },
      { key: "maintenance", title: "البلاغات", icon: <FactCheckOutlinedIcon /> },
      { key: "reports", title: "التقارير", icon: <DescriptionOutlinedIcon /> },
      { key: "settings", title: "الإعدادات", icon: <SettingsOutlinedIcon />, adminOnly: true },
    ];
    return items.filter((item) => !item.adminOnly || profile?.role === "system_admin");
  }, [profile?.role]);

  const openAssetProfile = (asset: Building) => {
    setSelectedAsset(asset);
    navigate("asset-profile");
  };

  const closeAssetProfile = () => {
    setSelectedAsset(null);
    navigate("assets");
  };

  const selectPage = (key: string) => {
    setSelectedAsset(null);
    navigate(key);
    setMobileMenuOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case "sites": return <SitesPage />;
      case "projects": return <ProjectsPage />;
      case "assets": return <Buildings onOpenAsset={openAssetProfile} />;
      case "asset-profile": return selectedAsset ? <AssetProfile asset={selectedAsset} onBack={closeAssetProfile} /> : <Buildings onOpenAsset={openAssetProfile} />;
      case "gates": return <Gates />;
      case "employees": return <Employees />;
      case "warehouses": return <Warehouses />;
      case "maintenance": return <Maintenance />;
      case "reports": return <Reports />;
      case "settings": return profile?.role === "system_admin" ? <Settings /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
        <Box textAlign="center"><CircularProgress /><Typography color="text.secondary" sx={{ mt: 2 }}>جارٍ تهيئة بيئة ACP الآمنة…</Typography></Box>
      </Box>
    );
  }

  if (configured && (!session || !profile)) return <LoginPage />;

  const navigationList = (
    <List sx={{ direction: "rtl", px: 1.25, py: 1.5 }}>
      {menu.map((item) => {
        const selected = page === item.key || (item.key === "assets" && page === "asset-profile");
        return (
          <ListItemButton
            key={item.key}
            selected={selected}
            onClick={() => selectPage(item.key)}
            sx={{
              textAlign: "right",
              borderRadius: 2,
              mb: 0.5,
              minHeight: 46,
              "&.Mui-selected": {
                bgcolor: "rgba(201,162,39,.16)",
                color: "#071B34",
                borderInlineStart: "4px solid #C9A227",
                "&:hover": { bgcolor: "rgba(201,162,39,.20)" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: selected ? "#9A7A18" : "#506178" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} slotProps={{ primary: { fontWeight: selected ? 800 : 600 } }} />
          </ListItemButton>
        );
      })}
    </List>
  );

  const drawerHeader = (
    <Box sx={{ px: 2.25, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#FBFCFE" }}>
      <BrandMark />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25 }}>
        الإصدار {ACP.version} • {profile?.role === "system_admin" ? "مدير النظام" : "مستخدم معتمد"}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", direction: "rtl", width: "100%", minWidth: 0, minHeight: "100vh", overflowX: "clip" }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: "#071B34", zIndex: (value) => value.zIndex.drawer + 1, borderBottom: "3px solid #C9A227" }}>
        <Toolbar sx={{ gap: { xs: 0.75, sm: 1.5 }, minWidth: 0, overflow: "hidden" }}>
          <IconButton color="inherit" edge="start" aria-label="فتح القائمة" onClick={() => setMobileMenuOpen(true)} sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0 }}><MenuIcon /></IconButton>
          <Box sx={{ display: { xs: "none", sm: "block" }, flexGrow: 1, minWidth: 0 }}><BrandMark compact dark /></Box>
          <Typography sx={{ display: { xs: "block", sm: "none" }, flexGrow: 1, fontWeight: 900, whiteSpace: "nowrap" }}>ACP</Typography>
          <Chip size="small" label={demoMode ? "وضع تجريبي" : syncText} sx={{ display: { xs: "none", sm: "inline-flex" }, bgcolor: demoMode ? "#C9A227" : "rgba(255,255,255,.14)", color: demoMode ? "#071B34" : "white", flexShrink: 0 }} />
          <Typography variant="body2" sx={{ display: { xs: "none", lg: "block" }, whiteSpace: "nowrap", color: "rgba(255,255,255,.78)" }}>{profile?.full_name}</Typography>
          {!demoMode && <Button color="inherit" size="small" onClick={() => void signOut()} sx={{ whiteSpace: "nowrap", minWidth: 0, px: { xs: 0.75, sm: 1.5 } }}><Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>تسجيل&nbsp;</Box>الخروج</Button>}
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: "min(86vw, 310px)", boxSizing: "border-box", direction: "rtl" } }}>
        {drawerHeader}{navigationList}
      </Drawer>

      <Drawer variant="permanent" anchor="right" open sx={{ display: { xs: "none", md: "block" }, width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", top: 67, height: "calc(100% - 67px)", direction: "rtl", borderRight: 0, borderLeft: "1px solid #DCE3EC" } }}>
        {drawerHeader}{navigationList}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` }, mt: { xs: "59px", sm: "67px" }, bgcolor: "background.default", minHeight: { xs: "calc(100vh - 59px)", sm: "calc(100vh - 67px)" }, p: { xs: 1.5, sm: 2, md: 3 }, overflowX: "hidden" }}>
        {renderPage()}
      </Box>
    </Box>
  );
}
