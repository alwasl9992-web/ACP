import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
} from "@mui/material";

import type { Building } from "../models/Building";

interface AssetProfileProps {
  asset: Building;
  onBack: () => void;
}

export default function AssetProfile({
  asset,
  onBack,
}: AssetProfileProps) {
  const statusColor =
    asset.status === "Running"
      ? "success"
      : asset.status === "Stopped"
        ? "error"
        : "warning";

  const criticalityColor =
    asset.criticality === "Critical"
      ? "error"
      : asset.criticality === "High"
        ? "warning"
        : asset.criticality === "Medium"
          ? "info"
          : "success";

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            ملف الأصل
          </Typography>

          <Typography color="text.secondary">
            {asset.code} — {asset.name}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={onBack}
        >
          العودة إلى سجل الأصول
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              رقم الأصل
            </Typography>

            <Typography fontWeight="bold">
              {asset.code}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              اسم الأصل
            </Typography>

            <Typography fontWeight="bold">
              {asset.name}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              نوع الأصل
            </Typography>

            <Typography>
              {asset.assetType}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الموقع
            </Typography>

            <Typography>
              {asset.location}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الحالة التشغيلية
            </Typography>

            <Chip
              size="small"
              color={statusColor}
              label={asset.status}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              مستوى الأهمية
            </Typography>

            <Chip
              size="small"
              color={criticalityColor}
              label={asset.criticality}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الشركة المصنعة
            </Typography>

            <Typography>
              {asset.manufacturer}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الموديل
            </Typography>

            <Typography>
              {asset.model}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الرقم التسلسلي
            </Typography>

            <Typography>
              {asset.serialNumber}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              رمز QR
            </Typography>

            <Typography>
              {asset.qrCode}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              تاريخ التركيب
            </Typography>

            <Typography>
              {asset.installDate}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              انتهاء الضمان
            </Typography>

            <Typography>
              {asset.warrantyExpiry}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              الوصف
            </Typography>

            <Typography>
              {asset.description}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight="bold">
          وحدات الأصل
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          ستتم إضافة أوامر العمل والصيانة الوقائية
          والبلاغات والمستندات والصور وسجل الأصل في
          المرحلة التالية.
        </Typography>
      </Paper>
    </Box>
  );
}