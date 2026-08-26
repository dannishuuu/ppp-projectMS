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
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Schedule as TimingIcon,
  FilterList as FilterIcon,
  CalendarMonth as DaysIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { paymentTimingsService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const PaymentTimingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [timings, setTimings] = useState([]);
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
  const [selectedTiming, setSelectedTiming] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAmharic: '',
    durationDays: '',
    description: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modal (Toggle Status)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Payment Timings List
  const fetchTimings = async () => {
    setLoading(true);
    try {
      const result = await paymentTimingsService.getPaymentTimings({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      const dataList = result?.paymentTimings || result?.rentalPaymentTypes || result?.rows || (Array.isArray(result) ? result : []);
      const total = result?.pagination?.total ?? result?.total ?? dataList.length;
      setTimings(dataList);
      setTotalCount(total);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load payment timings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimings();
  }, [page, rowsPerPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchTimings();
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
  const handleDialogOpen = (mode, timing = null) => {
    setDialogMode(mode);
    setSelectedTiming(timing);
    if ((mode === 'edit' || mode === 'view') && timing) {
      setFormData({
        name: timing.name || '',
        nameAmharic: timing.name_amharic || '',
        durationDays: timing.duration_days !== null && timing.duration_days !== undefined ? timing.duration_days.toString() : '',
        description: timing.description || '',
      });
    } else {
      setFormData({
        name: '',
        nameAmharic: '',
        durationDays: '',
        description: '',
      });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTiming(null);
    setFormData({
      name: '',
      nameAmharic: '',
      durationDays: '',
      description: '',
    });
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
      setFormError('Payment timing name is required.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      nameAmharic: formData.nameAmharic.trim() || null,
      durationDays: formData.durationDays !== '' ? parseInt(formData.durationDays, 10) : null,
      description: formData.description.trim() || null,
    };

    setFormLoading(true);
    try {
      if (dialogMode === 'add') {
        await paymentTimingsService.createPaymentTiming(payload);
        enqueueSnackbar('Payment timing created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedTiming) {
        await paymentTimingsService.updatePaymentTiming(selectedTiming.id, payload);
        enqueueSnackbar('Payment timing updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchTimings();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} payment timing.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (timing) => {
    setSelectedTiming(timing);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedTiming) return;
    setToggleLoading(true);
    try {
      const result = await paymentTimingsService.togglePaymentTimingStatus(selectedTiming.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchTimings();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Payment Timing';
      case 'edit': return 'Edit Payment Timing';
      case 'view': return 'Payment Timing Details';
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
            Payment Timings
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Payment Timing Management
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
          placeholder="Search timing by name or description..."
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
            minWidth: 140,
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
          <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
          <MenuItem value="active" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
          <MenuItem value="inactive" sx={{ fontSize: '0.8rem' }}>Inactive</MenuItem>
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        {/* Create Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => handleDialogOpen('add')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'none',
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            px: 2,
            py: 0.85,
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
          }}
        >
          Add Payment Timing
        </Button>
      </Paper>

      {/* Main Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  TIMING NAME
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  AMHARIC NAME
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  DURATION
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  DESCRIPTION
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  CREATED AT
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'right' }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Loading payment timings...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : timings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <TimingIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      No payment timings found
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try clearing or changing your search filters.'
                        : 'Click "Add Payment Timing" above to create one.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                timings.map((timing) => (
                  <TableRow
                    key={timing.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: '#f8fafc' },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <TimingIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          {timing.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.82rem', color: '#64748b' }}>
                      {timing.name_amharic || '—'}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {timing.duration_days !== null && timing.duration_days !== undefined ? (
                        <Chip
                          icon={<DaysIcon style={{ fontSize: 14 }} />}
                          label={`${timing.duration_days} ${timing.duration_days === 1 ? 'day' : 'days'}`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.82rem', color: '#64748b', maxWidth: 260 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontSize: '0.82rem', color: '#64748b' }}
                        title={timing.description || ''}
                      >
                        {timing.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        label={timing.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: timing.is_active ? '#dcfce7' : '#fee2e2',
                          color: timing.is_active ? '#15803d' : '#b91c1c',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.8rem', color: '#64748b' }}>
                      {formatDate(timing.created_at)}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('view', timing)}
                            sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Payment Timing" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('edit', timing)}
                            sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#0284c7', backgroundColor: '#e0f2fe' } }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={timing.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(timing)}
                            sx={{
                              p: 0.5,
                              color: timing.is_active ? '#eab308' : '#16a34a',
                              '&:hover': {
                                backgroundColor: timing.is_active ? '#fef9c3' : '#dcfce7',
                              },
                            }}
                          >
                            {timing.is_active ? (
                              <DeactivateIcon sx={{ fontSize: 17 }} />
                            ) : (
                              <ActivateIcon sx={{ fontSize: 17 }} />
                            )}
                          </IconButton>
                        </Tooltip>
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

          {dialogMode === 'view' && selectedTiming ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Header Section with Icon and Name */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2.5,
                  p: 2.5,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                }}
              >
                <Avatar sx={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                  <TimingIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {selectedTiming.name}
                  </Typography>
                  {selectedTiming.name_amharic && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1, fontWeight: 500 }}>
                      {selectedTiming.name_amharic}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedTiming.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: selectedTiming.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    {selectedTiming.duration_days !== null && selectedTiming.duration_days !== undefined && (
                      <Chip
                        icon={<DaysIcon style={{ fontSize: 13, color: 'white' }} />}
                        label={`${selectedTiming.duration_days} days`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      />
                    )}
                  </Box>
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
                    minHeight: 70,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {selectedTiming.description || 'No description provided for this payment timing.'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Metadata Section */}
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#94a3b8', borderRadius: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Audit & Metadata
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedTiming.created_by_name || 'System'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedTiming.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedTiming.updated_by_name || 'System'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedTiming.updated_at)}
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
                label="Payment Timing Name"
                placeholder="e.g. Monthly, Quarterly, Semi-Annually, Annually"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Amharic Name"
                placeholder="e.g. በየወሩ፣ በየሩብ ዓመቱ"
                value={formData.nameAmharic}
                onChange={handleChange('nameAmharic')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                type="number"
                label="Duration (Days)"
                placeholder="e.g. 30 for Monthly, 90 for Quarterly, 365 for Annually"
                value={formData.durationDays}
                onChange={handleChange('durationDays')}
                size="small"
                disabled={formLoading}
                inputProps={{ min: 0 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Describe this payment timing cycle or notes..."
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
        title={selectedTiming?.is_active ? 'Deactivate Payment Timing' : 'Activate Payment Timing'}
        message={`Are you sure you want to ${selectedTiming?.is_active ? 'deactivate' : 'activate'} the payment timing "${selectedTiming?.name}"?`}
        confirmText={selectedTiming?.is_active ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        severity={selectedTiming?.is_active ? 'warning' : 'info'}
      />
    </Box>
  );
};

export default PaymentTimingPage;
