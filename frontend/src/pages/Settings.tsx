import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useAuth } from "../auth/AuthContext";
import { runtimeConfig } from "../config/runtime";
import { supabaseRequest } from "../lib/supabaseHttp";
import {
  createRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";
import type { AppRole, PlatformProfile } from "../types/platform";

interface SystemSettings {
  organizationName: string;
  timezone: string;
  language: "ar" | "en";
  reportPrefix: string;
  autoBackup: boolean;
  notifications: boolean;
  auditLog: boolean;
  offlineMode: boolean;
}

interface CloudSystemSettings {
  id: string;
  organization_name: string;
  timezone: string;
  language: "ar" | "en";
  report_prefix: string;
  auto_backup: boolean;
  notifications: boolean;
  audit_log: boolean;
  offline_mode: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface InviteDraft {
  email: string;
  fullName: string;
  role: AppRole;
}

const SETTINGS_KEY = "acp-system-settings";

const initialSettings: SystemSettings = {
  organizationName: "ACP Enterprise",
  timezone: "Asia/Riyadh",
  language: "ar",
  reportPrefix: "ACP",
  autoBackup: true,
  notifications: true,
  auditLog: true,
  offlineMode: true,
};

const roleLabel: Record<AppRole, string> = {
  system_admin: "مدير النظام",
  project_manager: "مدير مشروع",
  supervisor: "مشرف",
  employee: "موظف",
  reader: "قارئ فقط",
};

function fromCloud(value: CloudSystemSettings): SystemSettings {
  return {
    organizationName: value.organization_name,
    timezone: value.timezone,
    language: value.language,
    reportPrefix: value.report_prefix,
    autoBackup: value.auto_backup,
    notifications: value.notifications,
    auditLog: value.audit_log,
    offlineMode: value.offline_mode,
  };
}

export default function Settings() {
  const { profile, demoMode, reloadProfile } = useAuth();
  const [settings, setSettings] = useState(initialSettings);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
  const [invite, setInvite] = useState<InviteDraft>({
    email: "",
    fullName: "",
    role: "employee",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (demoMode) {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) setSettings(JSON.parse(stored) as SystemSettings);
        setProfiles(profile ? [profile] : []);
        return;
      }

      const [settingRows, profileRows] = await Promise.all([
        listRecords<CloudSystemSettings>("system_settings", { limit: 1 }),
        listRecords<PlatformProfile>("profiles", { order: "created_at.desc" }),
      ]);
      const first = settingRows[0];
      if (first) {
        setSettingsId(first.id);
        setSettings(fromCloud(first));
      }
      setProfiles(profileRows);
    } catch (reason) {
      setMessage({
        severity: "error",
        text:
          reason instanceof Error
            ? reason.message
            : "تعذر تحميل إعدادات النظام.",
      });
    } finally {
      setLoading(false);
    }
  }, [demoMode, profile]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const update = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) => {
    setMessage(null);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (demoMode) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } else {
        const timestamp = new Date().toISOString();
        const payload = {
          organization_name: settings.organizationName.trim(),
          timezone: settings.timezone,
          language: settings.language,
          report_prefix: settings.reportPrefix.trim().toUpperCase(),
          auto_backup: settings.autoBackup,
          notifications: settings.notifications,
          audit_log: settings.auditLog,
          offline_mode: settings.offlineMode,
          updated_by: profile?.id ?? null,
          updated_at: timestamp,
        };

        if (settingsId) {
          await updateRecord<CloudSystemSettings>(
            "system_settings",
            settingsId,
            payload,
          );
        } else {
          const created = await createRecord<CloudSystemSettings>(
            "system_settings",
            {
              ...payload,
              created_at: timestamp,
            },
          );
          setSettingsId(created.id);
        }
      }
      setMessage({
        severity: "success",
        text: "تم حفظ إعدادات النظام بنجاح.",
      });
    } catch (reason) {
      setMessage({
        severity: "error",
        text: reason instanceof Error ? reason.message : "تعذر حفظ الإعدادات.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (
    user: PlatformProfile,
    changes: Partial<Pick<PlatformProfile, "role" | "is_active">>,
  ) => {
    setMessage(null);
    try {
      if (demoMode) {
        setProfiles((current) =>
          current.map((item) =>
            item.id === user.id ? { ...item, ...changes } : item,
          ),
        );
        return;
      }

      await updateRecord<PlatformProfile>("profiles", user.id, {
        ...changes,
        updated_at: new Date().toISOString(),
      });
      await loadSettings();
      if (user.id === profile?.id) await reloadProfile();
      setMessage({
        severity: "success",
        text: `تم تحديث صلاحيات ${user.full_name}.`,
      });
    } catch (reason) {
      setMessage({
        severity: "error",
        text:
          reason instanceof Error
            ? reason.message
            : "تعذر تحديث المستخدم.",
      });
    }
  };

  const inviteUser = async () => {
    if (!invite.email.trim() || !invite.fullName.trim()) {
      setMessage({
        severity: "error",
        text: "اسم المستخدم والبريد الإلكتروني مطلوبان.",
      });
      return;
    }

    setInviting(true);
    setMessage(null);
    try {
      if (demoMode) {
        const timestamp = new Date().toISOString();
        setProfiles((current) => [
          {
            id: crypto.randomUUID(),
            full_name: invite.fullName.trim(),
            employee_no: null,
            phone: null,
            role: invite.role,
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
          },
          ...current,
        ]);
      } else {
        await supabaseRequest<{ invited: boolean }>(
          "/functions/v1/invite-user",
          {
            method: "POST",
            body: JSON.stringify({
              email: invite.email.trim(),
              fullName: invite.fullName.trim(),
              role: invite.role,
              redirectTo: runtimeConfig.appUrl,
            }),
          },
        );
        await loadSettings();
      }
      setInvite({ email: "", fullName: "", role: "employee" });
      setMessage({
        severity: "success",
        text: "تم إرسال دعوة المستخدم وتسجيل صلاحياته.",
      });
    } catch (reason) {
      setMessage({
        severity: "error",
        text: reason instanceof Error ? reason.message : "تعذر إرسال الدعوة.",
      });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          إعدادات النظام
        </Typography>
        <Typography color="text.secondary">
          المنشأة والتقارير والمستخدمون والصلاحيات والحماية.
        </Typography>
      </Stack>

      {message && (
        <Alert severity={message.severity} sx={{ mb: 2 }}>
          {message.text}
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
              onChange={(event) =>
                update("organizationName", event.target.value)
              }
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
                onChange={(event) =>
                  update("language", event.target.value as "ar" | "en")
                }
                fullWidth
              >
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="بادئة أرقام التقارير"
              value={settings.reportPrefix}
              onChange={(event) =>
                update("reportPrefix", event.target.value.toUpperCase())
              }
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
                  onChange={(event) =>
                    update("autoBackup", event.target.checked)
                  }
                />
              }
              label="النسخ الاحتياطي التلقائي"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(event) =>
                    update("notifications", event.target.checked)
                  }
                />
              }
              label="تنبيهات البلاغات والمهام"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.auditLog}
                  onChange={(event) =>
                    update("auditLog", event.target.checked)
                  }
                />
              }
              label="سجل التدقيق والحركات"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.offlineMode}
                  onChange={(event) =>
                    update("offlineMode", event.target.checked)
                  }
                />
              }
              label="الوضع دون اتصال والمزامنة"
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            دعوة مستخدم جديد
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            ترسل الدعوة من بيئة Supabase الآمنة ولا تُكشف مفاتيح الإدارة
            للمتصفح.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="الاسم الكامل"
              value={invite.fullName}
              onChange={(event) =>
                setInvite({ ...invite, fullName: event.target.value })
              }
            />
            <TextField
              fullWidth
              type="email"
              label="البريد الإلكتروني"
              value={invite.email}
              onChange={(event) =>
                setInvite({ ...invite, email: event.target.value })
              }
            />
            <TextField
              select
              fullWidth
              label="الدور"
              value={invite.role}
              onChange={(event) =>
                setInvite({ ...invite, role: event.target.value as AppRole })
              }
            >
              {Object.entries(roleLabel).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => void inviteUser()}
              disabled={inviting}
              sx={{ minWidth: 140 }}
            >
              {inviting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "إرسال دعوة"
              )}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            المستخدمون والصلاحيات
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            {profiles.map((user) => (
              <Stack
                key={user.id}
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>{user.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.employee_no ?? user.id}
                  </Typography>
                </Box>
                <TextField
                  select
                  size="small"
                  label="الدور"
                  value={user.role}
                  onChange={(event) =>
                    void updateUser(user, {
                      role: event.target.value as AppRole,
                    })
                  }
                  disabled={user.id === profile?.id}
                  sx={{ minWidth: 170 }}
                >
                  {Object.entries(roleLabel).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.is_active}
                      onChange={(event) =>
                        void updateUser(user, {
                          is_active: event.target.checked,
                        })
                      }
                      disabled={user.id === profile?.id}
                    />
                  }
                  label={user.is_active ? "نشط" : "موقوف"}
                />
              </Stack>
            ))}
            {profiles.length === 0 && (
              <Typography color="text.secondary">
                لا توجد حسابات مسجلة.
              </Typography>
            )}
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => void saveSettings()}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "حفظ الإعدادات"
            )}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setSettings(initialSettings)}
          >
            استعادة الافتراضي
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
