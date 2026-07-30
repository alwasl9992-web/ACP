import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Paper,
} from "@mui/material";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import BuildingService from "../services/BuildingService";
import { useProject } from "../context/ProjectContext";
import type { Building } from "../models/Building";

interface BuildingsProps {
  onOpenAsset: (asset: Building) => void;
}

export default function Buildings({
  onOpenAsset,
}: BuildingsProps) {
  const { selectedProject } = useProject();

  if (!selectedProject) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">
          الرجاء اختيار مشروع أولاً.
        </Alert>
      </Box>
    );
  }

  const assets =
    BuildingService.getBuildingsByProject(selectedProject.id);

  const columns: GridColDef<Building>[] = [
    {
      field: "code",
      headerName: "رقم الأصل",
      width: 130,
    },
    {
      field: "name",
      headerName: "اسم الأصل",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "assetType",
      headerName: "النوع",
      width: 140,
    },
    {
      field: "location",
      headerName: "الموقع",
      width: 180,
    },
    {
      field: "criticality",
      headerName: "الأهمية",
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === "Critical"
              ? "error"
              : params.value === "High"
                ? "warning"
                : params.value === "Medium"
                  ? "info"
                  : "success"
          }
        />
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === "Running"
              ? "success"
              : params.value === "Stopped"
                ? "error"
                : "warning"
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "الإجراءات",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onOpenAsset(params.row)}
        >
          فتح الأصل
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">
            سجل الأصول
          </Typography>

          <Typography color="text.secondary">
            المشروع الحالي: {selectedProject.name}
          </Typography>
        </Box>

        <Button variant="contained">
          إضافة أصل
        </Button>
      </Box>

      <Paper
        sx={{
          height: 600,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={assets}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}
          sx={{
            border: 0,
            direction: "rtl",
          }}
        />
      </Paper>
    </Box>
  );
}