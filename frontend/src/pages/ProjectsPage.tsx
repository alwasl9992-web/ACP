import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

import ProjectService from "../services/ProjectService";
import type { Project } from "../models/Project";
import { useProject } from "../context/ProjectContext";

interface ProjectsPageProps {
  onProjectOpened?: () => void;
}

const emptyProject: Project = {
  id: "",
  code: "",
  name: "",
  client: "",
  location: "",
  status: "Running",
  startDate: "",
  endDate: "",
  manager: "",
  completion: 0,
  buildings: 0,
  gates: 0,
  assets: 0,
  employees: 0,
  createdAt: "",
  updatedAt: "",
};

export default function ProjectsPage({ onProjectOpened }: ProjectsPageProps) {
  const { setSelectedProject } = useProject();

  const [projects, setProjects] = useState<Project[]>(
    ProjectService.getProjects()
  );
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState<Project>(emptyProject);

  const addProject = () => {
    const projectName = newProject.name.trim();
    if (!projectName) return;

    const now = new Date().toISOString();
    const project: Project = {
      ...newProject,
      name: projectName,
      id: crypto.randomUUID(),
      code: `ACP-${String(projects.length + 1).padStart(3, "0")}`,
      createdAt: now,
      updatedAt: now,
    };

    ProjectService.addProject(project);
    setProjects(ProjectService.getProjects());
    setNewProject(emptyProject);
    setOpen(false);
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    onProjectOpened?.();
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">المشاريع</Typography>

        <Button variant="contained" onClick={() => setOpen(true)}>
          مشروع جديد
        </Button>
      </Box>

      <Paper sx={{ overflowX: "auto" }}>
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
                <TableCell>{project.client}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openProject(project)}
                  >
                    فتح المشروع
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>مشروع جديد</DialogTitle>

        <DialogContent>
          <TextField
            required
            fullWidth
            margin="normal"
            label="اسم المشروع"
            value={newProject.name}
            onChange={(event) =>
              setNewProject({ ...newProject, name: event.target.value })
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="العميل"
            value={newProject.client}
            onChange={(event) =>
              setNewProject({ ...newProject, client: event.target.value })
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="الموقع"
            value={newProject.location}
            onChange={(event) =>
              setNewProject({ ...newProject, location: event.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={addProject}
            disabled={!newProject.name.trim()}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
