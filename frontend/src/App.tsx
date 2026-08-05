import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
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

import ACP from "./config/acp.config";

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

const drawerWidth = 260;

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
        if (result.failed > 0) {
          setSyncText(`تعذر مزامنة ${result.failed}`);
        } else if (result.remaining > 0) {
          setSyncText(`بانتظار المزامنة: ${result.remaining}`);
        } else if (result.applied > 0) {
          setSyncText(`تمت مزامنة ${result.applied}`);
        } else {
          setSyncText(navigator.onLine ? "متصل" : "دون اتصال");
        }
      }),
    [],
  );

  useEffect(() => {
    if (!mobileLayout) setMobileMenuOpen(false);
  }, [mobileLayout]);

  const menu = useMemo(() => {
    const items = [
      { key: "dashboard", title: "لوحة التحكم" },
      { key: "sites", title: "المواقع" },
      { key: "projects", title: "المشاريع" },
      { key: "assets", title: "الأصول" },
      { key: "gates", title: "البوابات" },
      { key: "employees", title: "الموظفون" },
      { key: "warehouses", title: "المستودعات" },
      { key: "maintenance", title: "البلاغات" },
      { key: "reports", title: "التقارير" },
      { key: "settings", title: "الإعدادات", adminOnly: true },
    ];
    return items.filter(
      (item) => !item.adminOnly || profile?.role === "system_admin",
    );
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
      case "sites":
        return <SitesPage />;
      case "projects":
        return <ProjectsPage />;
      case "assets":
        return <Buildings onOpenAsset={openAssetProfile} />;
      case "asset-profile":
        return selectedAsset ? (
          <AssetProfile asset={selectedAsset} onBack={closeAssetProfile} />
        ) : (
          <Buildings onOpenAsset={openAssetProfile} />
        );
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
        return profile?.role === "system_admin" ? <Settings /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (configured && (!session || !profile)) {
    return <LoginPage />;
  }

  const navigationList = (
    <List sx={{ direction: "rtl", pt: 0.5 }}>
      {menu.map((item) => (
        <ListItemButton
          key={item.key}
          selected={
            page === item.key ||
            (item.key === "assets" && page === "asset-profile")
          }
          onClick={() => selectPage(item.key)}
          sx={{ textAlign: "right" }}
        >
          <ListItemText primary={item.title} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box
      sx={{
        display: "flex",
        direction: "rtl",
        width: "100%",
        minWidth: 0,
        minHeight: "100vh",
        overflowX: "clip",
      }}
    >
      <AppBar
        position="fixed"
        sx={{ bgcolor: "#071b34", zIndex: (value) => value.zIndex.drawer + 1 }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.75, sm: 1.5 },
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            aria-label="فتح القائمة"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
              minWidth: 0,
              fontSize: { xs: "0.95rem", sm: "1.25rem" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ACP.name} v{ACP.version}
          </Typography>
          <Chip
            size="small"
            label={demoMode ? "وضع تجريبي" : syncText}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              bgcolor: demoMode ? "#c9a227" : "#e6edf6",
              color: "#071b34",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{ display: { xs: "none", md: "block" }, whiteSpace: "nowrap" }}
          >
            {profile?.full_name}
          </Typography>
          {!demoMode && (
            <Button
              color="inherit"
              size="small"
              onClick={() => void signOut()}
              sx={{ whiteSpace: "nowrap", minWidth: 0, px: { xs: 0.75, sm: 1.5 } }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                تسجيل&nbsp;
              </Box>
              الخروج
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: "min(82vw, 300px)",
            boxSizing: "border-box",
            direction: "rtl",
          },
        }}
      >
        <Box
          sx={{
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            px: 2,
            bgcolor: "#071b34",
            color: "white",
            fontWeight: 800,
          }}
        >
          قائمة ACP
        </Box>
        {navigationList}
      </Drawer>

      <Drawer
        variant="permanent"
        anchor="right"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            top: 64,
            height: "calc(100% - 64px)",
            direction: "rtl",
            borderRight: 0,
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {navigationList}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: "56px", sm: "64px" },
          bgcolor: "#f5f7fa",
          minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          p: { xs: 1.5, sm: 2, md: 3 },
          overflowX: "hidden",
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}
