import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useProject } from "../context/ProjectContext";
import AssetService from "../services/AssetService";

type StatusFilter = "all" | "Running" | "Completed";

const statusLabel = {
  Running: "قيد التشغيل",
  Completed: "مكتمل",
} as const;

export default function Assets() {
  const { selectedProject } = useProject();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const assets = selectedProject
    ? AssetService.getAssetsByProject(selectedProject.id)
    : [];

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ar");

    return assets.filter((asset) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        asset.name.toLocaleLowerCase("ar").includes(normalizedSearch) ||
        asset.code.toLocaleLowerCase("en").includes(normalizedSearch) ||
        asset.description.toLocaleLowerCase("ar").includes(normalizedSearch);

      const matchesStatus = status === "all" || asset.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, status]);

  if (!selectedProject) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">
          الرجاء اختيار مشروع أولاً من صفحة المشاريع.
        </Alert>
      </Box>
    );
  }

  const runningCount = assets.filter((asset) => asset.status === "Running").length;
  const completedCount = assets.filter(
    (asset) => asset.status === "Completed",
  ).length;

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
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Typography variant="h4">إدارة الأصول</Typography>
        <Button variant="contained">إضافة أصل</Button>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Chip label={`إجمالي الأصول: ${assets.length}`} variant="outlined" />
        <Chip label={`قيد التشغيل: ${runningCount}`} color="success" variant="outlined" />
        <Chip label={`مكتمل: ${completedCount}`} color="info" variant="outlined" />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="البحث في الأصول"
            placeholder="اسم الأصل أو الكود أو الوصف"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="asset-status-filter-label">الحالة</InputLabel>
            <Select
              labelId="asset-status-filter-label"
              label="الحالة"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
            >
              <MenuItem value="all">جميع الحالات</MenuItem>
              <MenuItem value="Running">قيد التشغيل</MenuItem>
              <MenuItem value="Completed">مكتمل</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {assets.length === 0 ? (
        <Alert severity="warning">لا توجد أصول مرتبطة بهذا المشروع.</Alert>
      ) : filteredAssets.length === 0 ? (
        <Alert severity="info">لا توجد نتائج مطابقة لمعايير البحث.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAssets.map((asset) => (
            <Grid key={asset.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  transition: ".2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="h6">{asset.name}</Typography>
                    <Chip
                      size="small"
                      label={statusLabel[asset.status]}
                      color={asset.status === "Running" ? "success" : "info"}
                    />
                  </Box>

                  <Typography sx={{ mt: 2 }}>الكود: {asset.code}</Typography>
                  <Typography>الوصف: {asset.description}</Typography>
                  <Typography>الطوابق: {asset.floors}</Typography>
                  <Typography>البوابات: {asset.gates}</Typography>

                  <Button sx={{ mt: 2 }} fullWidth variant="outlined">
                    فتح الأصل
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
