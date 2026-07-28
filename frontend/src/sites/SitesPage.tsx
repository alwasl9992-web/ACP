import { Box, Typography, Button } from "@mui/material";

export default function SitesPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h4">
          إدارة المواقع
        </Typography>

        <Button variant="contained">
          إضافة موقع
        </Button>
      </Box>

      <Typography color="text.secondary">
        لا توجد مواقع مسجلة حالياً.
      </Typography>
    </Box>
  );
}