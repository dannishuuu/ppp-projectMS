import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  MenuItem,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationService, organizationTypeService } from '../../services/organizationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const OrganizationList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [organizations, setOrganizations] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Load Organization Types for filter dropdown
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await organizationTypeService.getOrganizationTypes({ limit: 100, status: 'active' });
        setOrgTypes(res.organizationTypes || res.rows || []);
      } catch (err) {
        console.error('Failed to load organization types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Fetch Organizations list
  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const result = await organizationService.getOrganizations({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        typeId: typeFilter,
      });
      setOrganizations(result.organizations || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load organizations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page, rowsPerPage, statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchOrganizations();
      } else {
        setPage(0);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Toggle status dialog handlers
  const handleToggleDialogOpen = (org) => {
    setSelectedOrg(org);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedOrg) return;
    setToggleLoading(true);
    try {
      const result = await organizationService.toggleOrganizationStatus(selectedOrg.id);
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update organization status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete dialog handlers
  const handleDeleteDialogOpen = (org) => {
    setSelectedOrg(org);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;
    setDeleteLoading(true);
    try {
      const result = await organizationService.deleteOrganization(selectedOrg.id);
      enqueueSnackbar(result.message || 'Organization deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete organization', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Organizations
            </Typography>
          </Breadcrumbs>

          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Organizations Directory
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/organizations/new')}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            px: 2.2,
            py: 0.75,
            fontSize: '0.82rem',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          }}
        >
          Add Organization
        </Button>
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

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by name, email, phone..."
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
            flex: '1 1 240px',
            maxWidth: 320,
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

        {/* Org Type Filter */}
        <TextField
          select
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{
            flex: '0 0 170px',
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
          <MenuItem value="">All Org Types</MenuItem>
          {orgTypes.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Status Filter */}
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            flex: '0 0 130px',
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
            label={`${totalCount} organizations`}
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
        </Box>
      </Paper>

      {/* Organizations Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Organization Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Business Sector</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Created</TableCell>
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
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box
                        onClick={() => navigate(`/organizations/${org.id}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover .org-name': { color: '#4f46e5', textDecoration: 'underline' },
                        }}
                      >
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          <BusinessIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{ maxWidth: 220, overflow: 'hidden' }}>
                          <Typography className="org-name" variant="body2" noWrap sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem', transition: 'color 0.2s' }}>
                            {org.name}
                          </Typography>
                          {org.license_number && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Lic: {org.license_number}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={org.organization_type_name || 'Unspecified'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {org.business_sector || org.profile_experience ? (org.business_sector || 'General Profile') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 500 }}>
                          {org.phone || '-'}
                        </Typography>
                        {org.email && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                            {org.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={org.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: org.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: org.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {formatDate(org.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/organizations/${org.id}`)}
                            sx={{
                              color: '#0284c7',
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              borderRadius: 1.5,
                              p: 0.6,
                              transition: 'all 0.2s ease',
                              '&:hover': { backgroundColor: '#e0f2fe', color: '#0369a1', transform: 'translateY(-1px)' },
                            }}
                          >
                            <ViewIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Organization" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/organizations/${org.id}/edit`)}
                            sx={{
                              color: '#4f46e5',
                              backgroundColor: '#f5f3ff',
                              border: '1px solid #ede9fe',
                              borderRadius: 1.5,
                              p: 0.6,
                              transition: 'all 0.2s ease',
                              '&:hover': { backgroundColor: '#ede9fe', color: '#4338ca', transform: 'translateY(-1px)' },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={org.is_active ? 'Deactivate' : 'Activate'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(org)}
                            sx={{
                              color: org.is_active ? '#d97706' : '#059669',
                              backgroundColor: org.is_active ? '#fff7ed' : '#ecfdf5',
                              border: `1px solid ${org.is_active ? '#ffedd5' : '#d1fae5'}`,
                              borderRadius: 1.5,
                              p: 0.6,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: org.is_active ? '#ffedd5' : '#d1fae5',
                                color: org.is_active ? '#b45309' : '#047857',
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            {org.is_active ? <DeactivateIcon sx={{ fontSize: 15 }} /> : <ActivateIcon sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Organization" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDialogOpen(org)}
                            sx={{
                              color: '#dc2626',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fee2e2',
                              borderRadius: 1.5,
                              p: 0.6,
                              transition: 'all 0.2s ease',
                              '&:hover': { backgroundColor: '#fee2e2', color: '#b91c1c', transform: 'translateY(-1px)' },
                            }}
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

      {/* Delete Modal */}
      <ConfirmationModal
        open={deleteDialogOpen}
        title="Delete Organization"
        message={`Are you sure you want to delete "${selectedOrg?.name}"? This will also delete its profile and experience data.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        confirmText="Delete Organization"
        confirmColor="error"
      />

      {/* Toggle Status Modal */}
      <ConfirmationModal
        open={toggleDialogOpen}
        title={selectedOrg?.is_active ? 'Deactivate Organization' : 'Activate Organization'}
        message={`Are you sure you want to ${selectedOrg?.is_active ? 'deactivate' : 'activate'} "${selectedOrg?.name}"?`}
        onConfirm={handleToggleConfirm}
        onClose={() => setToggleDialogOpen(false)}
        loading={toggleLoading}
        confirmText={selectedOrg?.is_active ? 'Deactivate' : 'Activate'}
        confirmColor={selectedOrg?.is_active ? 'warning' : 'success'}
      />
    </Box>
  );
};

export default OrganizationList;
