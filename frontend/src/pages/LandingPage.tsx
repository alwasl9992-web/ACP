import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

const brand = {
  navy: "#0d223d",
  deep: "#071426",
  gold: "#d4af37",
  softGold: "#f5e8bf",
};

const pillars = [
  {
    icon: BusinessRoundedIcon,
    title: "Asset",
    body: "توحيد الأصول والمواقع والمباني والبوابات في سجل تشغيلي واحد قابل للقياس.",
  },
  {
    icon: HubRoundedIcon,
    title: "Connect",
    body: "ربط الفرق والمقاولين والبلاغات والبيانات داخل منصة مؤسسية واحدة.",
  },
  {
    icon: SecurityRoundedIcon,
    title: "Protect",
    body: "حوكمة الوصول، توثيق العمليات، وتقليل الفوضى التشغيلية قبل أن تتحول إلى تكلفة.",
  },
];

const sectors = ["المرافق", "العقار", "الصناعة", "المشاريع الحكومية", "الأمن والتشغيل", "إدارة المقاولين"];

export default function LandingPage() {
  return (
    <Box sx={{ direction: "rtl" }}>
      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: 5,
          color: "#fff",
          background: `radial-gradient(circle at top left, rgba(212,175,55,.22), transparent 32%), linear-gradient(135deg, ${brand.deep}, ${brand.navy})`,
          border: "1px solid rgba(212,175,55,.22)",
        }}
      >
        <Box sx={{ p: { xs: 3, md: 6 } }}>
          <Stack spacing={3} maxWidth={960}>
            <Chip
              label="ACP Enterprise · Asset • Connect • Protect"
              sx={{ width: "fit-content", bgcolor: "rgba(212,175,55,.16)", color: brand.softGold, fontWeight: 900 }}
            />
            <Typography variant="h2" sx={{ fontWeight: 950, fontSize: { xs: 38, md: 68 }, lineHeight: 1.05 }}>
              منصة مؤسسية لإدارة الأصول والمرافق والتشغيل بوضوح تنفيذي.
            </Typography>
            <Typography variant="h6" sx={{ color: "#c8d4e3", maxWidth: 760, lineHeight: 1.9 }}>
              ACP Enterprise تمنح الجهات المالكة والمشغلة لوحة موحدة للأصول، المشاريع، البوابات، البلاغات، الفرق، ونسب الإنجاز؛ حتى تتحول البيانات اليومية إلى قرارات قابلة للتنفيذ.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button size="large" variant="contained" sx={{ bgcolor: brand.gold, color: brand.deep, fontWeight: 900, px: 4 }}>
                طلب عرض توضيحي
              </Button>
              <Button size="large" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,.38)", px: 4 }}>
                مشاهدة نسخة الديمو
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2.5} sx={{ mt: 3 }}>
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <Grid item xs={12} md={4} key={item.title}>
              <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e4e9f0" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ width: 54, height: 54, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "#fff7dc", color: brand.navy }}>
                      <Icon />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>{item.title}</Typography>
                    <Typography sx={{ color: "#607083", lineHeight: 1.9 }}>{item.body}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e4e9f0", height: "100%" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <InsightsRoundedIcon sx={{ color: brand.gold }} />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>ما الذي يراه العميل في الديمو؟</Typography>
              </Stack>
              {[
                "لوحة تنفيذية بمؤشرات الأصول والمشاريع والإنجاز.",
                "بيانات واقعية لعدة قطاعات ومدن سعودية.",
                "رحلة تشغيل واضحة من المشروع إلى الأصل إلى البلاغ والتقرير.",
                "هوية موحدة تصلح للاجتماعات، العروض، والمستثمرين.",
              ].map((item) => (
                <Box key={item} sx={{ display: "flex", gap: 1.5, py: 1.2 }}>
                  <VerifiedRoundedIcon sx={{ color: "#18794e" }} />
                  <Typography>{item}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e4e9f0", height: "100%" }}>
            <CardContent sx={{ p: 3.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <RocketLaunchRoundedIcon sx={{ color: brand.gold }} />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>القطاعات المستهدفة</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {sectors.map((sector) => (
                  <Chip key={sector} label={sector} sx={{ bgcolor: "#edf2f7", fontWeight: 800 }} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
