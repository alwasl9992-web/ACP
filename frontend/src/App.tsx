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
} from "@mui/material";

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

export default function App() {
  const { page, navigate } = useNavigation();
  const { profile, session, loading, configured, demoMode, signOut } = useAuth();
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

  return (
    <Box sx={{ display: "flex", direction: "rtl" }}>
      <AppBar position="fixed" sx={{ bgcolor: "#071b34" }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
            {ACP.name} v{ACP.version}
          </Typography>
          <Chip
            size="small"
            label={demoMode ? "وضع تجريبي" : syncText}
            sx={{ bgcolor: demoMode ? "#c9a227" : "#e6edf6", color: "#071b34" }}
          />
          <Typography variant="body2">{profile?.full_name}</Typography>
          {!demoMode && (
            <Button color="inherit" size="small" onClick={() => void signOut()}>
              تسجيل الخروج
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: 260,
          "& .MuiDrawer-paper": {
            width: 260,
            top: 64,
          },
        }}
      >
        <List>
          {menu.map((item) => (
            <ListItemButton
              key={item.key}
              selected={
                page === item.key ||
                (item.key === "assets" && page === "asset-profile")
              }
              onClick={() => {
                setSelectedAsset(null);
                navigate(item.key);
              }}
            >
              <ListItemText primary={item.title} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mr: "260px",
          mt: "64px",
          bgcolor: "#f5f7fa",
          minHeight: "100vh",
          p: 3,
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}
