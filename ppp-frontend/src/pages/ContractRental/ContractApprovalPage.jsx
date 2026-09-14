import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
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
  Visibility as ViewIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentIcon,
  Place as GraceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

// Lease term in days and months (1 month = 30.4375 days average — same formula used across the app)
const calcTerm = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return { totalDays: 0, totalMonths: 0 };
  const [sY, sM, sD] = String(startDateStr).slice(0, 10).split('-').map(Number);
  const [eY, eM, eD] = String(endDateStr).slice(0, 10).split('-').map(Number);
  const diffMs = Date.UTC(eY, eM - 1, eD) - Date.UTC(sY, sM - 1, sD);
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const totalMonths = Math.max(0, Math.round((totalDays / 30.4375) * 10) / 10);
  return { totalDays, totalMonths };
};

// Compact line inside an approval card
const CardLine = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
    {icon}
    <Typography
      sx={{ fontSize: '0.73rem', color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {text || '—'}
    </Typography>
  </Box>
);

// Label/value row inside the details dialog
const DialogField = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 0.7 }}>
    <Typography sx={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{value || '—'}</Typography>
  </Box>
);

// Small highlight tile at the top of the details dialog
const MetricTile = ({ label, value, sub, color, bg }) => (
  <Box sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${bg}`, backgroundColor: `${color}0a`, minWidth: 0 }}>
    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>{sub}</Typography>
    )}
  </Box>
);

const DialogSectionTitle = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, mt: 1.5 }}>
    {icon}
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {title}
    </Typography>
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

  // Details popup
  const [detailsContract, setDetailsContract] = useState(null);

  // Approval / rejection confirmation
  const [confirm, setConfirm] = useState({ open: false, mode: null, contract: null });
  const [busy, setBusy] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rentalContractService.getPendingContracts({
        page,
        limit: 15,
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

  const openConfirm = (mode, contract) => {
    setDetailsContract(null);
    setConfirm({ open: true, mode, contract });
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

      {/* Compact Approval Cards */}
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 1.75 }}>
          {pendingContracts.map((c) => {
            const meta = contractStatusMeta(c.contract_status, c.is_active);
            const graceMonths = parseInt(c.grace_period, 10) || 0;
            return (
              <Paper
                key={c.id}
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  '&:hover': { borderColor: '#c7d2fe', boxShadow: '0 4px 14px rgba(79,70,229,0.08)' },
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Card header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Avatar sx={{ width: 30, height: 30, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                      <ContractIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{ fontSize: '0.83rem', fontWeight: 800, color: '#0f172a', fontFamily: '"Roboto Mono", monospace', lineHeight: 1.25 }}
                      >
                        {c.contract_number}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                        Submitted {formatDate(c.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: '12px !important' }} />}
                    label={meta.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 700,
                      fontSize: '0.62rem',
                      backgroundColor: meta.bg,
                      color: meta.color,
                      border: `1px solid ${meta.border}`,
                      flexShrink: 0,
                    }}
                  />
                </Box>

                <Divider />

                {/* Compact summary */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <CardLine
                    icon={<TenantIcon sx={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }} />}
                    text={c.tenant_organization_name || 'No tenant assigned'}
                  />
                  <CardLine
                    icon={<BuildingIcon sx={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }} />}
                    text={
                      c.building_name
                        ? `${c.building_name}${c.unit_number ? ` • Unit ${c.unit_number}` : ''}`
                        : '—'
                    }
                  />
                  <CardLine
                    icon={<CalendarIcon sx={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }} />}
                    text={`${c.contract_start_date ? formatDate(c.contract_start_date) : '—'} → ${c.contract_end_date ? formatDate(c.contract_end_date) : '—'}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 0.25 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>
                      {c.currency_code || 'ETB'} {formatCurrency(c.rent_amount_total_per_month)}
                      <Typography component="span" sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}> /mo</Typography>
                    </Typography>
                    {graceMonths > 0 && (
                      <Chip
                        icon={<GraceIcon sx={{ fontSize: '11px !important' }} />}
                        label={`${graceMonths} mo grace`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#e0e7ff', color: '#4338ca' }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 0.75, pt: 0.5 }}>
                  <Tooltip title="View full details" arrow placement="top">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setDetailsContract(c)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: 1.5,
                        px: 1,
                        minWidth: 0,
                        borderColor: '#c7d2fe',
                        color: '#4f46e5',
                        '&:hover': { borderColor: '#818cf8', backgroundColor: '#eef2ff' },
                      }}
                    >
                      Details
                    </Button>
                  </Tooltip>
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="Approve — becomes ACTIVE" arrow placement="top">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                      onClick={() => openConfirm('approve', c)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        borderRadius: 1.5,
                        px: 1.25,
                        minWidth: 0,
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        boxShadow: 'none',
                        '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                      }}
                    >
                      Approve
                    </Button>
                  </Tooltip>
                  <Tooltip title="Reject — becomes CANCELLED" arrow placement="top">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                      onClick={() => openConfirm('reject', c)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        borderRadius: 1.5,
                        px: 1.25,
                        minWidth: 0,
                        borderColor: '#fecaca',
                        color: '#dc2626',
                        '&:hover': { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
                      }}
                    >
                      Reject
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

      {/* ── Contract Details Popup ── */}
      <Dialog
        open={Boolean(detailsContract)}
        onClose={() => setDetailsContract(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {detailsContract && (() => {
          const term = calcTerm(detailsContract.contract_start_date, detailsContract.contract_end_date);
          const grace = parseInt(detailsContract.grace_period, 10) || 0;
          const monthly = parseFloat(detailsContract.rent_amount_total_per_month) || 0;
          const billableMonths = Math.max(0, Math.round((term.totalMonths - grace) * 10) / 10);
          const estimatedTotal = Math.round(monthly * billableMonths * 100) / 100;
          const scheduleDue = Number(detailsContract.total_amount_due) || 0;
          const schedulePaid = Number(detailsContract.total_amount_paid) || 0;
          const outstanding = Math.round((scheduleDue - schedulePaid) * 100) / 100;
          const paidPct = scheduleDue > 0 ? Math.min(100, (schedulePaid / scheduleDue) * 100) : 0;
          const cur = detailsContract.currency_code || 'ETB';
          return (
          <>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <Avatar sx={{ width: 34, height: 34, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                  <ContractIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', fontFamily: '"Roboto Mono", monospace' }} noWrap>
                    {detailsContract.contract_number}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Submitted {formatDate(detailsContract.updated_at)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Chip
                  label={contractStatusMeta(detailsContract.contract_status, detailsContract.is_active).label}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    backgroundColor: contractStatusMeta(detailsContract.contract_status, detailsContract.is_active).bg,
                    color: contractStatusMeta(detailsContract.contract_status, detailsContract.is_active).color,
                    border: `1px solid ${contractStatusMeta(detailsContract.contract_status, detailsContract.is_active).border}`,
                  }}
                />
                <IconButton size="small" onClick={() => setDetailsContract(null)}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 1.5 }}>
              {/* Key metrics */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.25, mb: 1 }}>
                <MetricTile label="Monthly Rent" value={`${cur} ${formatCurrency(monthly)}`} sub={`${term.totalMonths} mo lease`} color="#16a34a" bg="#dcfce7" />
                <MetricTile label="Contract Value" value={`${cur} ${formatCurrency(estimatedTotal)}`} sub={grace > 0 ? `${billableMonths} billable mo − ${grace} grace` : `${billableMonths} billable months`} color="#4f46e5" bg="#e0e7ff" />
                <MetricTile label="Outstanding" value={`${cur} ${formatCurrency(outstanding)}`} sub={`${detailsContract.payments_count || 0} installment(s)`} color={outstanding > 0 ? '#dc2626' : '#16a34a'} bg={outstanding > 0 ? '#fecaca' : '#dcfce7'} />
              </Box>

              {/* Payment progress */}
              {scheduleDue > 0 && (
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>Collection Progress</Typography>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#4f46e5' }}>{paidPct.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={paidPct}
                    sx={{
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 4 },
                    }}
                  />
                </Box>
              )}

              {/* Full details in two columns */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 3 }}>
                <Box>
                  <DialogSectionTitle icon={<TenantIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Lessee" />
                  <DialogField label="Tenant Organization" value={detailsContract.tenant_organization_name} />

                  <DialogSectionTitle icon={<BuildingIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Premises" />
                  <DialogField label="Building" value={detailsContract.building_name} />
                  <DialogField
                    label="Floor"
                    value={
                      detailsContract.floor_name || detailsContract.floor_number != null
                        ? `${detailsContract.floor_name || 'Floor'}${detailsContract.floor_number != null ? ` (Level ${detailsContract.floor_number})` : ''}`
                        : null
                    }
                  />
                  <DialogField
                    label="Unit"
                    value={detailsContract.unit_number ? `Unit ${detailsContract.unit_number}` : null}
                  />
                  <DialogField label="Space Use" value={detailsContract.unit_use_type} />
                  <DialogField label="Floor Area" value={detailsContract.area_value ? `${detailsContract.area_value} m²` : null} />

                  <DialogSectionTitle icon={<CalendarIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Lease Term" />
                  <DialogField label="Start Date" value={formatDate(detailsContract.contract_start_date)} />
                  <DialogField label="End Date" value={formatDate(detailsContract.contract_end_date)} />
                  <DialogField
                    label="Duration"
                    value={term.totalDays > 0 ? `${term.totalMonths} months (${term.totalDays} days)` : null}
                  />
                  <DialogField
                    label="Grace Period"
                    value={grace > 0 ? `${grace} month(s) — first installment(s) free` : 'None'}
                  />
                </Box>

                <Box>
                  <DialogSectionTitle icon={<PaymentIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Financials" />
                  <DialogField
                    label="Rent per m²"
                    value={
                      detailsContract.rent_amount_per_square_meter != null
                        ? `${cur} ${formatCurrency(detailsContract.rent_amount_per_square_meter)} /m²`
                        : null
                    }
                  />
                  <DialogField label="Total Monthly Rent" value={`${cur} ${formatCurrency(monthly)}`} />
                  <DialogField label="Estimated Contract Value" value={`${cur} ${formatCurrency(estimatedTotal)}`} />
                  <DialogField
                    label="Currency"
                    value={
                      detailsContract.currency_name
                        ? `${detailsContract.currency_name}${detailsContract.currency_code ? ` (${detailsContract.currency_code})` : ''}`
                        : null
                    }
                  />
                  <DialogField
                    label="Payment Cycle"
                    value={
                      detailsContract.rental_payment_type_name
                        ? `${detailsContract.rental_payment_type_name}${detailsContract.payment_duration_days ? ` (${detailsContract.payment_duration_days} days)` : ''}`
                        : null
                    }
                  />
                  <DialogField label="Payment Timing" value={detailsContract.payment_timing_name} />

                  <DialogSectionTitle icon={<ScheduleIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Payment Schedule" />
                  <DialogField label="Installments on Record" value={`${detailsContract.payments_count || 0} installment(s)`} />
                  <DialogField label="Total Due" value={`${cur} ${formatCurrency(scheduleDue)}`} />
                  <DialogField label="Total Paid" value={`${cur} ${formatCurrency(schedulePaid)}`} />
                  <DialogField label="Outstanding" value={`${cur} ${formatCurrency(outstanding)}`} />

                  <DialogSectionTitle icon={<ContractIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Record & Audit" />
                  <DialogField label="Lease Status" value={contractStatusMeta(detailsContract.contract_status, detailsContract.is_active).label} />
                  <DialogField label="Account Status" value={detailsContract.is_active ? 'Active' : 'Inactive'} />
                  <DialogField
                    label="Created"
                    value={
                      detailsContract.created_by_name
                        ? `${detailsContract.created_by_name} • ${formatDate(detailsContract.created_at)}`
                        : formatDate(detailsContract.created_at)
                    }
                  />
                  <DialogField
                    label="Last Updated"
                    value={
                      detailsContract.updated_by_name
                        ? `${detailsContract.updated_by_name} • ${formatDate(detailsContract.updated_at)}`
                        : formatDate(detailsContract.updated_at)
                    }
                  />
                </Box>
              </Box>

              {detailsContract.remarks && (
                <>
                  <DialogSectionTitle icon={<ContractIcon sx={{ fontSize: 14, color: '#4f46e5' }} />} title="Remarks & Stipulations" />
                  <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {detailsContract.remarks}
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'nowrap' }}>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                startIcon={<RejectIcon sx={{ fontSize: 16 }} />}
                onClick={() => openConfirm('reject', detailsContract)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  borderRadius: 2,
                  borderColor: '#fecaca',
                  color: '#dc2626',
                  '&:hover': { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<ApproveIcon sx={{ fontSize: 16 }} />}
                onClick={() => openConfirm('approve', detailsContract)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                }}
              >
                Approve
              </Button>
            </DialogActions>
          </>
          );
        })()}
      </Dialog>

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
