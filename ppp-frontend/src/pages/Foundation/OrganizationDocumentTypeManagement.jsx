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
  FormControlLabel,
  Checkbox,
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
  Description as DocTypeIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationDocumentTypesService } from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const OrganizationDocumentTypeManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useAuth();

  // Permissions for page actions:
  const canViewDetails = hasPermission('foundation.details_organization_document_type') || hasPermission('foundation.view_organization_document_type');
  const canEditProject = hasPermission('foundation.update_organization_document_type') || hasPermission('foundation.edit_organization_document_type');
  const canExportActivate = hasPermission('foundation.activate_organization_document_type');
  const canCreateProject = hasPermission('foundation.create_organization_document_type');
  const canDeleteProject = hasPermission('foundation.delete_organization_document_type');

  // State
  const [docTypes, setDocTypes] = useState([]);
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
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', isRequired: false, requiresExpiry: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Document Types List
  const fetchDocTypes = async () => {
    setLoading(true);
    try {
      const result = await organizationDocumentTypesService.getOrganizationDocumentTypes({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setDocTypes(result.organizationDocumentTypes || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load organization document types', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, [page, rowsPerPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchDocTypes();
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
  const handleDialogOpen = (mode, docType = null) => {
    setDialogMode(mode);
    setSelectedDocType(docType);
    if ((mode === 'edit' || mode === 'view') && docType) {
      setFormData({
        name: docType.name || '',
        code: docType.code || '',
        description: docType.description || '',
        isRequired: docType.is_required === true,
        requiresExpiry: docType.requires_expiry === true,
      });
    } else {
      setFormData({ name: '', code: '', description: '', isRequired: false, requiresExpiry: false });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDocType(null);
    setFormData({ name: '', code: '', description: '', isRequired: false, requiresExpiry: false });
    setFormError('');
  };

  const handleChange = (field) => (event) => {
    const value = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'code' && typeof value.value === 'string' ? value.value.toUpperCase() : value.value,
    }));
    if (formError) setFormError('');
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.checked }));
    if (formError) setFormError('');
  };

  // Submit Create / Edit Form
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Document type name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Document type code is required.');
      return;
    }

    setFormLoading(true);
    try {
      if (dialogMode === 'add') {
        await organizationDocumentTypesService.createOrganizationDocumentType(formData);
        enqueueSnackbar('Organization document type created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedDocType) {
        await organizationDocumentTypesService.updateOrganizationDocumentType(selectedDocType.id, formData);
        enqueueSnackbar('Organization document type updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchDocTypes();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} document type.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (docType) => {
    setSelectedDocType(docType);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedDocType) return;
    setToggleLoading(true);
    try {
      const result = await organizationDocumentTypesService.toggleOrganizationDocumentType(selectedDocType.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchDocTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete Document Type
  const handleDeleteDialogOpen = (docType) => {
    setSelectedDocType(docType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocType) return;
    setDeleteLoading(true);
    try {
      const result = await organizationDocumentTypesService.deleteOrganizationDocumentType(selectedDocType.id);
      enqueueSnackbar(result.message || 'Document type deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchDocTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete document type', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Organization Document Type';
      case 'edit': return 'Edit Organization Document Type';
      case 'view': return 'Organization Document Type Details';
      default: return '';
    }
  };

  const actionButtonSx = {
    borderRadius: 1.5,
    p: 0.6,
    transition: 'all 0.2s ease',
    '&:hover': { transform: 'translateY(-1px)' },
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
            Organization Document Types
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Organization Document Type Management
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
          placeholder="Search by name, code or description..."
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
            label={`${totalCount} document types`}
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
            Add Document Type
          </Button>
        </Box>
      </Paper>

      {/* Document Types Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 850 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Document Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Required</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Expiry Tracking</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : docTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No organization document types found
                  </TableCell>
                </TableRow>
              ) : (
                docTypes.map((docType) => (
                  <TableRow key={docType.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          <DocTypeIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', docType)}
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                          }}
                        >
                          {docType.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={docType.code}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docType.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={docType.is_required ? 'Required' : 'Optional'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: docType.is_required ? 'rgba(79, 70, 229, 0.1)' : '#f1f5f9',
                          color: docType.is_required ? '#4338ca' : '#64748b',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={docType.requires_expiry ? 'Has Expiry' : 'No Expiry'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: docType.requires_expiry ? 'rgba(245, 158, 11, 0.1)' : '#f1f5f9',
                          color: docType.requires_expiry ? '#b45309' : '#64748b',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={docType.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: docType.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: docType.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('view', docType)}
                            sx={{ ...actionButtonSx, color: '#0284c7', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', '&:hover': { backgroundColor: '#e0f2fe', color: '#0369a1' } }}
                          >
                            <ViewIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Document Type" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDialogOpen('edit', docType)}
                            sx={{ ...actionButtonSx, color: '#4f46e5', backgroundColor: '#f5f3ff', border: '1px solid #ede9fe', '&:hover': { backgroundColor: '#ede9fe', color: '#4338ca' } }}
                          >
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={docType.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(docType)}
                            sx={{
                              ...actionButtonSx,
                              color: docType.is_active ? '#d97706' : '#059669',
                              backgroundColor: docType.is_active ? '#fff7ed' : '#ecfdf5',
                              border: `1px solid ${docType.is_active ? '#ffedd5' : '#d1fae5'}`,
                              '&:hover': { backgroundColor: docType.is_active ? '#ffedd5' : '#d1fae5' },
                            }}
                          >
                            {docType.is_active ? <DeactivateIcon sx={{ fontSize: 15 }} /> : <ActivateIcon sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Document Type" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialogOpen(docType)}
                            sx={{ ...actionButtonSx, color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', '&:hover': { backgroundColor: '#fee2e2', color: '#b91c1c' } }}
                          >
                            <DeleteIcon sx={{ fontSize: 15 }} />
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

          {dialogMode === 'view' && selectedDocType ? (
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
                  <DocTypeIcon sx={{ fontSize: 32, color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    {selectedDocType.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedDocType.code}
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
                    <Chip
                      label={selectedDocType.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: selectedDocType.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Attributes Section */}
              <Box sx={{ px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#4f46e5', borderRadius: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Attributes
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Required Document</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selectedDocType.is_required ? '#4338ca' : '#64748b' }}>
                        {selectedDocType.is_required ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Expiry Tracking</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selectedDocType.requires_expiry ? '#b45309' : '#64748b' }}>
                        {selectedDocType.requires_expiry ? 'Yes' : 'No'}
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
                    {selectedDocType.description || 'No description provided for this document type.'}
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
                        {selectedDocType.created_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedDocType.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {selectedDocType.updated_by_name || 'System Admin'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 600 }}>Last Updated At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {formatDate(selectedDocType.updated_at)}
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
                label="Document Type Name"
                placeholder="e.g. Trade License"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                fullWidth
                label="Short Code"
                placeholder="e.g. TL"
                value={formData.code}
                onChange={handleChange('code')}
                size="small"
                disabled={formLoading}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                helperText="Unique identifier code (auto-uppercased)"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Describe what this document type represents..."
                value={formData.description}
                onChange={handleChange('description')}
                size="small"
                disabled={formLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                  sx={{
                    m: 0, p: 1.5, borderRadius: 2, flex: '1 1 200px',
                    bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                  control={
                    <Checkbox
                      checked={formData.isRequired}
                      onChange={handleCheckboxChange('isRequired')}
                      disabled={formLoading}
                      size="small"
                      sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Required Document</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Mandatory for every organization</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  sx={{
                    m: 0, p: 1.5, borderRadius: 2, flex: '1 1 200px',
                    bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                  control={
                    <Checkbox
                      checked={formData.requiresExpiry}
                      onChange={handleCheckboxChange('requiresExpiry')}
                      disabled={formLoading}
                      size="small"
                      sx={{ color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Requires Expiry Date</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Track expiration of this document</Typography>
                    </Box>
                  }
                />
              </Box>
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
        title={selectedDocType?.is_active ? 'Deactivate Document Type' : 'Activate Document Type'}
        message={`Are you sure you want to ${selectedDocType?.is_active ? 'deactivate' : 'activate'} the document type "${selectedDocType?.name}"?`}
        confirmText={selectedDocType?.is_active ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        confirmColor={selectedDocType?.is_active ? 'warning' : 'success'}
      />

      {/* Confirmation Modal - Delete */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document Type"
        message={`Are you sure you want to delete the document type "${selectedDocType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        confirmColor="error"
      />
    </Box>
  );
};

export default OrganizationDocumentTypeManagement;
