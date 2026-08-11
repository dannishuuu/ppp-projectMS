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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  FilterList as FilterIcon,
  AssignmentTurnedIn as StatusIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { proposalStatusService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

// Colour palette cycling for status avatars
const STATUS_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];
const getStatusColor = (name = '') => STATUS_COLORS[name.charCodeAt(0) % STATUS_COLORS.length];

export const ProposalStatusPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // ── List state ───────────────────────────────────────────────────────────────
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', step: 0 });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Confirmation modals ───────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const result = await proposalStatusService.getProposalStatuses({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setStatuses(result.proposalStatuses || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load proposal statuses', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatuses(); }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) fetchStatuses();
      else setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  // ── Dialog helpers ────────────────────────────────────────────────────────────
  const handleDialogOpen = (mode, status = null) => {
    setDialogMode(mode);
    setSelectedStatus(status);
    setFormData(
      (mode === 'edit' || mode === 'view') && status
        ? { name: status.name || '', description: status.description || '', step: status.step ?? 0 }
        : { name: '', description: '', step: 0 }
    );
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedStatus(null);
    setFormData({ name: '', description: '', step: 0 });
    setFormError('');
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (formError) setFormError('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');
    if (!formData.name.trim()) { setFormError('Status name is required.'); return; }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        step: formData.step !== '' ? parseInt(formData.step, 10) : 0,
      };

      if (dialogMode === 'add') {
        await proposalStatusService.createProposalStatus(payload);
        enqueueSnackbar('Proposal status created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedStatus) {
        await proposalStatusService.updateProposalStatus(selectedStatus.id, payload);
        enqueueSnackbar('Proposal status updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchStatuses();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} proposal status.`);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Toggle status ─────────────────────────────────────────────────────────────
  const handleToggleConfirm = async () => {
    if (!selectedStatus) return;
    setToggleLoading(true);
    try {
      const result = await proposalStatusService.toggleProposalStatus(selectedStatus.id);
      enqueueSnackbar(result.message || 'Status updated', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchStatuses();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!selectedStatus) return;
    setDeleteLoading(true);
    try {
      const result = await proposalStatusService.deleteProposalStatus(selectedStatus.id);
      enqueueSnackbar(result.message || 'Proposal status deleted', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchStatuses();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete proposal status', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDialogTitle = () => ({ add: 'Add Proposal Status', edit: 'Edit Proposal Status', view: 'Status Details' }[dialogMode] || '');

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link underline="hover" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Proposal Statuses
          </Typography>
        </Breadcrumbs>
        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Proposal Workflow Statuses
        </Typography>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
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

        <TextField
          size="small"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Box>,
          }}
          sx={{
            flex: '1 1 280px', maxWidth: 360,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
            },
          }}
        />

        <TextField
          select size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            flex: '0 0 140px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc',
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
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen('add')}
            sx={{ fontWeight: 600, borderRadius: 2, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, fontSize: '0.82rem' }}
          >
            Add Status
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Step No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : statuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>No proposal statuses found</TableCell>
                </TableRow>
              ) : (
                statuses.map((s) => (
                  <TableRow key={s.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: getStatusColor(s.name), fontSize: '0.7rem', fontWeight: 700 }}>
                          <StatusIcon sx={{ fontSize: 15 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', s)}
                          sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', cursor: 'pointer', '&:hover': { color: '#4f46e5', textDecoration: 'underline' } }}
                        >
                          {s.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Step ${s.step}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }} noWrap>
                        {s.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description</span>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.7rem', fontWeight: 600,
                          backgroundColor: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: s.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {formatDate(s.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={s.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => { setSelectedStatus(s); setToggleDialogOpen(true); }}
                            sx={{ p: 0.5, color: s.is_active ? '#f59e0b' : '#10b981' }}
                          >
                            {s.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton size="small" onClick={() => handleDialogOpen('view', s)} sx={{ p: 0.5, color: '#6366f1' }}>
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Status" arrow placement="top">
                          <IconButton size="small" onClick={() => handleDialogOpen('edit', s)} sx={{ p: 0.5, color: '#64748b' }}>
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Delete Status" arrow placement="top">
                          <IconButton size="small" onClick={() => { setSelectedStatus(s); setDeleteDialogOpen(true); }} sx={{ p: 0.5, color: '#dc2626' }}>
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
          }}
        />
      </Paper>

      {/* ── POPUP DIALOG (Create / Edit / View) ─────────────────────────────────── */}
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
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>
          )}

          {/* ── VIEW MODE ─────────────────────────────────────────────────────── */}
          {dialogMode === 'view' && selectedStatus ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 44, height: 44, backgroundColor: getStatusColor(selectedStatus.name) }}>
                  <StatusIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 750, color: '#0f172a' }}>
                    {selectedStatus.name}
                  </Typography>
                  <Chip
                    label={selectedStatus.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.7rem', fontWeight: 600, mt: 0.5,
                      backgroundColor: selectedStatus.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: selectedStatus.is_active ? '#059669' : '#dc2626',
                    }}
                  />
                </Box>
              </Box>

              <Divider light />

              {/* Description */}
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Description</Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                  {selectedStatus.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided</span>}
                </Typography>
              </Box>

              <Divider light />

              {/* Step Number */}
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Workflow Step Number</Typography>
                <Chip
                  label={`Step ${selectedStatus.step}`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}
                />
              </Box>

              <Divider light />

              {/* Audit info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {selectedStatus.created_by_name || 'System Admin'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created At</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {formatDate(selectedStatus.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {selectedStatus.updated_by_name || 'System Admin'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated At</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {formatDate(selectedStatus.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            /* ── CREATE / EDIT FORM ─────────────────────────────────────────── */
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
              <TextField
                required
                fullWidth
                label="Status Name"
                placeholder="e.g. Pending Review, Approved, Rejected"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={formLoading || dialogMode === 'edit'}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required
                fullWidth
                type="number"
                label="Step Number"
                placeholder="e.g. 1"
                value={formData.step}
                onChange={handleChange('step')}
                size="small"
                disabled={formLoading || dialogMode === 'edit'}
                inputProps={{ min: 0 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Optional: describe when this status is applied..."
                value={formData.description}
                onChange={handleChange('description')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button
            onClick={handleDialogClose}
            disabled={formLoading}
            sx={{ borderRadius: 2, color: '#64748b', fontWeight: 600 }}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={formLoading}
              startIcon={formLoading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ borderRadius: 2, px: 3, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
            >
              {formLoading ? 'Saving...' : dialogMode === 'add' ? 'Create Status' : 'Save Changes'}
            </Button>
          )}

          {dialogMode === 'view' && (
            <Button
              variant="contained"
              onClick={() => handleDialogOpen('edit', selectedStatus)}
              startIcon={<EditIcon />}
              sx={{ borderRadius: 2, px: 3, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
            >
              Edit Status
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Confirmation Modals ─────────────────────────────────────────────────── */}
      <ConfirmationModal
        open={deleteDialogOpen}
        title="Delete Proposal Status"
        message={`Are you sure you want to delete "${selectedStatus?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        confirmText="Delete Status"
        confirmColor="error"
      />

      <ConfirmationModal
        open={toggleDialogOpen}
        title={selectedStatus?.is_active ? 'Deactivate Status' : 'Activate Status'}
        message={`Are you sure you want to ${selectedStatus?.is_active ? 'deactivate' : 'activate'} "${selectedStatus?.name}"?`}
        onConfirm={handleToggleConfirm}
        onClose={() => setToggleDialogOpen(false)}
        loading={toggleLoading}
        confirmText={selectedStatus?.is_active ? 'Deactivate' : 'Activate'}
        confirmColor={selectedStatus?.is_active ? 'warning' : 'success'}
      />
    </Box>
  );
};

export default ProposalStatusPage;
