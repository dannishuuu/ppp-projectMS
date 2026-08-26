import { useState, useEffect, useRef } from 'react';
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
  InputAdornment,
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
  Description as DescriptionIcon,
  Label as LabelIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationTypeService } from '../../services/organizationService/organizationTypeService';
import { formatDate } from '../../utils/formatters';

export const OrganizationTypePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const dialogRef = useRef(null);

  const [orgTypes, setOrgTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedOrgType, setSelectedOrgType] = useState(null);
  const [formData, setFormData] = useState({ name: '', orgTypeCode: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchOrgTypes = async () => {
    setLoading(true);
    try {
      const result = await organizationTypeService.getOrganizationTypes({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setOrgTypes(result.organizationTypes || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar('Failed to load organization types', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgTypes();
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        fetchOrgTypes();
      } else {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDialogOpen = (mode, orgType = null) => {
    setDialogMode(mode);
    setSelectedOrgType(orgType);
    if ((mode === 'edit' || mode === 'view') && orgType) {
      setFormData({
        name: orgType.name || '',
        orgTypeCode: orgType.org_type_code || '',
        description: orgType.description || '',
      });
    } else if (mode === 'add') {
      setFormData({ name: '', orgTypeCode: '', description: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedOrgType(null);
    setFormData({ name: '', orgTypeCode: '', description: '' });
    setFormError('');
  };

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === 'orgTypeCode') {
      value = value.toUpperCase().replace(/\s+/g, '');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      orgTypeCode: formData.orgTypeCode.trim().toUpperCase().replace(/\s+/g, '') || null,
      description: formData.description.trim() || null,
    };

    setFormLoading(true);
    try {
      if (dialogMode === 'add') {
        await organizationTypeService.createOrganizationType(payload);
        enqueueSnackbar('Organization type created successfully', { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedOrgType) {
        await organizationTypeService.updateOrganizationType(selectedOrgType.id, payload);
        enqueueSnackbar('Organization type updated successfully', { variant: 'success' });
      }
      handleDialogClose();
      fetchOrgTypes();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'} organization type`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (orgType) => {
    try {
      const result = await organizationTypeService.toggleOrganizationTypeStatus(orgType.id);
      enqueueSnackbar(result.message, { variant: 'success' });
      fetchOrgTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to toggle status', { variant: 'error' });
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return 'Add Organization Type';
      case 'edit': return 'Edit Organization Type';
      case 'view': return 'Organization Type Details';
      default: return '';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact inline header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2.5,
          flexWrap: 'wrap',
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link
            underline="hover"
            color="inherit"
            component={RouterLink}
            to="/dashboard"
            sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}
          >
            Dashboard
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Organization Types
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            width: '1px',
            height: 16,
            backgroundColor: '#cbd5e1',
            flexShrink: 0,
          }}
        />

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}
        >
          Organization Types
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
          <LabelIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Filters
          </Typography>
        </Box>

        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        <TextField
          size="small"
          placeholder="Search by name, code, or description..."
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
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
          }}
        />

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
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
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
              backgroundColor: '#1a237e',
              '&:hover': { backgroundColor: '#0d1642' },
            }}
          >
            Add Type
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem' }}>Type Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem' }}>Type Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem', textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.25, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#1a237e' }} />
                  </TableCell>
                </TableRow>
              ) : orgTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No organization types found
                  </TableCell>
                </TableRow>
              ) : (
                orgTypes.map((orgType) => (
                  <TableRow key={orgType.id} hover sx={{ '& td': { py: 1 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1a237e', fontSize: '0.72rem', fontWeight: 700 }}>
                          {orgType.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                          {orgType.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {orgType.org_type_code ? (
                        <Chip
                          label={orgType.org_type_code}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            borderRadius: 1.5,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {orgType.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={orgType.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: orgType.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: orgType.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {formatDate(orgType.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Tooltip title={orgType.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(orgType)}
                          sx={{ p: 0.5, color: orgType.is_active ? '#f59e0b' : '#10b981' }}
                        >
                          {orgType.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('view', orgType)}
                          sx={{ p: 0.5, color: '#1a237e' }}
                        >
                          <ViewIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleDialogOpen('edit', orgType)}
                          sx={{ p: 0.5, color: '#64748b' }}
                        >
                          <EditIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
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

      {/* Add/Edit/View Dialog */}
      <Dialog
        ref={dialogRef}
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1, maxWidth: 520, width: '100%' },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                backgroundColor: dialogMode === 'view' ? '#e8eaf6' : '#f3e5f5',
                border: `1px solid ${dialogMode === 'view' ? '#c7d2fe' : '#e1bee7'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <DescriptionIcon sx={{ color: dialogMode === 'view' ? '#1a237e' : '#7b1fa2', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {getDialogTitle()}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {dialogMode === 'view' && selectedOrgType ? (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Type Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 600 }}>
                    {selectedOrgType.name}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Type Code
                  </Typography>
                  {selectedOrgType.org_type_code ? (
                    <Chip
                      icon={<CodeIcon style={{ fontSize: 14 }} />}
                      label={selectedOrgType.org_type_code}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      No code assigned
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#0f172a' }}>
                    {selectedOrgType.description || 'No description provided'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedOrgType.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: selectedOrgType.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: selectedOrgType.is_active ? '#059669' : '#dc2626',
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Created At
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#0f172a' }}>
                    {formatDate(selectedOrgType.created_at)}
                  </Typography>
                </Grid>

                {selectedOrgType.created_by_name && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Created By
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#0f172a' }}>
                      {selectedOrgType.created_by_name}
                    </Typography>
                  </Grid>
                )}

                {selectedOrgType.updated_by_name && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Last Updated By
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#0f172a' }}>
                      {selectedOrgType.updated_by_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              {formError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {formError}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Type Name"
                value={formData.name}
                onChange={handleChange('name')}
                disabled={formLoading}
                required
                placeholder="e.g. SPV, Contracting Authority, Financial Institution"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LabelIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Type Code"
                value={formData.orgTypeCode}
                onChange={handleChange('orgTypeCode')}
                disabled={formLoading || dialogMode === 'edit'}
                placeholder="e.g. SPV, CA, FI, DEV"
                inputProps={{
                  maxLength: 20,
                  style: { textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 },
                }}
                helperText={
                  dialogMode === 'edit'
                    ? 'Type code cannot be modified once created'
                    : 'Auto-capitalized, no spaces allowed (optional, max 20 chars)'
                }
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: dialogMode === 'edit' ? '#f8fafc' : 'inherit',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                disabled={formLoading}
                multiline
                rows={3}
                placeholder="Describe this organization type role or notes..."
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleDialogClose}
            variant="outlined"
            color="inherit"
            disabled={formLoading}
            sx={{ borderColor: '#e2e8f0', color: '#475569', fontWeight: 600, borderRadius: 2, flex: 1 }}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={formLoading}
              sx={{
                px: 4,
                fontWeight: 700,
                borderRadius: 2,
                flex: 1,
                background: 'linear-gradient(135deg, #1a237e, #283593)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #000051, #1a237e)',
                },
              }}
            >
              {formLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : dialogMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationTypePage;