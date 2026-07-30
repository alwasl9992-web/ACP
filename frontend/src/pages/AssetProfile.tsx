import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { Building } from "../models/Building";

interface AssetProfileProps {
  asset: Building;
  onBack: () => void;
}

const statusLabel = {
  Running: "يعمل",
  Stopped: "متوقف",
  Maintenance: "تحت الصيانة",
} as const;

const criticalityLabel = {
  Critical: "حرج",
  High: "مرتفع",
  Medium: "متوسط",
  Low: "منخفض",
} as const;

const assetTypeLabel: Record<string, string> = {
  Building: "مبنى",
  Warehouse: "مستودع",
};

const modules = [
  {
    title: "أوامر العمل",
    description: "متابعة المهام والإصلاحات المرتبطة بالأصل.",
  },
  {
    title: "الصيانة الوقائية",
    description: "جدولة الصيانة الدورية والتنبيه قبل الاستحقاق.",
  },
  {
    title: "البلاغات",
    description: "ربط البلاغات التشغيلية وسجل المعالجة بالأصل.",
  },
  {
    title: "المستندات والصور",
    description: "حفظ الضمانات والمخططات والفواتير والصور.",
  },
  {
    title: "السجل الزمني",
    description: "توثيق جميع التغييرات والأحداث على الأصل.",
  },
  {
    title: "رمز QR",
    description: "فتح ملف الأصل ميدانيًا عبر المسح المباشر.",
  },
];

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600} sx={{ mt: 0.5, wordBreak: "break-word" }}>
        {value || "غير مسجل"}
      </Typography>
    </Box>
  );
}

export default function AssetProfile({ asset, onBack }: AssetProfileProps) {
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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            ملف الأصل
          </Typography>
          <Typography color="text.secondary">
            {asset.code} — {asset.name}
          </Typography>
        </Box>

        <Button variant="outlined" onClick={onBack}>
          العودة إلى سجل الأصول
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        هذا الملف هو المرجع التشغيلي الموحد للأصل، وسيجمع الصيانة والبلاغات
        والمستندات والسجل الزمني في مكان واحد.
      </Alert>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {asset.name}
            </Typography>
            <Typography color="text.secondary">
              {assetTypeLabel[asset.assetType] ?? asset.assetType} • {asset.location}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              color={statusColor}
              label={statusLabel[asset.status] ?? asset.status}
            />
            <Chip
              color={criticalityColor}
              label={`الأهمية: ${criticalityLabel[asset.criticality] ?? asset.criticality}`}
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="رقم الأصل" value={asset.code} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem
              label="نوع الأصل"
              value={assetTypeLabel[asset.assetType] ?? asset.assetType}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الموقع" value={asset.location} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الشركة المصنعة" value={asset.manufacturer} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الموديل" value={asset.model} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="الرقم التسلسلي" value={asset.serialNumber} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="رمز QR" value={asset.qrCode} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="تاريخ التركيب" value={asset.installDate} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DetailItem label="انتهاء الضمان" value={asset.warrantyExpiry} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DetailItem label="الوصف" value={asset.description} />
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        وحدات الأصل
      </Typography>

      <Grid container spacing={2}>
        {modules.map((module) => (
          <Grid key={module.title} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: 3,
                transition: "transform .2s ease, box-shadow .2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {module.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {module.description}
              </Typography>
              <Button size="small" disabled>
                قريبًا
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
