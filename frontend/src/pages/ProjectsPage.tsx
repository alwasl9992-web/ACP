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

export default function ProjectsPage() {
  const { setSelectedProject } = useProject();

  const [projects, setProjects] = useState<Project[]>(
    ProjectService.getProjects()
  );

  const [open, setOpen] = useState(false);

  const [newProject, setNewProject] = useState<Project>({
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
  });

  const addProject = () => {
    if (!newProject.name) return;

    const project: Project = {
      ...newProject,
      id: Date.now().toString(),
      code: `ACP-${String(projects.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ProjectService.addProject(project);

    setProjects(ProjectService.getProjects());

    setNewProject({
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
    });

    setOpen(false);
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);

    alert(`تم فتح المشروع:\n${project.name}`);
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">المشاريع</Typography>

        <Button variant="contained" onClick={() => setOpen(true)}>
          مشروع جديد
        </Button>
      </Box>

      <Paper>
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
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.client}</TableCell>
                <TableCell>{p.location}</TableCell>

                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => openProject(p)}
                  >
                    فتح المشروع
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>مشروع جديد</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="اسم المشروع"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                name: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="العميل"
            value={newProject.client}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                client: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="الموقع"
            value={newProject.location}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                location: e.target.value,
              })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            إلغاء
          </Button>

          <Button variant="contained" onClick={addProject}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

