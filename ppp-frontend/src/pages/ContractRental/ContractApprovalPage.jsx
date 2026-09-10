import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Breadcrumbs,
  Link,
  Avatar,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Description as ContractIcon,
  BusinessCenter as TenantIcon,
  Apartment as BuildingIcon,
  CalendarMonth as CalendarIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { contractStatusMeta } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const formatCurrency = (val) => {
  if (val == null || val === '' || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Single detail line inside an approval card
const DetailRow = ({ label, value, icon = null, mono = false }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.5 }}>
    <Typography sx={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{label}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      {icon}
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#0f172a',
          textAlign: 'right',
          fontFamily: mono ? '"Roboto Mono", monospace' : 'inherit',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

export const ContractApprovalPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [pendingContracts, setPendingContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Approval / rejection confirmation
  const [confirm, setConfirm] = useState({ open: false, mode: null, contract: null });
  const [busy, setBusy] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rentalContractService.getPendingContracts({
        page,
        limit: 12,
        search: appliedSearch,
      });
      setPendingContracts(res?.contracts || res?.rows || []);
      setTotalCount(res?.pagination?.total ?? 0);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (err) {
      enqueueSnackbar('Failed to load pending contracts.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, enqueueSnackbar]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleConfirm = async () => {
    if (!confirm.contract) return;
    setBusy(true);
    try {
      if (confirm.mode === 'approve') {
        await rentalContractService.approveContract(confirm.contract.id);
        enqueueSnackbar(`Contract "${confirm.contract.contract_number}" approved — it is now ACTIVE.`, { variant: 'success' });
      } else {
        await rentalContractService.rejectContract(confirm.contract.id);
        enqueueSnackbar(`Contract "${confirm.contract.contract_number}" rejected — status is now CANCELLED.`, { variant: 'warning' });
      }
      setConfirm({ open: false, mode: null, contract: null });
      fetchPending();
    } catch (err) {
      enqueueSnackbar(err.message || 'Action failed.', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>

      {/* ── Top Bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate('/contracts')}
            size="small"
            sx={{
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.8rem',
              px: 1.5,
              py: 0.6,
              borderRadius: 2,
              minHeight: 0,
              textTransform: 'none',
              borderColor: '#cbd5e1',
              '&:hover': { backgroundColor: 'rgba(99,102,241,0.06)', color: '#6366f1', borderColor: '#94a3b8' },
            }}
          >
            Contracts
          </Button>
          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Approval
          </Typography>
        </Box>

        <Chip
          icon={<PendingIcon sx={{ fontSize: 14 }} />}
          label={`${totalCount} Pending Approval`}
          size="small"
          sx={{
            height: 26,
            fontWeight: 700,
            fontSize: '0.75rem',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
          }}
        />
      </Box>

      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}
        >
          <PendingIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Contract Approval
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Review submitted contracts, then approve them to activate the lease or reject them.
          </Typography>
        </Box>
      </Box>

      {/* Search Toolbar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', mb: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search contract #, unit, building, tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 0.75, fontSize: 17 }} /> }}
            sx={{
              width: 300,
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
          {appliedSearch && (
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Filtering by "{appliedSearch}"
            </Typography>
          )}
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ height: 3, borderRadius: 3, mb: 2 }} />}

      {/* Approval Cards */}
      {!loading && pendingContracts.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: '1px dashed #e2e8f0', textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(124,58,237,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ApproveIcon sx={{ fontSize: 26, color: '#a5b4fc' }} />
          </Box>
          <Typography sx={{ fontWeight: 800, color: '#334155', fontSize: '1rem', mb: 0.5 }}>
            No Contracts Waiting for Approval
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.83rem', maxWidth: 360, mx: 'auto' }}>
            Contracts submitted from the Rental Contracts list will appear here with status PENDING.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2.5 }}>
          {pendingContracts.map((c) => {
            const meta = contractStatusMeta(c.contract_status, c.is_active);
            const graceMonths = parseInt(c.grace_period, 10) || 0;
            return (
              <Paper
                key={c.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {/* Card header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Avatar sx={{ width: 38, height: 38, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                      <ContractIcon sx={{ fontSize: 19 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', fontFamily: '"Roboto Mono", monospace' }}
                        noWrap
                      >
                        {c.contract_number}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Submitted {formatDate(c.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: '13px !important' }} />}
                    label={meta.label}
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      backgroundColor: meta.bg,
                      color: meta.color,
                      border: `1px solid ${meta.border}`,
                      flexShrink: 0,
                    }}
                  />
                </Box>

                <Divider />

                {/* Details */}
                <Box>
                  <DetailRow
                    label="Lessee / Tenant"
                    value={c.tenant_organization_name || '—'}
                    icon={<TenantIcon sx={{ fontSize: 13, color: '#94a3b8' }} />}
                  />
                  <DetailRow
                    label="Premises"
                    value={
                      c.building_name
                        ? `${c.building_name}${c.floor_number != null ? ` • Floor ${c.floor_number}` : ''}${c.unit_number ? ` • Unit ${c.unit_number}` : ''}`
                        : '—'
                    }
                    icon={<BuildingIcon sx={{ fontSize: 13, color: '#94a3b8' }} />}
                  />
                  <DetailRow
                    label="Lease Period"
                    value={`${c.contract_start_date ? formatDate(c.contract_start_date) : '—'} → ${c.contract_end_date ? formatDate(c.contract_end_date) : '—'}`}
                    icon={<CalendarIcon sx={{ fontSize: 13, color: '#94a3b8' }} />}
                  />
                  <DetailRow
                    label="Monthly Rent"
                    value={`${c.currency_code || 'ETB'} ${formatCurrency(c.rent_amount_total_per_month)}`}
                  />
                  <DetailRow
                    label="Payment Cycle"
                    value={c.rental_payment_type_name ? `${c.rental_payment_type_name} • ${c.payment_timing_name || '—'}` : '—'}
                  />
                  <DetailRow label="Grace Period" value={graceMonths > 0 ? `${graceMonths} month(s) — no charge` : 'None'} />
                </Box>

                {c.remarks && (
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: 1.5,
                      px: 1.25,
                      py: 0.75,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.remarks}
                  </Typography>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1.25, pt: 0.5 }}>
                  <Tooltip title="Activate the lease — contract becomes ACTIVE" arrow placement="top">
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ApproveIcon sx={{ fontSize: 17 }} />}
                      onClick={() => setConfirm({ open: true, mode: 'approve', contract: c })}
                      sx={{
                        py: 0.9,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                      }}
                    >
                      Approve
                    </Button>
                  </Tooltip>
                  <Tooltip title="Reject the submission — status becomes CANCELLED" arrow placement="top">
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RejectIcon sx={{ fontSize: 17 }} />}
                      onClick={() => setConfirm({ open: true, mode: 'reject', contract: c })}
                      sx={{
                        py: 0.9,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        borderColor: '#fecaca',
                        color: '#dc2626',
                        '&:hover': { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
                      }}
                    >
                      Reject
                    </Button>
                  </Tooltip>
                  <Tooltip title="View full contract details" arrow placement="top">
                    <Button
                      variant="text"
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      sx={{
                        px: 1.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View
                    </Button>
                  </Tooltip>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: '#cbd5e1', color: '#64748b' }}
          >
            Previous
          </Button>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: '#cbd5e1', color: '#64748b' }}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Approve / Reject Confirmation */}
      <ConfirmationModal
        open={confirm.open}
        title={confirm.mode === 'approve' ? 'Approve Contract' : 'Reject Contract'}
        message={
          confirm.mode === 'approve'
            ? `Are you sure you want to approve contract "${confirm.contract?.contract_number}"? The contract will become ACTIVE and the unit will be marked as rented.`
            : `Are you sure you want to reject contract "${confirm.contract?.contract_number}"? Its status will change from Pending to Cancelled.`
        }
        confirmText={confirm.mode === 'approve' ? 'Approve' : 'Reject'}
        confirmColor={confirm.mode === 'approve' ? 'success' : 'error'}
        onConfirm={handleConfirm}
        onClose={() => setConfirm({ open: false, mode: null, contract: null })}
        loading={busy}
      />
    </Box>
  );
};

export default ContractApprovalPage;
