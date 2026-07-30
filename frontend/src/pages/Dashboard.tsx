import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ACP from "../core/ACP";

export default function Dashboard() {
  const projects = ACP.getProjects();
  const stats = ACP.getStatistics();

  const indicators = [
    { label: "المشاريع", value: stats.totalProjects, icon: AccountTreeRoundedIcon, note: "المشاريع المسجلة" },
    { label: "الأصول", value: stats.totalBuildings, icon: ApartmentRoundedIcon, note: "المباني والأصول" },
    { label: "البوابات", value: stats.totalGates, icon: MeetingRoomRoundedIcon, note: "نقاط التشغيل" },
    { label: "الموظفون", value: stats.totalEmployees, icon: GroupsRoundedIcon, note: "القوى العاملة" },
    { label: "متوسط الإنجاز", value: `${stats.completion}%`, icon: TrendingUpRoundedIcon, note: "مؤشر الأداء العام" },
  ];

  return (
    <Stack spacing={3} sx={{ direction: "rtl" }}>
      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          position: "relative",
          borderRadius: 4,
          p: { xs: 2.5, md: 4 },
          color: "#fff",
          background: "linear-gradient(120deg, #0d223d 0%, #173b63 62%, #8a6a2f 160%)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            bgcolor: "rgba(215,184,109,.10)",
            left: -90,
            top: -130,
          }}
        />
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={3} sx={{ position: "relative" }}>
          <Box>
            <Chip
              icon={<AutoAwesomeRoundedIcon />}
              label="ACP Enterprise V1.0"
              size="small"
              sx={{ mb: 2, bgcolor: "rgba(215,184,109,.16)", color: "#f2d995", fontWeight: 800 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: 30, md: 44 }, maxWidth: 760 }}>
              قيادة التشغيل من شاشة واحدة
            </Typography>
            <Typography sx={{ mt: 1.5, color: "#c7d4e2", maxWidth: 680, lineHeight: 1.9 }}>
              منصة موحدة لإدارة المشاريع والأصول والمواقع والموظفين والبلاغات، مصممة للوضوح والرقابة وسرعة اتخاذ القرار.
            </Typography>
          </Box>

          <Stack spacing={1.2} sx={{ minWidth: { md: 260 }, alignSelf: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudDoneRoundedIcon sx={{ color: "#7fd3a7" }} />
              <Typography fontWeight={800}>النظام متاح وجاهز</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#aebfd1" }}>
              آخر حالة: البناء والفحص الآلي ناجحان
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 2 }}>
        {indicators.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} elevation={0} sx={{ borderRadius: 3.5, border: "1px solid #e3e9f1", bgcolor: "#fff" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" sx={{ color: "#6d7d90", fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, color: "#10243e", fontWeight: 900 }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "#eef3f9", color: "#8a6a2f" }}>
                    <Icon />
                  </Box>
                </Stack>
                <Typography variant="caption" sx={{ color: "#8795a6" }}>
                  {item.note}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ borderRadius: 3.5, p: { xs: 2, md: 3 }, border: "1px solid #e3e9f1" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={900} color="#10243e">
                المشاريع الحالية
              </Typography>
              <Typography variant="body2" color="#7a8999">
                متابعة الإنجاز والموقع التشغيلي
              </Typography>
            </Box>
            <Chip label={`${projects.length} مشاريع`} size="small" sx={{ fontWeight: 800 }} />
          </Stack>

          <Stack divider={<Divider flexItem />}>
            {projects.map((project) => (
              <Box key={project.id} sx={{ py: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography fontWeight={900} color="#17314f">
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="#7c8b9d">
                      {project.location}
                    </Typography>
                  </Box>
                  <Typography fontWeight={900} color="#8a6a2f">
                    {project.completion}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={project.completion}
                  sx={{
                    mt: 1.5,
                    height: 8,
                    borderRadius: 99,
                    bgcolor: "#edf1f6",
                    "& .MuiLinearProgress-bar": { bgcolor: "#b58b3d", borderRadius: 99 },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3.5, p: { xs: 2, md: 3 }, border: "1px solid #e3e9f1" }}>
          <Stack direction="row" spacing={1.2} alignItems="center" mb={2.5}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "#eaf7ef", color: "#18794e" }}>
              <ShieldRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} color="#10243e">
                جاهزية المنصة
              </Typography>
              <Typography variant="body2" color="#7a8999">
                الضوابط الأساسية للنسخة الأولى
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.4}>
            {["البناء والفحص الآلي", "الخصوصية أولًا", "سجل تدقيق قابل للتطوير", "العمل دون اتصال - مخطط", "الذكاء الاصطناعي - جاهزية تكامل"].map((label, index) => (
              <Stack key={label} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.4, borderRadius: 2.5, bgcolor: "#f7f9fc" }}>
                <Typography variant="body2" fontWeight={700} color="#34495f">
                  {label}
                </Typography>
                <Chip
                  label={index < 3 ? "جاهز" : "مرحلة لاحقة"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: index < 3 ? "#eaf7ef" : "#fff5df",
                    color: index < 3 ? "#18794e" : "#8a6a2f",
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}
