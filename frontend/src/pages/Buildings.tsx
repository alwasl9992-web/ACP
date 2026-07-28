import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
} from "@mui/material";

import BuildingService from "../services/BuildingService";
import { useProject } from "../context/ProjectContext";

export default function Buildings() {
  const { selectedProject } = useProject();

  if (!selectedProject) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">
          الرجاء اختيار مشروع أولاً من صفحة المشاريع.
        </Alert>
      </Box>
    );
  }

  const assets = BuildingService.getBuildingsByProject(selectedProject.id);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        المشروع الحالي
      </Typography>

      <Typography color="primary" sx={{ mb: 4 }}>
        {selectedProject.name}
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Typography variant="h4">
          إدارة الأصول
        </Typography>

        <Button variant="contained">
          إضافة أصل
        </Button>
      </Box>

      <Grid container spacing={3}>
        {assets.map((asset) => (
          <Grid
            key={asset.id}
            size={{ xs: 12, md: 6, lg: 4 }}
          >
            <Card
              sx={{
                borderRadius: 3,
                transition: ".2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent>
                <Typography variant="h6">
                  {asset.name}
                </Typography>

                <Typography sx={{ mt: 2 }}>
                  الكود : {asset.code}
                </Typography>

                <Typography>
                  الوصف : {asset.description}
                </Typography>

                <Typography>
                  البوابات : {asset.gates}
                </Typography>

                <Typography>
                  الحالة : {asset.status}
                </Typography>

                <Button
                  sx={{ mt: 2 }}
                  fullWidth
                  variant="outlined"
                >
                  فتح الأصل
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}