import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

interface SystemSettings {
  organizationName: string;
  timezone: string;
  language: string;
  reportPrefix: string;
  autoBackup: boolean;
  notifications: boolean;
  auditLog: boolean;
  offlineMode: boolean;
}

const initialSettings: SystemSettings = {
  organizationName: "ACP Enterprise",
  timezone: "Asia/Riyadh",
  language: "ar",
  reportPrefix: "ACP",
  autoBackup: true,
  notifications: true,
  auditLog: true,
  offlineMode: false,
};

export default function Settings() {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem("acp-system-settings", JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <Box dir="rtl">
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          إعدادات النظام
        </Typography>
        <Typography color="text.secondary">
          إدارة بيانات المنشأة والتقارير والتنبيهات والحماية والنسخ الاحتياطي.
        </Typography>
      </Stack>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم حفظ الإعدادات بنجاح على هذا الجهاز.
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            الإعدادات العامة
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="اسم المنشأة"
              value={settings.organizationName}
              onChange={(event) => update("organizationName", event.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label="المنطقة الزمنية"
                value={settings.timezone}
                onChange={(event) => update("timezone", event.target.value)}
                fullWidth
              >
                <MenuItem value="Asia/Riyadh">الرياض</MenuItem>
                <MenuItem value="Asia/Dubai">دبي</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </TextField>
              <TextField
                select
                label="لغة النظام"
                value={settings.language}
                onChange={(event) => update("language", event.target.value)}
                fullWidth
              >
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="بادئة أرقام التقارير"
              value={settings.reportPrefix}
              onChange={(event) => update("reportPrefix", event.target.value.toUpperCase())}
              helperText="مثال: ACP-2026-0001"
              fullWidth
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            التشغيل والحماية
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoBackup}
                  onChange={(event) => update("autoBackup", event.target.checked)}
                />
              }
              label="النسخ الاحتياطي التلقائي"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(event) => update("notifications", event.target.checked)}
                />
              }
              label="تنبيهات البلاغات والمهام"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.auditLog}
                  onChange={(event) => update("auditLog", event.target.checked)}
                />
              }
              label="سجل التدقيق والحركات"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.offlineMode}
                  onChange={(event) => update("offlineMode", event.target.checked)}
                />
              }
              label="الوضع دون اتصال"
            />
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-start" spacing={2}>
          <Button variant="contained" size="large" onClick={saveSettings}>
            حفظ الإعدادات
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setSettings(initialSettings);
              setSaved(false);
            }}
          >
            استعادة الافتراضي
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
