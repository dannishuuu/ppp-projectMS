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
  MonetizationOn as CurrencyIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { currencyService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const CurrenciesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [currencies, setCurrencies] = useState([]);
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
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Currencies List
  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const result = await currencyService.getCurrencies({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setCurrencies(result.currencies || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load currencies', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [page, rowsPerPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchCurrencies();
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
  const handleDialogOpen = (mode, currency = null) => {
    setDialogMode(mode);
    setSelectedCurrency(currency);
    if ((mode === 'edit' || mode === 'view') && currency) {
      setFormData({
        code: currency.code || '',
        name: currency.name || '',
        symbol: currency.symbol || '',
      });
    } else {
      setFormData({ code: '', name: '', symbol: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCurrency(null);
    setFormData({ code: '', name: '', symbol: '' });
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
    if (!formData.code.trim()) {
      setFormError('Currency code is required.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Currency name is required.');
      return;
    }

    setFormLoading(true);
    try {
      if (dialogMode === 'add') {
        await currencyService.createCurrency(formData);
        enqueueSnackbar('Currency created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedCurrency) {
        await currencyService.updateCurrency(selectedCurrency.id, formData);
        enqueueSnackbar('Currency updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchCurrencies();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} currency.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (currency) => {
    setSelectedCurrency(currency);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedCurrency) return;
    setToggleLoading(true);
    try {
      const result = await currencyService.toggleCurrencyStatus(selectedCurrency.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchCurrencies();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update currency status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete Currency
  const handleDeleteDialogOpen = (currency) => {
    setSelectedCurrency(currency);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCurrency) return;
    setDeleteLoading(true);
    try {
      const result = await currencyService.deleteCurrency(selectedCurrency.id);
      enqueueSnackbar(result.message || 'Currency deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchCurrencies();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete currency', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Currency';
      case 'edit': return 'Edit Currency';
      case 'view': return 'Currency Details';
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
            Currencies
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Supported Currencies
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
          placeholder="Search by code or name..."
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
            label={`${totalCount} currencies`}
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
            Add Currency
          </Button>
        </Box>
      </Paper>

      {/* Currencies Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
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
              ) : currencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No currencies found
                  </TableCell>
                </TableRow>
              ) : (
                currencies.map((curr) => (
                  <TableRow key={curr.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          {curr.symbol || curr.code.substring(0, 1)}
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', curr)}
                          sx={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                          }}
                        >
                          {curr.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {curr.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', fontWeight: 600 }}>
                        {curr.symbol || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={curr.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: curr.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: curr.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {formatDate(curr.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={curr.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(curr)}
                            sx={{ p: 0.5, color: curr.is_active ? '#f59e0b' : '#10b981' }}
                          >
                            {curr.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('view', curr)}
                            sx={{ p: 0.5, color: '#6366f1' }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Currency" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('edit', curr)}
                            sx={{ p: 0.5, color: '#64748b' }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        {/* <Tooltip title="Delete Currency" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialogOpen(curr)}
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

          {dialogMode === 'view' && selectedCurrency ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#4f46e5' }}>
                  {selectedCurrency.symbol || selectedCurrency.code.substring(0, 1)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 750, color: '#0f172a' }}>
                    {selectedCurrency.name} ({selectedCurrency.code})
                  </Typography>
                  <Chip
                    label={selectedCurrency.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: selectedCurrency.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: selectedCurrency.is_active ? '#059669' : '#dc2626',
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Box>

              <Divider light />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Currency Code</Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>{selectedCurrency.code}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Currency Name</Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>{selectedCurrency.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Symbol</Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>{selectedCurrency.symbol || 'N/A'}</Typography>
                </Box>
              </Box>

              <Divider light />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {selectedCurrency.created_by_name || 'System Admin'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created At</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {formatDate(selectedCurrency.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {selectedCurrency.updated_by_name || 'System Admin'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated At</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {formatDate(selectedCurrency.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
              <TextField
                required
                fullWidth
                label="Currency Code"
                placeholder="e.g. USD"
                value={formData.code}
                onChange={handleChange('code')}
                size="small"
                disabled={formLoading}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                fullWidth
                label="Currency Name"
                placeholder="e.g. US Dollar"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Symbol"
                placeholder="e.g. $"
                value={formData.symbol}
                onChange={handleChange('symbol')}
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
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
              }}
            >
              {formLoading ? 'Saving...' : dialogMode === 'add' ? 'Create Currency' : 'Save Changes'}
            </Button>
          )}

          {dialogMode === 'view' && (
            <Button
              variant="contained"
              onClick={() => handleDialogOpen('edit', selectedCurrency)}
              startIcon={<EditIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
              }}
            >
              Edit Currency
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Modals for Delete & Toggle */}
      <ConfirmationModal
        open={deleteDialogOpen}
        title="Delete Currency"
        message={`Are you sure you want to delete currency "${selectedCurrency?.code}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        confirmText="Delete Currency"
        confirmColor="error"
      />

      <ConfirmationModal
        open={toggleDialogOpen}
        title={selectedCurrency?.is_active ? 'Deactivate Currency' : 'Activate Currency'}
        message={`Are you sure you want to ${selectedCurrency?.is_active ? 'deactivate' : 'activate'} "${selectedCurrency?.code}"?`}
        onConfirm={handleToggleConfirm}
        onClose={() => setToggleDialogOpen(false)}
        loading={toggleLoading}
        confirmText={selectedCurrency?.is_active ? 'Deactivate' : 'Activate'}
        confirmColor={selectedCurrency?.is_active ? 'warning' : 'success'}
      />
    </Box>
  );
};

export default CurrenciesPage;
