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
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  PinDrop as AddressIcon,
  Badge as TinIcon,
  AccountBalance as RegistrationIcon,
  Layers as OrgUnitsIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { companyService } from '../../services/company';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

const emptyForm = {
  code: '',
  name: '',
  nameAmharic: '',
  nameAfaanOromo: '',
  tin: '',
  registrationNumber: '',
  registrationDate: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  logoUrl: '',
  description: '',
};

// Map a snake_case API row into the camelCase form shape
const companyToForm = (company) => ({
  code: company.code || '',
  name: company.name || '',
  nameAmharic: company.name_amharic || '',
  nameAfaanOromo: company.name_afaan_oromo || '',
  tin: company.tin || '',
  registrationNumber: company.registration_number || '',
  registrationDate: company.registration_date ? String(company.registration_date).slice(0, 10) : '',
  phone: company.phone || '',
  email: company.email || '',
  website: company.website || '',
  address: company.address || '',
  logoUrl: company.logo_url || '',
  description: company.description || '',
});

const DetailRow = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 1 }}>
    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.84rem', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

export const CompanyManagementPage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // List state
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form / details dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirm dialog state (toggle status / delete)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'toggle' | 'delete'
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await companyService.getCompanies({
        page: page + 1,
        limit: rowsPerPage,
        search: appliedSearch,
        status: statusFilter,
      });
      setCompanies(result?.companies || []);
      setTotalCount(result?.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load companies.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedSearch, statusFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ── Add / Edit / View dialog ───────────────────────────────────────────────

  const handleDialogOpen = (mode, company = null) => {
    setDialogMode(mode);
    setSelectedCompany(company);
    setFormErrors({});
    setErrorMsg('');
    setForm(mode === 'view' ? emptyForm : company ? companyToForm(company) : emptyForm);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMode('add');
    setSelectedCompany(null);
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
    if (!code) errors.code = 'Company code is required.';
    else if (!CODE_RE.test(code)) errors.code = '2-30 chars: letters, digits, "-" or "_".';
    if (!form.name.trim()) errors.name = 'Company name is required.';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = 'Invalid email format.';
    if (form.registrationDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.registrationDate)) {
      errors.registrationDate = 'Use YYYY-MM-DD format.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    nameAmharic: form.nameAmharic.trim() || null,
    nameAfaanOromo: form.nameAfaanOromo.trim() || null,
    tin: form.tin.trim() || null,
    registrationNumber: form.registrationNumber.trim() || null,
    registrationDate: form.registrationDate || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website: form.website.trim() || null,
    address: form.address.trim() || null,
    logoUrl: form.logoUrl.trim() || null,
    description: form.description.trim() || null,
  });

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrorMsg('');
    try {
      if (dialogMode === 'add') {
        await companyService.createCompany(buildPayload());
        enqueueSnackbar(`Company "${form.name.trim()}" created successfully.`, { variant: 'success' });
      } else if (dialogMode === 'edit' && selectedCompany) {
        await companyService.updateCompany(selectedCompany.id, buildPayload());
        enqueueSnackbar(`Company "${form.name.trim()}" updated successfully.`, { variant: 'success' });
      }
      handleDialogClose();
      fetchCompanies();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save company.');
    } finally {
      setSaving(false);
    }
  };

  const getDialogTitle = () => {
    if (dialogMode === 'add') return 'Register New Company';
    if (dialogMode === 'edit') return `Edit: ${selectedCompany?.name || 'Company'}`;
    return `Company Details: ${selectedCompany?.name || ''}`;
  };

  // ── Toggle / delete confirmations ──────────────────────────────────────────

  const openConfirm = (action, company) => {
    setConfirmAction(action);
    setConfirmTarget(company);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmTarget || !confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'toggle') {
        const result = await companyService.toggleCompanyStatus(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Status updated.', { variant: 'success' });
      } else {
        const result = await companyService.deleteCompany(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Company deleted.', { variant: 'success' });
      }
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmTarget(null);
      fetchCompanies();
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
      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
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
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Company Management
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessIcon sx={{ fontSize: 21 }} />
            </Box>
            Companies
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, ml: '52px' }}>
            Register and manage the legal companies that own building and organizational structures.
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
          Add Company
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          p: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterIcon sx={{ color: '#64748b', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filter & Search Companies
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
            placeholder="Search by name, code, TIN, email..."
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
            InputLabelProps={{ shrink: true, sx: { fontSize: '0.68rem', color: '#64748b', fontWeight: 600 } }}
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

      {/* Companies Table */}
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>COMPANY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>TIN</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>CONTACT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>ORG UNITS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>REGISTERED</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Loading companies...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <BusinessIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      No companies found
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {appliedSearch || statusFilter !== 'all'
                        ? 'Try clearing or changing your search filters.'
                        : 'Click "Add Company" above to register the first company.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow
                    key={company.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: '#f8fafc' },
                    }}
                  >
                    {/* Company name */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            onClick={() => handleDialogOpen('view', company)}
                            sx={{
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                            }}
                          >
                            {company.name}
                          </Typography>
                          {company.name_amharic && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                              {company.name_amharic}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Code */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={company.code}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          borderRadius: 1.5,
                          fontFamily: 'monospace',
                        }}
                      />
                    </TableCell>

                    {/* TIN */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace' }}>
                        {company.tin || '—'}
                      </Typography>
                    </TableCell>

                    {/* Contact */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 160 }}>
                        {company.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <EmailIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.74rem' }} noWrap>
                              {company.email}
                            </Typography>
                          </Box>
                        )}
                        {company.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <PhoneIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.74rem' }}>
                              {company.phone}
                            </Typography>
                          </Box>
                        )}
                        {!company.email && !company.phone && (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Org units count */}
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Tooltip title="Organization units under this company" arrow placement="top">
                        <Chip
                          icon={<OrgUnitsIcon sx={{ fontSize: '12px !important' }} />}
                          label={`${company.org_units_count ?? 0}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            borderRadius: 1.5,
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        label={company.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: company.is_active ? '#dcfce7' : '#fee2e2',
                          color: company.is_active ? '#15803d' : '#b91c1c',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>

                    {/* Registered date */}
                    <TableCell sx={{ py: 1.5, fontSize: '0.78rem', color: '#64748b' }}>
                      {company.registration_date ? formatDate(company.registration_date) : '—'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, whiteSpace: 'nowrap' }}>
                        <Tooltip title="View full company details" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<ViewIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleDialogOpen('view', company)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#64748b', px: 1, minWidth: 0, gap: 0.4, '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}
                          >
                            View
                          </Button>
                        </Tooltip>

                        <Tooltip title="Edit company information" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleDialogOpen('edit', company)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#64748b', px: 1, minWidth: 0, gap: 0.4, '&:hover': { color: '#0284c7', backgroundColor: '#e0f2fe' } }}
                          >
                            Edit
                          </Button>
                        </Tooltip>

                        <Tooltip title={company.is_active ? 'Deactivate this company' : 'Reactivate this company'} arrow placement="top">
                          <Button
                            size="small"
                            startIcon={company.is_active ? <DeactivateIcon sx={{ fontSize: 15 }} /> : <ActivateIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openConfirm('toggle', company)}
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              color: company.is_active ? '#ca8a04' : '#16a34a',
                              px: 1,
                              minWidth: 0,
                              gap: 0.4,
                              '&:hover': { backgroundColor: company.is_active ? '#fef9c3' : '#dcfce7' },
                            }}
                          >
                            {company.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </Tooltip>

                        <Tooltip title="Delete company (must have no organization units)" arrow placement="top">
                          <Button
                            size="small"
                            startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openConfirm('delete', company)}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#ef4444', px: 1, minWidth: 0, gap: 0.4, '&:hover': { backgroundColor: '#fee2e2' } }}
                          >
                            Delete
                          </Button>
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '& .MuiTablePagination-selectLabel': { fontSize: '0.8rem', color: '#64748b' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#475569' },
            '& .MuiTablePagination-actions button': { fontSize: '0.8rem' },
          }}
        />
      </Paper>

      {/* ── Add / Edit / View Dialog ── */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth={dialogMode === 'view' ? 'md' : 'sm'} fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', pb: 1 }}>
          {getDialogTitle()}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {dialogMode === 'view' && selectedCompany ? (
            /* ── Details view ── */
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 44, height: 44, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{selectedCompany.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                      <Chip
                        label={selectedCompany.code}
                        size="small"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, backgroundColor: '#f1f5f9', fontFamily: 'monospace' }}
                      />
                      <Chip
                        label={selectedCompany.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: selectedCompany.is_active ? '#dcfce7' : '#fee2e2',
                          color: selectedCompany.is_active ? '#15803d' : '#b91c1c',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                {(selectedCompany.name_amharic || selectedCompany.name_afaan_oromo) && (
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                    {[selectedCompany.name_amharic, selectedCompany.name_afaan_oromo].filter(Boolean).join('  ·  ')}
                  </Typography>
                )}
                {selectedCompany.description && (
                  <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', mb: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                      {selectedCompany.description}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={5}>
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Organization Units</Typography>
                  <Chip
                    icon={<OrgUnitsIcon sx={{ fontSize: '13px !important' }} />}
                    label={`${selectedCompany.org_units_count ?? 0}`}
                    size="small"
                    sx={{ fontWeight: 800, backgroundColor: '#eef2ff', color: '#4f46e5' }}
                  />
                </Box>
                <DetailRow icon={<TinIcon sx={{ fontSize: 15 }} />} label="TIN" value={selectedCompany.tin} />
                <DetailRow icon={<RegistrationIcon sx={{ fontSize: 15 }} />} label="Registration No." value={selectedCompany.registration_number} />
                <DetailRow icon={<RegistrationIcon sx={{ fontSize: 15 }} />} label="Registration Date" value={selectedCompany.registration_date ? formatDate(selectedCompany.registration_date) : null} />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Grid container spacing={0.5}>
                  <Grid item xs={12} sm={4}><DetailRow icon={<EmailIcon sx={{ fontSize: 15 }} />} label="Email" value={selectedCompany.email} /></Grid>
                  <Grid item xs={12} sm={4}><DetailRow icon={<PhoneIcon sx={{ fontSize: 15 }} />} label="Phone" value={selectedCompany.phone} /></Grid>
                  <Grid item xs={12} sm={4}><DetailRow icon={<WebsiteIcon sx={{ fontSize: 15 }} />} label="Website" value={selectedCompany.website} /></Grid>
                  <Grid item xs={12} sm={6}><DetailRow icon={<AddressIcon sx={{ fontSize: 15 }} />} label="Address" value={selectedCompany.address} /></Grid>
                  <Grid item xs={12} sm={6}><DetailRow icon={<BusinessIcon sx={{ fontSize: 15 }} />} label="Created / Updated" value={`${formatDate(selectedCompany.created_at)} · ${formatDate(selectedCompany.updated_at)}`} /></Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            /* ── Add / Edit form ── */
            <Box component="form" onSubmit={handleFormSubmit} noValidate>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                Identity
              </Typography>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={4}>
                  {renderFormTextField('code', 'Company Code', { required: true, placeholder: 'e.g. ETHIOPPP' })}
                </Grid>
                <Grid item xs={12} sm={8}>
                  {renderFormTextField('name', 'Company Name', { required: true, placeholder: 'e.g. Ethiopian Property Partner SC' })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('nameAmharic', 'Amharic Name', { placeholder: 'e.g. ኢትዮጵያ ...' })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('nameAfaanOromo', 'Afaan Oromo Name', { placeholder: 'e.g. Dhaabbata ...' })}
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, mt: 1 }}>
                Legal Registration
              </Typography>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={4}>
                  {renderFormTextField('tin', 'TIN', { placeholder: 'Tax Identification No.' })}
                </Grid>
                <Grid item xs={12} sm={4}>
                  {renderFormTextField('registrationNumber', 'Registration Number')}
                </Grid>
                <Grid item xs={12} sm={4}>
                  {renderFormTextField('registrationDate', 'Registration Date', { type: 'date' })}
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, mt: 1 }}>
                Contact & Location
              </Typography>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('email', 'Email', { placeholder: 'info@company.et' })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('phone', 'Phone', { placeholder: '+251 ...' })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('website', 'Website', { placeholder: 'https://company.et' })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderFormTextField('logoUrl', 'Logo URL', { placeholder: 'https://.../logo.png' })}
                </Grid>
                <Grid item xs={12}>
                  {renderFormTextField('address', 'Address', { placeholder: 'City, sub-city, kebele, house no.' })}
                </Grid>
                <Grid item xs={12}>
                  {renderFormTextField('description', 'Description & Notes', { multiline: true, rows: 3, placeholder: 'Purpose, scope of operations, notes...' })}
                </Grid>
              </Grid>

              <DialogActions sx={{ px: 0, pt: 1 }}>
                <Button onClick={handleDialogClose} color="inherit" disabled={saving} sx={{ fontWeight: 600, textTransform: 'none' }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ActivateIcon />}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700,
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' },
                  }}
                >
                  {saving ? 'Saving...' : dialogMode === 'add' ? 'Create Company' : 'Save Changes'}
                </Button>
              </DialogActions>
            </Box>
          )}

          {dialogMode === 'view' && (
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleDialogClose} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  const target = selectedCompany;
                  handleDialogClose();
                  handleDialogOpen('edit', target);
                }}
                sx={{ px: 2.5, borderRadius: 2, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
              >
                Edit Company
              </Button>
            </DialogActions>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle / Delete confirmation modal */}
      <ConfirmationModal
        open={confirmOpen}
        title={
          confirmAction === 'delete'
            ? 'Delete Company'
            : confirmTarget?.is_active
              ? 'Deactivate Company'
              : 'Activate Company'
        }
        message={
          confirmAction === 'delete'
            ? `Are you sure you want to delete "${confirmTarget?.name}"? This can only succeed while the company has no organization units.`
            : confirmTarget?.is_active
              ? `Are you sure you want to deactivate "${confirmTarget?.name}"? It will be excluded from organizational structure workflows.`
              : `Are you sure you want to activate "${confirmTarget?.name}"?`
        }
        confirmText={
          confirmAction === 'delete' ? 'Delete' : confirmTarget?.is_active ? 'Deactivate' : 'Activate'
        }
        cancelText="Cancel"
        confirmColor={confirmAction === 'delete' ? 'error' : confirmTarget?.is_active ? 'warning' : 'primary'}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); setConfirmTarget(null); }}
      />
    </Box>
  );
};

export default CompanyManagementPage;
