import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import BrandMark from "../components/BrandMark";
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
        display: "grid",
        placeItems: "center",
        direction: "rtl",
        p: { xs: 2, sm: 4 },
        bgcolor: "#EEF3F8",
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(201,162,39,.16), transparent 28%), radial-gradient(circle at 15% 85%, rgba(11,49,91,.10), transparent 32%)",
      }}
    >
      <Paper
        component="form"
        onSubmit={submit}
        noValidate
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 470,
          p: { xs: 3, sm: 5 },
          border: "1px solid",
          borderColor: "divider",
          borderTop: "5px solid #C9A227",
          borderRadius: 4,
          boxShadow: "0 24px 64px rgba(7,27,52,.12)",
        }}
      >
        <BrandMark />

        <Typography variant="h4" sx={{ color: "primary.main", mt: 4 }}>
          تسجيل الدخول
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          ادخل إلى بيئة العمل المحمية لإدارة المشاريع والتشغيل والأصول.
        </Typography>

        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="البريد الإلكتروني"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fullWidth
          disabled={busy}
          sx={{ mb: 2 }}
        />
        <TextField
          label="كلمة المرور"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fullWidth
          disabled={busy}
          sx={{ mb: 3 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={busy}
          startIcon={!busy ? <ShieldOutlinedIcon /> : undefined}
          sx={{ minHeight: 50 }}
        >
          {busy ? <CircularProgress size={24} color="inherit" /> : "دخول آمن"}
        </Button>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 3 }}>
          <ShieldOutlinedIcon sx={{ fontSize: 17, color: "success.main" }} />
          <Typography variant="caption" color="text.secondary">
            اتصال مشفر وصلاحيات محكومة وسياسات وصول على مستوى الصفوف
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
