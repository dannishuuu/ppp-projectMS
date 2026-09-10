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
  Autocomplete,
  Breadcrumbs,
  Link,
  Avatar,
  LinearProgress,
  Divider,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Description as ContractIcon,
  Payments as PaymentsIcon,
  AttachMoney as MoneyIcon,
  HomeWork as RentalIcon,
  RestartAlt as ResetIcon,
  BusinessCenter as TenantIcon,
  CalendarMonth as CalendarIcon,
  WarningAmber as OverdueIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { contractStatusMeta } from '../../utils/formatters';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { organizationService } from '../../services/organizationService/organizationService';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const formatCurrency = (val) => {
  if (val == null || val === '') return '—';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusChip = ({ status, isActive }) => {
  const meta = contractStatusMeta(status, isActive);
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
};

export const ContractIndexPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');

  // Lookups
  const [buildings, setBuildings] = useState([]);
  const [tenants, setTenants] = useState([]);

  // Submit Contract modal
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: appliedSearch,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (buildingFilter) params.buildingId = buildingFilter;
      if (tenantFilter) params.tenantOrganizationId = tenantFilter;

      const res = await rentalContractService.getContracts(params);
      setContracts(res?.contracts || res?.rows || []);
      setTotalCount(res?.pagination?.total || res?.total || 0);
    } catch (err) {
      enqueueSnackbar('Failed to load rental contracts.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedSearch, statusFilter, buildingFilter, tenantFilter, enqueueSnackbar]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await rentalContractService.getContractSummary();
      setSummary(res);
    } catch {
      enqueueSnackbar('Failed to load contract summary metrics.', { variant: 'warning' });
      setSummary({
        totalContracts: 0,
        activeContracts: 0,
        inactiveContracts: 0,
        totalMonthlyRevenue: 0,
        monthlyIncome: 0,
        monthlyOverdue: 0,
        rentedUnitsCount: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchSummary();
    buildingsService.getBuildings({ limit: 100, status: 'active' }).then((r) => {
      setBuildings(r?.buildings || r?.rows || []);
    }).catch(() => {});
    organizationService.getOrganizations({ limit: 200, status: 'active' }).then((r) => {
      setTenants(r?.organizations || r?.rows || []);
    }).catch(() => {});
  }, [fetchSummary]);

  const handleSearch = () => {
    setPage(0);
    setAppliedSearch(searchTerm);
  };

  const handleReset = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setStatusFilter('all');
    setBuildingFilter('');
    setTenantFilter('');
    setPage(0);
  };

  const handleSubmitContract = async () => {
    if (!submitTarget) return;
    setSubmitting(true);
    try {
      await rentalContractService.submitContract(submitTarget.id);
      enqueueSnackbar(
        `Contract "${submitTarget.contract_number}" submitted — status is now PENDING.`,
        { variant: 'success' }
      );
      setSubmitDialogOpen(false);
      setSubmitTarget(null);
      fetchContracts();
      fetchSummary();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to submit contract.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const statCards = [
    {
      label: 'Total Contracts',
      value: summaryLoading ? null : String(summary?.totalContracts ?? 0),
      sub: summaryLoading ? 'Loading...' : `${summary?.activeContracts ?? 0} active`,
      color: '#4f46e5',
      bg: '#eef2ff',
      icon: <ContractIcon sx={{ fontSize: 22, color: '#4f46e5' }} />,
    },
    {
      label: 'Monthly Income',
      value: summaryLoading ? null : `ETB ${formatCurrency(summary?.monthlyIncome ?? 0)}`,
      sub: 'Collected in the current month',
      color: '#16a34a',
      bg: '#dcfce7',
      icon: <MoneyIcon sx={{ fontSize: 22, color: '#16a34a' }} />,
    },
    {
      label: 'Monthly Overdue',
      value: summaryLoading ? null : `ETB ${formatCurrency(summary?.monthlyOverdue ?? 0)}`,
      sub: 'Unpaid installments past due',
      color: '#dc2626',
      bg: '#fee2e2',
      icon: <OverdueIcon sx={{ fontSize: 22, color: '#dc2626' }} />,
    },
    {
      label: 'Rented Units',
      value: summaryLoading ? null : String(summary?.rentedUnitsCount ?? 0),
      sub: 'Units currently leased',
      color: '#0284c7',
      bg: '#e0f2fe',
      icon: <RentalIcon sx={{ fontSize: 22, color: '#0284c7' }} />,
    },
    {
      label: 'Inactive Contracts',
      value: summaryLoading ? null : String(summary?.inactiveContracts ?? 0),
      sub: 'Suspended or expired',
      color: '#dc2626',
      bg: '#fee2e2',
      icon: <PaymentsIcon sx={{ fontSize: 22, color: '#dc2626' }} />,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Rental Contracts
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Rental Contracts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/contracts/new')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.82rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            '&:hover': { background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)' },
          }}
        >
          New Contract
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {statCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ p: 1, borderRadius: 2, backgroundColor: card.bg, flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </Typography>
              {card.value == null ? (
                <Skeleton variant="text" width={80} height={32} sx={{ mt: 0.25 }} />
              ) : (
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: card.color, lineHeight: 1.2 }}>
                  {card.value}
                </Typography>
              )}
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.25 }}>
                {card.sub}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filter Toolbar — all filters in one row */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search — compact */}
          <TextField
            size="small"
            placeholder="Search contract #, unit, building, tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 0.75, fontSize: 17 }} /> }}
            sx={{
              width: 270,
              flexShrink: 0,
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
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.78rem',
              px: 2,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              '&:hover': { background: 'linear-gradient(135deg, #4338ca, #6d28d9)' },
            }}
          >
            Search
          </Button>

          <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

          {/* Status — segmented filter */}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={statusFilter}
            onChange={(e, v) => { if (v !== null) { setStatusFilter(v); setPage(0); } }}
            sx={{
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                px: 1.75,
                py: 0.45,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': { backgroundColor: '#f8fafc' },
                '&.Mui-selected': {
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  borderColor: '#c7d2fe',
                  '&:hover': { backgroundColor: '#e0e7ff' },
                },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>

          {/* Building — searchable select */}
          <Autocomplete
            size="small"
            options={buildings}
            value={buildings.find((b) => b.id === buildingFilter) || null}
            onChange={(e, newValue) => { setBuildingFilter(newValue ? newValue.id : ''); setPage(0); }}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')}
            isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Building"
                placeholder="Search building..."
                sx={{
                  width: 210,
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
            )}
            sx={{ width: 210, flexShrink: 0 }}
          />

          {/* Tenant — searchable select */}
          <Autocomplete
            size="small"
            options={tenants}
            value={tenants.find((t) => t.id === tenantFilter) || null}
            onChange={(e, newValue) => { setTenantFilter(newValue ? newValue.id : ''); setPage(0); }}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')}
            isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tenant"
                placeholder="Search tenant..."
                sx={{
                  width: 210,
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
            )}
            sx={{ width: 210, flexShrink: 0 }}
          />

          <Box sx={{ ml: 'auto', flexShrink: 0 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
              onClick={handleReset}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', color: '#64748b' }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {loading && <LinearProgress sx={{ height: 3 }} />}
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>CONTRACT #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>BUILDING / UNIT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>TENANT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>CONTRACT PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>GRACE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'right' }}>MONTHLY RENT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                    <ContractIcon sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                    No rental contracts found. Click "New Contract" to create one.
                  </TableCell>
                </TableRow>
              )}
              {contracts.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ '&:hover': { backgroundColor: '#f8fafc' }, cursor: 'pointer' }}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#4f46e5' }}>
                      {c.contract_number}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {c.rental_payment_type_name || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, backgroundColor: '#eef2ff', color: '#4f46e5', fontSize: '0.7rem', fontWeight: 700 }}>
                        {(c.building_name || '?').charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>{c.building_name || '—'}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Floor {c.floor_number} • Unit {c.unit_number}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TenantIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                      <Typography sx={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                        {c.tenant_organization_name || 'No Tenant Assigned'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>
                        {formatDate(c.contract_start_date)} – {formatDate(c.contract_end_date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {Number(c.grace_period) > 0 ? (
                      <Tooltip title={`First ${parseInt(c.grace_period, 10)} month(s) rent-free — installments pre-marked paid`}>
                        <Chip
                          label={`${parseInt(c.grace_period, 10)} mo`}
                          size="small"
                          sx={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 700, fontSize: '0.68rem' }}
                        />
                      </Tooltip>
                    ) : (
                      <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#16a34a' }}>
                      ETB {formatCurrency(c.rent_amount_total_per_month)}
                    </Typography>
                    {c.rent_amount_per_square_meter && (
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {formatCurrency(c.rent_amount_per_square_meter)}/m²
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <StatusChip status={c.contract_status} isActive={c.is_active} />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', alignItems: 'center' }}>
                      <Tooltip title="View contract details" arrow placement="top">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon sx={{ fontSize: 15 }} />}
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            px: 1.25,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            borderColor: '#c7d2fe',
                            color: '#4f46e5',
                            backgroundColor: '#ffffff',
                            '&:hover': { borderColor: '#818cf8', backgroundColor: '#eef2ff' },
                          }}
                        >
                          Details
                        </Button>
                      </Tooltip>
                      {!c.is_active && String(c.contract_status || '').toUpperCase() === 'DRAFT' && (
                        <Tooltip title="Submit contract for approval (Draft → Pending)" arrow placement="top">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SendIcon sx={{ fontSize: 15 }} />}
                            onClick={() => { setSubmitTarget(c); setSubmitDialogOpen(true); }}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              px: 1.25,
                              minWidth: 0,
                              whiteSpace: 'nowrap',
                              borderColor: '#fde68a',
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              '&:hover': { borderColor: '#fcd34d', backgroundColor: '#fef3c7' },
                            }}
                          >
                            Submit Contract
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title={c.is_active ? 'Active contracts cannot be edited' : 'Edit contract'} arrow placement="top">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                            disabled={Boolean(c.is_active)}
                            onClick={() => navigate(`/contracts/${c.id}/edit`)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              px: 1.25,
                              minWidth: 0,
                              whiteSpace: 'nowrap',
                              borderColor: '#bae6fd',
                              color: '#0284c7',
                              backgroundColor: '#ffffff',
                              '&:hover': { borderColor: '#7dd3fc', backgroundColor: '#f0f9ff' },
                              '&.Mui-disabled': { borderColor: '#e2e8f0', color: '#cbd5e1' },
                            }}
                          >
                            Edit
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ fontSize: '0.8rem' }}
        />
      </Paper>

      {/* Submit Contract Confirmation Modal */}
      <ConfirmationModal
        open={submitDialogOpen}
        title="Submit Contract"
        message={`Are you sure you want to submit contract "${submitTarget?.contract_number}" for approval? Its status will change from Draft to Pending.`}
        confirmText="Submit Contract"
        confirmColor="primary"
        onConfirm={handleSubmitContract}
        onClose={() => { setSubmitDialogOpen(false); setSubmitTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
};
