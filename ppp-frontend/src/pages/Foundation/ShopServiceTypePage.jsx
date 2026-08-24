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
  Store as ShopIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { shopServiceTypesService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const ShopServiceTypePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [types, setTypes] = useState([]);
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
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    amharic_name: '', 
    afaan_oromo_name: '', 
    description: '' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Shop Service Types List
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const result = await shopServiceTypesService.getShopServiceTypes({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setTypes(result.shopServiceTypes || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load shop/service types', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [page, rowsPerPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchTypes();
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
  const handleDialogOpen = (mode, type = null) => {
    setDialogMode(mode);
    setSelectedType(type);
    if ((mode === 'edit' || mode === 'view') && type) {
      setFormData({ 
        name: type.name || '', 
        amharic_name: type.amharic_name || '',
        afaan_oromo_name: type.afaan_oromo_name || '',
        description: type.description || '' 
      });
    } else {
      setFormData({ name: '', amharic_name: '', afaan_oromo_name: '', description: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setFormData({ name: '', amharic_name: '', afaan_oromo_name: '', description: '' });
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
      setFormError('Shop/Service type name is required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        amharicName: formData.amharic_name || undefined,
        afaanOromoName: formData.afaan_oromo_name || undefined,
        description: formData.description || undefined,
      };

      if (dialogMode === 'add') {
        await shopServiceTypesService.createShopServiceType(payload);
        enqueueSnackbar('Shop/Service type created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedType) {
        await shopServiceTypesService.updateShopServiceType(selectedType.id, payload);
        enqueueSnackbar('Shop/Service type updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchTypes();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} shop/service type.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (type) => {
    setSelectedType(type);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedType) return;
    setToggleLoading(true);
    try {
      const result = await shopServiceTypesService.toggleShopServiceTypeStatus(selectedType.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete Type
  const handleDeleteDialogOpen = (type) => {
    setSelectedType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedType) return;
    setDeleteLoading(true);
    try {
      const result = await shopServiceTypesService.deleteShopServiceType(selectedType.id);
      enqueueSnackbar(result.message || 'Shop/Service type deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete shop/service type', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Shop/Service Type';
      case 'edit': return 'Edit Shop/Service Type';
      case 'view': return 'Shop/Service Type Details';
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
            Shop/Service Types
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Shop & Service Type Management
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
          placeholder="Search shop/service type by name..."
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
            label={`${totalCount} types`}
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
            Add Shop/Service Type
          </Button>
        </Box>
      </Paper>

      {/* Shop/Service Types Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Name (English)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Name (አማርኛ)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Name (Afaan Oromo)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
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
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No shop/service types found
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          <ShopIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', type)}
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                          }}
                        >
                          {type.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {type.amharic_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {type.afaan_oromo_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {type.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={type.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: type.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: type.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={type.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(type)}
                            sx={{ p: 0.5, color: type.is_active ? '#f59e0b' : '#10b981' }}
                          >
                            {type.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('view', type)}
                            sx={{ p: 0.5, color: '#6366f1' }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Shop/Service Type" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('edit', type)}
                            sx={{ p: 0.5, color: '#64748b' }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Shop/Service Type" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialogOpen(type)}
                            sx={{ p: 0.5, color: '#dc2626' }}
                          >
                            <DeleteIcon sx={{ fontSize: 17 }} />
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
        maxWidth="md"
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

          {dialogMode === 'view' && selectedType ? (
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
                  <ShopIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {selectedType.name}
                  </Typography>
                  <Chip
                    label={selectedType.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: selectedType.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  />
                </Box>
              </Box>

              {/* Multilingual Names Section */}
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#4f46e5', borderRadius: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Multilingual Names
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>English Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedType.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>አማርኛ ስም</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedType.amharic_name || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Afaan Oromo Maqaa</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedType.afaan_oromo_name || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
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
                    {selectedType.description || 'No description provided for this shop/service type.'}
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
                        {selectedType.created_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedType.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedType.updated_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedType.updated_at)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Name (English)"
                    placeholder="e.g. Restaurant, Pharmacy, Salon"
                    value={formData.name}
                    onChange={handleChange('name')}
                    size="small"
                    disabled={formLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Name (አማርኛ)"
                    placeholder="e.g. ምግብ ቤት, ፋርማሲ, ሳሎን"
                    value={formData.amharic_name}
                    onChange={handleChange('amharic_name')}
                    size="small"
                    disabled={formLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Name (Afaan Oromo)"
                    placeholder="e.g. Mana Nyaataa, Mana Qoricha"
                    value={formData.afaan_oromo_name}
                    onChange={handleChange('afaan_oromo_name')}
                    size="small"
                    disabled={formLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    placeholder="Describe this shop/service type and its characteristics..."
                    value={formData.description}
                    onChange={handleChange('description')}
                    size="small"
                    disabled={formLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
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
        title={selectedType?.is_active ? 'Deactivate Shop/Service Type' : 'Activate Shop/Service Type'}
        message={`Are you sure you want to ${selectedType?.is_active ? 'deactivate' : 'activate'} the shop/service type "${selectedType?.name}"?`}
        confirmText={selectedType?.is_active ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        severity={selectedType?.is_active ? 'warning' : 'info'}
      />

      {/* Confirmation Modal - Delete */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shop/Service Type"
        message={`Are you sure you want to delete the shop/service type "${selectedType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        severity="error"
      />
    </Box>
  );
};

export default ShopServiceTypePage;
