import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { can } from "../auth/authService";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "../context/NavigationContext";
import { useProject } from "../context/ProjectContext";
import type { Project } from "../models/Project";
import type { PlatformProject } from "../types/platform";
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from "../services/acpRepository";
import ProjectService from "../services/ProjectService";

interface ProjectDraft {
  name: string;
  client: string;
  location: string;
  startDate: string;
  endDate: string;
}

const emptyDraft: ProjectDraft = {
  name: "",
  client: "",
  location: "",
  startDate: "",
  endDate: "",
};

function platformToProject(project: PlatformProject): Project {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    client: project.client_name ?? "",
    location: project.city ?? "",
    status:
      project.status === "archived"
        ? "Completed"
        : project.status === "inactive"
          ? "Stopped"
          : "Running",
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
    manager: "",
    completion: 0,
    buildings: 0,
    gates: 0,
    assets: 0,
    employees: 0,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export default function ProjectsPage() {
  const { setSelectedProject } = useProject();
  const { navigate } = useNavigation();
  const { profile, demoMode } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = demoMode || can(profile?.role, "project.create");
  const canManage = demoMode || can(profile?.role, "project.manage");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setProjects(ProjectService.getProjects());
      } else {
        const records = await listRecords<PlatformProject>("projects", {
          order: "created_at.desc",
        });
        setProjects(records.map(platformToProject));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر تحميل المشاريع.");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const nextCode = useMemo(
    () => `ACP-${String(projects.length + 1).padStart(3, "0")}`,
    [projects.length],
  );

  const resetDialog = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(false);
  };

  const startCreate = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(true);
  };

  const startEdit = (project: Project) => {
    setDraft({
      name: project.name,
      client: project.client,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setEditingId(project.id);
    setOpen(true);
  };

  const saveProject = async () => {
    if (!draft.name.trim()) {
      setError("اسم المشروع مطلوب.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const timestamp = new Date().toISOString();

      if (demoMode) {
        const current = ProjectService.getProjects();
        if (editingId) {
          ProjectService.saveProjects(
            current.map((project) =>
              project.id === editingId
                ? {
                    ...project,
                    name: draft.name.trim(),
                    client: draft.client.trim(),
                    location: draft.location.trim(),
                    startDate: draft.startDate,
                    endDate: draft.endDate,
                    updatedAt: timestamp,
                  }
                : project,
            ),
          );
        } else {
          ProjectService.addProject({
            id: crypto.randomUUID(),
            code: nextCode,
            name: draft.name.trim(),
            client: draft.client.trim(),
            location: draft.location.trim(),
            status: "Running",
            startDate: draft.startDate,
            endDate: draft.endDate,
            manager: "",
            completion: 0,
            buildings: 0,
            gates: 0,
            assets: 0,
            employees: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      } else if (editingId) {
        await updateRecord<PlatformProject>("projects", editingId, {
          name: draft.name.trim(),
          client_name: draft.client.trim() || null,
          city: draft.location.trim() || null,
          start_date: draft.startDate || null,
          end_date: draft.endDate || null,
          updated_at: timestamp,
        });
      } else {
        await createRecord<PlatformProject>("projects", {
          code: nextCode,
          name: draft.name.trim(),
          client_name: draft.client.trim() || null,
          city: draft.location.trim() || null,
          status: "active",
          start_date: draft.startDate || null,
          end_date: draft.endDate || null,
          created_by: profile?.id ?? null,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      resetDialog();
      await loadProjects();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حفظ المشروع.");
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (project: Project) => {
    if (!window.confirm(`حذف المشروع: ${project.name}؟`)) return;

    setError(null);
    try {
      if (demoMode) {
        ProjectService.saveProjects(
          ProjectService.getProjects().filter((item) => item.id !== project.id),
        );
      } else {
        await deleteRecord("projects", project.id);
      }
      if (projects.length === 1) setSelectedProject(null);
      await loadProjects();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف المشروع.");
    }
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    navigate("assets");
  };

  return (
    <Box p={4} dir="rtl">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>المشاريع</Typography>
          <Typography color="text.secondary">
            {demoMode ? "بيانات تجريبية محفوظة على الجهاز" : "بيانات فعلية مرتبطة بقاعدة PostgreSQL"}
          </Typography>
        </Box>
        {canCreate && <Button variant="contained" onClick={startCreate}>مشروع جديد</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box sx={{ p: 6, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الكود</TableCell>
                <TableCell>اسم المشروع</TableCell>
                <TableCell>العميل</TableCell>
                <TableCell>الموقع</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>{project.code}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.client || "-"}</TableCell>
                  <TableCell>{project.location || "-"}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button variant="contained" size="small" onClick={() => openProject(project)}>
                        فتح
                      </Button>
                      {canManage && (
                        <Button size="small" onClick={() => startEdit(project)}>تعديل</Button>
                      )}
                      {canManage && (
                        <Button color="error" size="small" onClick={() => void removeProject(project)}>
                          حذف
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">لا توجد مشاريع حتى الآن.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={resetDialog} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle>{editingId ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="اسم المشروع" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <TextField fullWidth margin="normal" label="العميل" value={draft.client} onChange={(event) => setDraft({ ...draft, client: event.target.value })} />
          <TextField fullWidth margin="normal" label="الموقع / المدينة" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField fullWidth type="date" label="تاريخ البداية" InputLabelProps={{ shrink: true }} value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            <TextField fullWidth type="date" label="تاريخ النهاية" InputLabelProps={{ shrink: true }} value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>إلغاء</Button>
          <Button variant="contained" onClick={() => void saveProject()} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
