import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  RestartAlt as ResetFilterIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
import { downloadProjectsCSV } from '../../utils/exportToCsv';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const ProjectList = () => {
  const {
    filteredProjects,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    budgetRange,
    setBudgetRange,
    deleteProject,
    setSelectedProject,
  } = useProjects();

  const navigate = useNavigate();

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenDelete = (project) => {
    setDeleteTarget(project);
  };

  const handleCloseDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      // Handled in context
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    downloadProjectsCSV(filteredProjects, `PPP_Projects_Export_${Date.now()}.csv`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
    setBudgetRange([0, 150000000000]);
  };

  // DataGrid Columns Definition
  const columns = [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a237e' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: params.value === 'Housing' ? '#eef2ff' : '#e6fffa',
            color: params.value === 'Housing' ? '#3730a3' : '#234e52',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      field: 'developer',
      headerName: 'Developer',
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'authority',
      headerName: 'Authority',
      width: 110,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const info = getStatusColor(params.value);
        return (
          <Chip
            label={info.label}
            size="small"
            sx={{
              backgroundColor: info.bg,
              color: info.text,
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: 'preliminaryBudget',
      headerName: 'Budget (ETB)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(params.value, true)}
        </Typography>
      ),
    },
    {
      field: 'completionPercentage',
      headerName: 'Completion %',
      width: 140,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={params.value || 0}
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 30 }}>
            {params.value || 0}%
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedProject(params.row);
                navigate(`/projects/${params.row.id}`);
              }}
              sx={{ color: '#1a237e' }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Project">
            <IconButton
              size="small"
              onClick={() => navigate(`/projects/${params.row.id}/edit`)}
              sx={{ color: '#ed6c02' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete Project">
            <IconButton
              size="small"
              onClick={() => handleOpenDelete(params.row)}
              sx={{ color: '#d32f2f' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
            PPP Projects Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage, filter, and review all 58 infrastructure and housing concession projects
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ fontWeight: 600 }}
          >
            Export CSV ({filteredProjects.length})
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
            sx={{ fontWeight: 600 }}
          >
            Add New Project
          </Button>
        </Box>
      </Box>

      {/* Filter Toolbar — compact single-row bar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        {/* Icon + label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Filters
          </Typography>
        </Box>

        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by code, name, developer…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
              </Box>
            ),
          }}
          sx={{
            flex: '1 1 200px',
            maxWidth: 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
          }}
        />

        {/* Type */}
        <FormControl
          size="small"
          sx={{
            flex: '0 0 130px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
          }}
        >
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="Housing">Housing</MenuItem>
            <MenuItem value="Non-Housing">Non-Housing</MenuItem>
          </Select>
        </FormControl>

        {/* Status */}
        <FormControl
          size="small"
          sx={{
            flex: '0 0 170px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
          }}
        >
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Signed">Signed</MenuItem>
            <MenuItem value="Under Construction">Under Construction</MenuItem>
            <MenuItem value="Operational">Operational</MenuItem>
            <MenuItem value="Procurement">Procurement</MenuItem>
            <MenuItem value="Feasibility">Feasibility</MenuItem>
          </Select>
        </FormControl>

        {/* Budget slider */}
        <Box sx={{ flex: '1 1 180px', maxWidth: 240, minWidth: 160 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
              Max Budget
            </Typography>
            <Typography variant="caption" sx={{ color: '#1a237e', fontWeight: 700, fontSize: '0.7rem' }}>
              {formatCurrency(budgetRange[1], true)}
            </Typography>
          </Box>
          <Slider
            value={budgetRange[1]}
            min={1000000000}
            max={150000000000}
            step={5000000000}
            onChange={(e, val) => setBudgetRange([budgetRange[0], val])}
            size="small"
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => formatCurrency(val, true)}
            sx={{ py: 0.5, color: '#1a237e' }}
          />
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Results count */}
          <Chip
            label={`${filteredProjects.length} results`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: '#eef2ff',
              color: '#3730a3',
              border: '1px solid #c7d2fe',
            }}
          />
          {/* Reset */}
          <Tooltip title="Reset all filters">
            <IconButton
              size="small"
              onClick={handleResetFilters}
              sx={{
                color: '#94a3b8',
                border: '1px solid #e2e8f0',
                borderRadius: 1.5,
                p: 0.5,
                '&:hover': { color: '#ef4444', borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
              }}
            >
              <ResetFilterIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main DataGrid */}
      <Paper sx={{ height: 650, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <DataGrid
          rows={filteredProjects}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f1f5f9',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f8fafc',
            },
          }}
        />
      </Paper>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete PPP Project"
        message={`Are you sure you want to permanently delete project "${deleteTarget?.name}" (${deleteTarget?.code})? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
        loading={deleteLoading}
      />
    </Box>
  );
};
