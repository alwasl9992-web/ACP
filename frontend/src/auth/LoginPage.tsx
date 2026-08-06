import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import BrandMark from "../components/BrandMark";
import { acpColors } from "../theme/acpTheme";
import { useAuth } from "./AuthContext";

function loginErrorMessage(reason: unknown): string {
  if (!(reason instanceof Error)) {
    return "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.";
  }

  const message = reason.message.toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (message.includes("email not confirmed")) {
    return "البريد الإلكتروني غير مؤكد. افتح رسالة التفعيل ثم حاول مرة أخرى.";
  }
  if (
    message.includes("invalid api key") ||
    message.includes("no api key") ||
    message.includes("apikey") ||
    message.includes("project not found")
  ) {
    return "إعداد اتصال ACP بالخدمة السحابية غير صحيح. تم منع تسجيل الدخول لحماية الحساب.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "تعذر الاتصال بخدمة ACP. تحقق من الإنترنت ثم أعد المحاولة.";
  }
  if (message.includes("غير مفعل") || message.includes("صلاحيات")) {
    return reason.message;
  }

  return "لم يكتمل تسجيل الدخول. لم تُمسح بياناتك، ويمكنك المحاولة مرة أخرى.";
}

const valuePillars = [
  {
    icon: <ApartmentOutlinedIcon />,
    title: "تشغيل موحد",
    description: "المشاريع والمواقع والأصول في مساحة عمل واحدة.",
  },
  {
    icon: <InsightsOutlinedIcon />,
    title: "رؤية تنفيذية",
    description: "مؤشرات مباشرة تساعد على اتخاذ القرار بسرعة.",
  },
  {
    icon: <ShieldOutlinedIcon />,
    title: "حوكمة دقيقة",
    description: "صلاحيات وسجلات تدقيق وعزل بيانات على مستوى الصفوف.",
  },
];

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = loading || submitting;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(normalizedEmail, password);
    } catch (reason) {
      setError(loginErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "rtl",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 3, lg: 4 },
        bgcolor: acpColors.canvasWarm,
        backgroundImage:
          "radial-gradient(circle at 90% 8%, rgba(181,138,43,.12), transparent 22%), radial-gradient(circle at 4% 92%, rgba(25,72,111,.09), transparent 26%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1180,
          minHeight: { md: 700 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.08fr .92fr" },
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 32px 90px rgba(13,39,66,.14)",
          borderRadius: { xs: 4, md: 5 },
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            p: { md: 6, lg: 8 },
            color: "common.white",
            bgcolor: acpColors.navy,
            backgroundImage:
              "radial-gradient(circle at 88% 12%, rgba(181,138,43,.24), transparent 24%), radial-gradient(circle at 12% 86%, rgba(255,255,255,.10), transparent 28%)",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.10)",
              insetInlineEnd: -150,
              top: 120,
              boxShadow:
                "0 0 0 42px rgba(255,255,255,.025), 0 0 0 84px rgba(255,255,255,.018)",
            }}
          />

          <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(181,138,43,.18)",
                  border: "1px solid rgba(246,239,217,.28)",
                  color: acpColors.goldSoft,
                }}
              >
                <AutoAwesomeOutlinedIcon />
              </Box>
              <Typography variant="overline" sx={{ color: acpColors.goldSoft }}>
                ACP ENTERPRISE
              </Typography>
            </Stack>

            <Typography variant="h2" sx={{ maxWidth: 590, fontSize: { md: 45, lg: 54 } }}>
              إدارة أكثر وضوحًا.
              <Box component="span" sx={{ display: "block", color: acpColors.goldSoft }}>
                تشغيل أكثر سيطرة.
              </Box>
            </Typography>
            <Typography sx={{ maxWidth: 560, color: "rgba(255,255,255,.72)", fontSize: 18 }}>
              منصة تنفيذية تجمع المشاريع والمواقع والأصول والتقارير في تجربة موحدة مصممة للسرعة والحوكمة.
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            {valuePillars.map((pillar) => (
              <Stack
                key={pillar.title}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,.055)",
                  border: "1px solid rgba(255,255,255,.09)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2.5,
                    bgcolor: "rgba(181,138,43,.16)",
                    color: acpColors.goldSoft,
                  }}
                >
                  {pillar.icon}
                </Box>
                <Box>
                  <Typography fontWeight={800}>{pillar.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>
                    {pillar.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={submit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 3, sm: 5, md: 6, lg: 8 },
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 4 }}>
            <BrandMark />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ color: "secondary.dark" }}>
              البوابة التنفيذية
            </Typography>
            <Typography variant="h3" sx={{ color: "primary.main", mt: 0.5 }}>
              تسجيل الدخول
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.25, maxWidth: 460 }}>
              ادخل إلى مساحة العمل المحمية لمتابعة المشاريع والتشغيل والأصول من مكان واحد.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" role="alert" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.25}>
            <TextField
              label="البريد الإلكتروني"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
              disabled={busy}
            />
            <TextField
              label="كلمة المرور"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              disabled={busy}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={busy}
              startIcon={!busy ? <ShieldOutlinedIcon /> : undefined}
              sx={{ minHeight: 52, mt: 0.5 }}
            >
              {busy ? <CircularProgress size={24} color="inherit" /> : "دخول آمن"}
            </Button>
          </Stack>

          <Divider sx={{ my: 3.5 }} />

          <Stack direction="row" spacing={1.2} alignItems="flex-start">
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                bgcolor: "rgba(21,115,71,.08)",
                color: "success.main",
                flexShrink: 0,
              }}
            >
              <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={800}>
                وصول محكوم وآمن
              </Typography>
              <Typography variant="caption" color="text.secondary">
                اتصال مشفر، صلاحيات حسب الدور، وسياسات وصول على مستوى الصفوف.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
