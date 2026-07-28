import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
} from "@mui/material";

import ACP from "./config/acp.config";

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

export default function App() {
  const [page, setPage] = useState("dashboard");

  const menu = [
    { key: "dashboard", title: "لوحة التحكم" },
    { key: "sites", title: "المواقع" },
    { key: "projects", title: "المشاريع" },
    { key: "buildings", title: "المباني" },
    { key: "gates", title: "البوابات" },
    { key: "employees", title: "الموظفون" },
    { key: "warehouses", title: "المستودعات" },
    { key: "maintenance", title: "البلاغات" },
    { key: "reports", title: "التقارير" },
    { key: "settings", title: "الإعدادات" },
  ];

  const renderPage = () => {
    switch (page) {
      case "sites":
        return <SitesPage />;

      case "projects":
        return <ProjectsPage />;

      case "buildings":
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

  return (
    <Box sx={{ display: "flex", direction: "rtl" }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">
            {ACP.name} v{ACP.version}
          </Typography>
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
              selected={page === item.key}
              onClick={() => setPage(item.key)}
            >
              <ListItemText primary={item.title} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
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