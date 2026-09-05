import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  MenuItem,
  Breadcrumbs,
  Link,
  Avatar,
  LinearProgress,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Description as ContractIcon,
  Payments as PaymentsIcon,
  AttachMoney as MoneyIcon,
  HomeWork as RentalIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  BusinessCenter as TenantIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const formatCurrency = (val) => {
  if (val == null || val === '') return '—';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusChip = ({ isActive }) =>
  isActive ? (
    <Chip label="Active" size="small" sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.7rem' }} />
  ) : (
    <Chip label="Inactive" size="small" sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' }} />
  );

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
  const [showFilters, setShowFilters] = useState(false);

  // Lookups
  const [buildings, setBuildings] = useState([]);

  // Toggle modal
  const [selectedContract, setSelectedContract] = useState(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

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

      const res = await rentalContractService.getContracts(params);
      setContracts(res?.contracts || res?.rows || []);
      setTotalCount(res?.pagination?.total || res?.total || 0);
    } catch (err) {
      enqueueSnackbar('Failed to load rental contracts.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedSearch, statusFilter, buildingFilter, enqueueSnackbar]);

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
    setPage(0);
  };

  const handleToggleStatus = async () => {
    if (!selectedContract) return;
    setToggling(true);
    try {
      await rentalContractService.toggleContractStatus(selectedContract.id);
      enqueueSnackbar(
        `Contract ${selectedContract.is_active ? 'deactivated' : 'activated'} successfully.`,
        { variant: 'success' }
      );
      setToggleModalOpen(false);
      setSelectedContract(null);
      fetchContracts();
      fetchSummary();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update contract status.', { variant: 'error' });
    } finally {
      setToggling(false);
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
      label: 'Monthly Revenue',
      value: summaryLoading ? null : `ETB ${formatCurrency(summary?.totalMonthlyRevenue ?? 0)}`,
      sub: 'From active contracts',
      color: '#16a34a',
      bg: '#dcfce7',
      icon: <MoneyIcon sx={{ fontSize: 22, color: '#16a34a' }} />,
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
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

      {/* Search & Filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by contract #, unit, building, tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} /> }}
            sx={{ flex: 1, minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.82rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', '&:hover': { background: 'linear-gradient(135deg, #4338ca, #6d28d9)' } }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters((p) => !p)}
            sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.82rem', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Filters {showFilters ? '▲' : '▼'}
          </Button>
          <Button
            variant="text"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.82rem', color: '#64748b' }}
          >
            Reset
          </Button>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Building"
              value={buildingFilter}
              onChange={(e) => { setBuildingFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="">All Buildings</MenuItem>
              {buildings.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}
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
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'right' }}>MONTHLY RENT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
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
                    <StatusChip isActive={c.is_active} />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/contracts/${c.id}`)} sx={{ color: '#4f46e5' }}>
                          <ViewIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={c.is_active ? 'Active contracts cannot be edited. Deactivate first.' : 'Edit Contract'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={Boolean(c.is_active)}
                            onClick={() => navigate(`/contracts/${c.id}/edit`)}
                            sx={{ color: c.is_active ? '#cbd5e1' : '#0284c7' }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={c.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedContract(c); setToggleModalOpen(true); }}
                          sx={{ color: c.is_active ? '#dc2626' : '#16a34a' }}
                        >
                          {c.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                        </IconButton>
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

      {/* Toggle Status Modal */}
      <ConfirmationModal
        open={toggleModalOpen}
        title={selectedContract?.is_active ? 'Deactivate Contract' : 'Activate Contract'}
        message={
          selectedContract?.is_active
            ? `Are you sure you want to deactivate contract "${selectedContract?.contract_number}"? This will also mark the linked unit as available.`
            : `Are you sure you want to activate contract "${selectedContract?.contract_number}"?`
        }
        confirmText={selectedContract?.is_active ? 'Deactivate' : 'Activate'}
        confirmColor={selectedContract?.is_active ? 'error' : 'success'}
        onConfirm={handleToggleStatus}
        onClose={() => { setToggleModalOpen(false); setSelectedContract(null); }}
        loading={toggling}
      />
    </Box>
  );
};
