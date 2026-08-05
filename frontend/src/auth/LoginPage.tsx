import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
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
        bgcolor: "#06172d",
        direction: "rtl",
        p: 3,
      }}
    >
      <Paper
        component="form"
        onSubmit={submit}
        noValidate
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 5 },
          borderTop: "5px solid #c9a227",
          borderRadius: 3,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "#9a7a18", fontWeight: 800, letterSpacing: 1 }}
        >
          ACP ENTERPRISE
        </Typography>
        <Typography variant="h4" sx={{ color: "#071b34", fontWeight: 800, mt: 1 }}>
          تسجيل الدخول
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          الدخول إلى منصة إدارة المشاريع والتشغيل والأصول
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
          sx={{
            minHeight: 48,
            bgcolor: "#071b34",
            "&:hover": { bgcolor: "#0b315b" },
          }}
        >
          {busy ? <CircularProgress size={24} color="inherit" /> : "دخول آمن"}
        </Button>
      </Paper>
    </Box>
  );
}
