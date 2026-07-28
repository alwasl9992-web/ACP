import { Outlet } from "react-router-dom";
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

const drawerWidth = 250;

const menu = [
  "لوحة التحكم",
  "المشاريع",
  "المباني",
  "الطوابق",
  "البوابات",
  "الأصول",
  "الصيانة",
  "الموظفون",
  "التقارير",
];

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", direction: "rtl" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          background: "#0B3D91",
        }}
      >
        <Toolbar>
          <Typography variant="h6">
            ACP Enterprise
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            top: 64,
          },
        }}
      >
        <List>
          {menu.map((item) => (
            <ListItemButton key={item}>
              <ListItemText primary={item} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          mr: `${drawerWidth}px`,
          background: "#f5f7fa",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}