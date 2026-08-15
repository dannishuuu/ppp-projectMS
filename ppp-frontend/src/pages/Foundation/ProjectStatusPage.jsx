import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Grid,
  Divider,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Flag as StatusIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectStatusService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const ProjectStatusPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog State (Create, Edit, View)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Statuses List
  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const result = await projectStatusService.getProjectStatuses({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setStatuses(result.projectStatuses || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load project statuses', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [page, rowsPerPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchStatuses();
      } else {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open Create/Edit/View Dialog
  const handleDialogOpen = (mode, status = null) => {
    setDialogMode(mode);
    setSelectedStatus(status);
    if ((mode === 'edit' || mode === 'view') && status) {
      setFormData({ 
        name: status.name || '', 
        description: status.description || '' 
      });
    } else {
      setFormData({ name: '', description: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedStatus(null);
    setFormData({ name: '', description: '' });
    setFormError('');
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (formError) setFormError('');
  };

  // Submit Create / Edit Form
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Status name is required.');
      return;
    }

    setFormLoading(true);
    try {
      if (dialogMode === 'add') {
        await projectStatusService.createProjectStatus(formData);
        enqueueSnackbar('Project status created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedStatus) {
        // In edit mode, only send description (name is not editable)
        await projectStatusService.updateProjectStatus(selectedStatus.id, {
          description: formData.description
        });
        enqueueSnackbar('Project status updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchStatuses();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} status.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (status) => {
    setSelectedStatus(status);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedStatus) return;
    setToggleLoading(true);
    try {
      const result = await projectStatusService.toggleProjectStatus(selectedStatus.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchStatuses();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete Status
  // const handleDeleteDialogOpen = (status) => {
  //   setSelectedStatus(status);
  //   setDeleteDialogOpen(true);
  // };

  const handleDeleteConfirm = async () => {
    if (!selectedStatus) return;
    setDeleteLoading(true);
    try {
      const result = await projectStatusService.deleteProjectStatus(selectedStatus.id);
      enqueueSnackbar(result.message || 'Status deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchStatuses();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete status', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Project Status';
      case 'edit': return 'Edit Project Status';
      case 'view': return 'Project Status Details';
      default: return '';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Project Statuses
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Project Status Management
        </Typography>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Filters
          </Typography>
        </Box>

        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search status by name..."
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
            flex: '1 1 280px',
            maxWidth: 360,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
            },
          }}
        />

        {/* Status Filter Dropdown */}
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            flex: '0 0 140px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
            },
          }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Chip
            label={`${totalCount} statuses`}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('add')}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              fontSize: '0.82rem',
            }}
          >
            Add Status
          </Button>
        </Box>
      </Paper>

      {/* Statuses Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : statuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No project statuses found
                  </TableCell>
                </TableRow>
              ) : (
                statuses.map((status) => (
                  <TableRow key={status.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          <StatusIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', status)}
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                          }}
                        >
                          {status.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {status.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: status.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: status.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={status.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(status)}
                            sx={{ p: 0.5, color: status.is_active ? '#f59e0b' : '#10b981' }}
                          >
                            {status.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('view', status)}
                            sx={{ p: 0.5, color: '#6366f1' }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Status" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('edit', status)}
                            sx={{ p: 0.5, color: '#64748b' }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        {/* <Tooltip title="Delete Status" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialogOpen(status)}
                            sx={{ p: 0.5, color: '#dc2626' }}
                          >
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip> */}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '& .MuiTablePagination-selectLabel': { fontSize: '0.8rem', color: '#64748b' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#475569' },
            '& .MuiTablePagination-actions button': { fontSize: '0.8rem' },
          }}
        />
      </Paper>

      {/* POPUP MODAL DIALOG (Create, Edit, View) */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          {getDialogTitle()}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {dialogMode === 'view' && selectedStatus ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Header Section with Icon and Name */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2.5,
                  p: 2.5,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Avatar sx={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                  <StatusIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {selectedStatus.name}
                  </Typography>
                  <Chip
                    label={selectedStatus.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: selectedStatus.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  />
                </Box>
              </Box>

              {/* Description Section */}
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#4f46e5', borderRadius: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Description
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    minHeight: 80,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {selectedStatus.description || 'No description provided for this status.'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Metadata Section */}
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#94a3b8', borderRadius: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Metadata
                  </Typography>
                </Box>
                <Grid container spacing={2.5}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedStatus.created_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedStatus.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedStatus.updated_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedStatus.updated_at)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
              <TextField
                required
                fullWidth
                label="Status Name"
                placeholder="e.g. Under Construction"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={formLoading || dialogMode === 'edit'}
                helperText={dialogMode === 'edit' ? 'Status name cannot be edited' : ''}
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: '#94a3b8',
                    backgroundColor: '#f1f5f9',
                  }
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Describe what this status represents in the project lifecycle..."
                value={formData.description}
                onChange={handleChange('description')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          {dialogMode !== 'view' && (
            <>
              <Button 
                onClick={handleDialogClose} 
                disabled={formLoading}
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 600, 
                  color: '#64748b',
                  '&:hover': { backgroundColor: '#f1f5f9' }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={formLoading}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' },
                  minWidth: 100,
                }}
              >
                {formLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : dialogMode === 'add' ? 'Create' : 'Update'}
              </Button>
            </>
          )}
          {dialogMode === 'view' && (
            <Button 
              onClick={handleDialogClose}
              variant="contained"
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal - Toggle Status */}
      <ConfirmationModal
        open={toggleDialogOpen}
        onClose={() => setToggleDialogOpen(false)}
        onConfirm={handleToggleConfirm}
        title={selectedStatus?.is_active ? 'Deactivate Status' : 'Activate Status'}
        message={`Are you sure you want to ${selectedStatus?.is_active ? 'deactivate' : 'activate'} the status "${selectedStatus?.name}"?`}
        confirmText={selectedStatus?.is_active ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        severity={selectedStatus?.is_active ? 'warning' : 'info'}
      />

      {/* Confirmation Modal - Delete */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Status"
        message={`Are you sure you want to delete the status "${selectedStatus?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        severity="error"
      />
    </Box>
  );
};

export default ProjectStatusPage;
