import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Grid,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { orgUnitTypeService } from '../../services/company';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const CODE_RE = /^[A-Z][A-Z0-9_-]{1,19}$/;

// Shared gradient dialog header — icon tile, title, subtitle, close button
const DialogHeader = ({ icon, title, subtitle, onClose }) => (
  <Box
    sx={{
      px: 3,
      py: 2.25,
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%), #4f46e5',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}
  >
    <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.25 }} noWrap>{title}</Typography>
      {subtitle && <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.74rem' }} noWrap>{subtitle}</Typography>}
    </Box>
    <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)', color: '#ffffff' } }}>
      <CloseIcon sx={{ fontSize: 20 }} />
    </IconButton>
  </Box>
);

const DIALOG_PAPER_SX = { borderRadius: 3, overflow: 'hidden', boxShadow: '0 24px 60px -12px rgba(15,23,42,0.35)' };
const DIALOG_FOOTER_SX = { px: 3, py: 1.75, m: 0, gap: 1, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' };

const emptyForm = {
  code: '',
  name: '',
  nameAmharic: '',
  nameAfaanOromo: '',
  description: '',
  sortOrder: '0',
};

const typeToForm = (type) => ({
  code: type.code || '',
  name: type.name || '',
  nameAmharic: type.name_amharic || '',
  nameAfaanOromo: type.name_afaan_oromo || '',
  description: type.description || '',
  sortOrder: type.sort_order !== null && type.sort_order !== undefined ? String(type.sort_order) : '0',
});

export const OrgUnitTypePage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // List state
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'toggle' | 'delete'
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orgUnitTypeService.getOrgUnitTypes({
        page: page + 1,
        limit: rowsPerPage,
        search: appliedSearch,
        status: statusFilter,
      });
      setTypes(result?.orgUnitTypes || []);
      setTotalCount(result?.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load organization unit types.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedSearch, statusFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleSearch = () => {
    setPage(0);
    setAppliedSearch(searchTerm);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setStatusFilter('all');
    setPage(0);
  };

  const handleDialogOpen = (mode, type = null) => {
    setDialogMode(mode);
    setSelectedType(type);
    setFormErrors({});
    setErrorMsg('');
    setForm(mode === 'view' ? emptyForm : type ? typeToForm(type) : emptyForm);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMode('add');
    setSelectedType(null);
    setForm(emptyForm);
    setFormErrors({});
    setErrorMsg('');
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    if (errorMsg) setErrorMsg('');
  };

  const validateForm = () => {
    const errors = {};
    const code = form.code.trim().toUpperCase();
    if (!code) errors.code = 'Type code is required.';
    else if (!CODE_RE.test(code)) errors.code = '2-20 chars, start with a letter.';
    if (!form.name.trim()) errors.name = 'Type name is required.';
    const n = parseInt(form.sortOrder, 10);
    if (form.sortOrder !== '' && (isNaN(n) || n < 0)) errors.sortOrder = 'Must be a non-negative integer.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    nameAmharic: form.nameAmharic.trim() || null,
    nameAfaanOromo: form.nameAfaanOromo.trim() || null,
    description: form.description.trim() || null,
    sortOrder: form.sortOrder === '' ? 0 : parseInt(form.sortOrder, 10),
  });

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrorMsg('');
    try {
      if (dialogMode === 'add') {
        await orgUnitTypeService.createOrgUnitType(buildPayload());
        enqueueSnackbar(`Unit type "${form.name.trim()}" created successfully.`, { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedType) {
        await orgUnitTypeService.updateOrgUnitType(selectedType.id, buildPayload());
        enqueueSnackbar(`Unit type "${form.name.trim()}" updated successfully.`, { variant: 'success' });
      }
      handleDialogClose();
      fetchTypes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save unit type.');
    } finally {
      setSaving(false);
    }
  };

  const getDialogTitle = () => {
    if (dialogMode === 'add') return 'Add Organization Unit Type';
    if (dialogMode === 'edit') return `Edit: ${selectedType?.name || 'Unit Type'}`;
    return `Details: ${selectedType?.name || ''}`;
  };

  const openConfirm = (action, type) => {
    setConfirmAction(action);
    setConfirmTarget(type);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmTarget || !confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'toggle') {
        const result = await orgUnitTypeService.toggleOrgUnitTypeStatus(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Status updated.', { variant: 'success' });
      } else {
        const result = await orgUnitTypeService.deleteOrgUnitType(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Unit type deleted.', { variant: 'success' });
      }
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmTarget(null);
      fetchTypes();
    } catch (err) {
      enqueueSnackbar(err.message || 'Action failed.', { variant: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderFormTextField = (field, label, { required = false, multiline = false, rows = 3, type = 'text', placeholder = '' } = {}) => (
    <TextField
      required={required}
      fullWidth
      size="small"
      type={type}
      label={label}
      placeholder={placeholder}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      value={form[field]}
      onChange={handleFormChange(field)}
      error={Boolean(formErrors[field])}
      helperText={formErrors[field]}
      disabled={saving}
      inputProps={type === 'number' ? { min: 0, step: 1 } : undefined}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
    />
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem', mb: 0.5 }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/company/companymanagement" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Company Management
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Org Unit Types
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon sx={{ fontSize: 21 }} />
            </Box>
            Organization Unit Types
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, ml: '52px' }}>
            Define the kinds of organizational units (Division, Department, Team, ...) that shape company hierarchies.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('add')}
          sx={{
            borderRadius: 2,
            px: 2.5,
            py: 1,
            fontWeight: 700,
            fontSize: '0.84rem',
            backgroundColor: '#4f46e5',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)',
            '&:hover': { backgroundColor: '#4338ca' },
          }}
        >
          Add Unit Type
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterIcon sx={{ color: '#64748b', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filter & Search Unit Types
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              size="small"
              startIcon={<ResetIcon sx={{ fontSize: 15 }} />}
              onClick={handleResetFilters}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#64748b', py: 0, fontWeight: 600 }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, pt: 0.25 }}>
          <TextField
            size="small"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 0.75, display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                </Box>
              ),
            }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 260px' },
              maxWidth: { md: 340 },
              '& .MuiOutlinedInput-root': {
                height: 38,
                borderRadius: 2,
                fontSize: '0.8rem',
                backgroundColor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
              },
            }}
          />

          <TextField
            select
            size="small"
            label="Status"
            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: '0.68rem', color: '#64748b', fontWeight: 600 } } }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{
              width: { xs: '100%', sm: 130 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                height: 38,
                borderRadius: 2,
                fontSize: '0.8rem',
                backgroundColor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
              },
              '& .MuiSelect-select': {
                py: 0,
                height: '38px !important',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem',
              },
            }}
          >
            <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
            <MenuItem value="active" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
            <MenuItem value="inactive" sx={{ fontSize: '0.8rem' }}>Inactive</MenuItem>
          </TextField>

          <Button
            variant="contained"
            size="small"
            startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
            onClick={handleSearch}
            sx={{ height: 38, borderRadius: 2, px: 2, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', backgroundColor: '#4f46e5' }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Types Table */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden', backgroundColor: '#ffffff' }}>
        <TableContainer>
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center', width: 90 }}>ORDER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>TYPE NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>CREATED</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Loading unit types...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CategoryIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      No organization unit types found
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {appliedSearch || statusFilter !== 'all'
                        ? 'Try clearing or changing your search filters.'
                        : 'Click "Add Unit Type" above to define a new kind of unit.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow
                    key={type.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f8fafc' } }}
                  >
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        label={type.sort_order}
                        size="small"
                        sx={{ height: 22, fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', minWidth: 34 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={type.code}
                        size="small"
                        sx={{ height: 22, fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: 1.5, fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography
                        onClick={() => handleDialogOpen('view', type)}
                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem', color: '#0f172a', '&:hover': { color: '#4f46e5', textDecoration: 'underline' } }}
                      >
                        {type.name}
                      </Typography>
                      {(type.name_amharic || type.name_afaan_oromo) && (
                        <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                          {[type.name_amharic, type.name_afaan_oromo].filter(Boolean).join('  ·  ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, maxWidth: 260 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.76rem' }} noWrap>
                        {type.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        label={type.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: type.is_active ? '#dcfce7' : '#fee2e2',
                          color: type.is_active ? '#15803d' : '#b91c1c',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.78rem', color: '#64748b' }}>
                      {formatDate(type.created_at)}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, whiteSpace: 'nowrap' }}>
                        <Tooltip title="View type details" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<ViewIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleDialogOpen('view', type)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#64748b', px: 1, minWidth: 0, gap: 0.4, '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}
                          >
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Edit unit type" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleDialogOpen('edit', type)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#64748b', px: 1, minWidth: 0, gap: 0.4, '&:hover': { color: '#0284c7', backgroundColor: '#e0f2fe' } }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title={type.is_active ? 'Deactivate this type' : 'Activate this type'} arrow placement="top">
                          <Button
                            size="small"
                            startIcon={type.is_active ? <DeactivateIcon sx={{ fontSize: 15 }} /> : <ActivateIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openConfirm('toggle', type)}
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              color: type.is_active ? '#ca8a04' : '#16a34a',
                              px: 1,
                              minWidth: 0,
                              gap: 0.4,
                              '&:hover': { backgroundColor: type.is_active ? '#fef9c3' : '#dcfce7' },
                            }}
                          >
                            {type.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </Tooltip>
                        {/* <Tooltip title="Delete type (blocked while used by org units)" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openConfirm('delete', type)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#ef4444', px: 1, minWidth: 0, gap: 0.4, '&:hover': { backgroundColor: '#fee2e2' } }}
                          >
                            Delete
                          </Button>
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '& .MuiTablePagination-selectLabel': { fontSize: '0.8rem', color: '#64748b' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#475569' },
            '& .MuiTablePagination-actions button': { fontSize: '0.8rem' },
          }}
        />
      </Paper>

      {/* Add / Edit / View Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: DIALOG_PAPER_SX } }}>
        <DialogHeader
          icon={<CategoryIcon sx={{ fontSize: 20 }} />}
          title={getDialogTitle()}
          subtitle={
            dialogMode === 'add'
              ? 'Define a new kind of unit for company hierarchies'
              : dialogMode === 'edit'
                ? 'Update this unit type\'s identity and ordering'
                : 'Full record of the organization unit type'
          }
          onClose={handleDialogClose}
        />
        <DialogContent sx={{ pt: 3, px: 3 }}>
          {dialogMode === 'view' && selectedType ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                  <CategoryIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{selectedType.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                    <Chip label={selectedType.code} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, fontFamily: 'monospace', backgroundColor: '#eef2ff', color: '#4f46e5' }} />
                    <Chip label={`Order ${selectedType.sort_order}`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#f1f5f9' }} />
                    <Chip
                      label={selectedType.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: selectedType.is_active ? '#dcfce7' : '#fee2e2',
                        color: selectedType.is_active ? '#15803d' : '#b91c1c',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              {(selectedType.name_amharic || selectedType.name_afaan_oromo) && (
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                  {[selectedType.name_amharic, selectedType.name_afaan_oromo].filter(Boolean).join('  ·  ')}
                </Typography>
              )}
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', mb: 1.5 }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                  {selectedType.description || '—'}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Created {formatDate(selectedType.created_at)} · Updated {formatDate(selectedType.updated_at)}
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleFormSubmit} noValidate id="org-type-form">
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={4}>
                  {renderFormTextField('code', 'Type Code', { required: true, placeholder: 'e.g. DEPT' })}
                </Grid>
                <Grid item xs={12} sm={6} md={8}>
                  {renderFormTextField('name', 'Type Name', { required: true, placeholder: 'e.g. Department' })}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {renderFormTextField('nameAmharic', 'Amharic Name', { placeholder: 'e.g. መምሪያ' })}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {renderFormTextField('nameAfaanOromo', 'Afaan Oromo Name', { placeholder: 'e.g. Waajjira' })}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {renderFormTextField('sortOrder', 'Sort Order', { type: 'number', placeholder: '0' })}
                </Grid>
                <Grid item xs={12}>
                  {renderFormTextField('description', 'Description', { multiline: true, rows: 3, placeholder: 'What kinds of units belong to this type...' })}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={DIALOG_FOOTER_SX}>
          {dialogMode === 'view' ? (
            <>
              <Button onClick={handleDialogClose} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Close</Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  const target = selectedType;
                  handleDialogClose();
                  handleDialogOpen('edit', target);
                }}
                sx={{ px: 2.5, borderRadius: 2, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
              >
                Edit Type
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleDialogClose} color="inherit" disabled={saving} sx={{ fontWeight: 600, textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="org-type-form"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ActivateIcon />}
                sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
              >
                {saving ? 'Saving...' : dialogMode === 'add' ? 'Create Type' : 'Save Changes'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Toggle / Delete confirmation */}
      <ConfirmationModal
        open={confirmOpen}
        title={
          confirmAction === 'delete'
            ? 'Delete Unit Type'
            : confirmTarget?.is_active
              ? 'Deactivate Unit Type'
              : 'Activate Unit Type'
        }
        message={
          confirmAction === 'delete'
            ? `Are you sure you want to delete "${confirmTarget?.name}"? This fails if any organization units already use this type.`
            : confirmTarget?.is_active
              ? `Are you sure you want to deactivate "${confirmTarget?.name}"? New org units will not be able to use it.`
              : `Are you sure you want to activate "${confirmTarget?.name}"?`
        }
        confirmText={confirmAction === 'delete' ? 'Delete' : confirmTarget?.is_active ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        confirmColor={confirmAction === 'delete' ? 'error' : confirmTarget?.is_active ? 'warning' : 'primary'}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); setConfirmTarget(null); }}
      />
    </Box>
  );
};

export default OrgUnitTypePage;
