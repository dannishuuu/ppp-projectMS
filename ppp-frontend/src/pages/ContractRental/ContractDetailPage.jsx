import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Breadcrumbs,
  Link,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
  CheckCircle as PaidIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Warning as OverdueIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Apartment as BuildingIcon,
  Autorenew as GenerateIcon,
  Block as DeactivateIcon,
  TaskAlt as ActivateIcon,
  Close as CloseIcon,
  ReceiptLong as ReceiptIcon,
  TrendingDown as OutstandingIcon,
  MeetingRoom as UnitIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService, rentalPaymentsService } from '../../services/rentalContractServices';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const formatCurrency = (val) => {
  if (val == null || val === '') return '0.00';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const FormSectionHeader = ({ icon, title, subtitle, badge }) => (
  <Box sx={{ mb: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 1.5,
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
          {title}
        </Typography>
      </Box>
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }}
        />
      )}
    </Box>
    {subtitle && (
      <Typography sx={{ fontSize: '0.78rem', color: '#64748b', ml: 4.5 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

const DetailField = ({ label, value, highlight }) => (
  <Box sx={{ width: '100%' }}>
    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
      {label}
    </Typography>
    <Box
      sx={{
        p: 1.25,
        px: 1.5,
        borderRadius: 2,
        backgroundColor: highlight ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${highlight ? '#bbf7d0' : '#e2e8f0'}`,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: highlight ? 800 : 700,
          color: highlight ? '#16a34a' : value ? '#0f172a' : '#94a3b8',
          fontFamily: label.toLowerCase().includes('reference') || label.toLowerCase().includes('contract #') ? 'monospace' : 'inherit',
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const PaymentStatusChip = ({ isPaid, dueDate }) => {
  if (isPaid) {
    return (
      <Chip
        icon={<PaidIcon sx={{ fontSize: '14px !important' }} />}
        label="Paid"
        size="small"
        sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.68rem' }}
      />
    );
  }
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  if (isOverdue) {
    return (
      <Chip
        icon={<OverdueIcon sx={{ fontSize: '14px !important' }} />}
        label="Overdue"
        size="small"
        sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.68rem' }}
      />
    );
  }
  return (
    <Chip
      icon={<UnpaidIcon sx={{ fontSize: '14px !important' }} />}
      label="Pending"
      size="small"
      sx={{ backgroundColor: '#fef9c3', color: '#ca8a04', fontWeight: 700, fontSize: '0.68rem' }}
    />
  );
};

export const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [payDialog, setPayDialog] = useState({ open: false, payment: null });
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchContract = useCallback(async () => {
    try {
      const res = await rentalContractService.getContractById(id);
      setContract(res?.contract || res);
    } catch {
      enqueueSnackbar('Failed to load contract.', { variant: 'error' });
    }
  }, [id, enqueueSnackbar]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await rentalContractService.getContractPayments(id);
      setPayments(res?.payments || res?.rows || res || []);
    } catch {
      enqueueSnackbar('Failed to load payment schedule.', { variant: 'error' });
    } finally {
      setLoadingPayments(false);
    }
  }, [id, enqueueSnackbar]);

  const fetchPaymentStats = useCallback(async () => {
    try {
      const res = await rentalPaymentsService.getPaymentStats({ rentalContractId: id });
      setPaymentStats(res);
    } catch {
      /* optional stats */
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchContract(), fetchPayments(), fetchPaymentStats()]);
      setLoading(false);
    };
    init();
  }, [fetchContract, fetchPayments, fetchPaymentStats]);

  const termCalculations = useMemo(() => {
    if (!contract?.contract_start_date || !contract?.contract_end_date) {
      return { totalDays: 0, totalMonths: 0, isValidRange: true };
    }
    const startStr = contract.contract_start_date.slice(0, 10);
    const endStr = contract.contract_end_date.slice(0, 10);
    const [sY, sM, sD] = startStr.split('-').map(Number);
    const [eY, eM, eD] = endStr.split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const diffMs = endUTC - startUTC;
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const totalMonths = Math.max(0, Math.round((totalDays / 30.4375) * 10) / 10);
    const isValidRange = endUTC > startUTC;
    return { totalDays, totalMonths, isValidRange };
  }, [contract?.contract_start_date, contract?.contract_end_date]);

  const totalContractValue = useMemo(() => {
    const monthly = parseFloat(contract?.rent_amount_total_per_month) || 0;
    if (monthly <= 0 || termCalculations.totalMonths <= 0) return 0;
    return Math.round(monthly * termCalculations.totalMonths * 100) / 100;
  }, [contract?.rent_amount_total_per_month, termCalculations.totalMonths]);

  const outstanding = useMemo(() => {
    const due = Number(contract?.total_amount_due) || Number(paymentStats?.totalAmountDue) || 0;
    const paid = Number(contract?.total_amount_paid) || Number(paymentStats?.totalAmountPaid) || 0;
    return due - paid;
  }, [contract, paymentStats]);

  const paidPct = useMemo(() => {
    const due = Number(contract?.total_amount_due) || Number(paymentStats?.totalAmountDue) || 0;
    const paid = Number(contract?.total_amount_paid) || Number(paymentStats?.totalAmountPaid) || 0;
    if (due <= 0) return 0;
    return Math.min(100, (paid / due) * 100);
  }, [contract, paymentStats]);

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      await rentalContractService.toggleContractStatus(id);
      enqueueSnackbar(`Contract ${contract?.is_active ? 'deactivated' : 'activated'} successfully.`, { variant: 'success' });
      setToggleModalOpen(false);
      fetchContract();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to toggle status.', { variant: 'error' });
    } finally {
      setToggling(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    try {
      const res = await rentalContractService.generateSchedule(id);
      enqueueSnackbar(res?.message || 'Payment schedule generated successfully!', { variant: 'success' });
      fetchPayments();
      fetchPaymentStats();
      fetchContract();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to generate schedule.', { variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const openPayDialog = (payment) => {
    setPayDialog({ open: true, payment });
    setPayAmount(payment.amount_due ? String(payment.amount_due) : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayNote('');
    setPayError('');
  };

  const handleRecordPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setPayError('Payment amount must be greater than 0.');
      return;
    }
    if (!payDate) {
      setPayError('Payment date is required.');
      return;
    }
    setRecordingPayment(true);
    setPayError('');
    try {
      await rentalPaymentsService.recordPayment(payDialog.payment.id, {
        amountPaid: parseFloat(payAmount),
        paymentDate: payDate,
        transactionReference: payRef.trim() || null,
        remarks: payNote.trim() || null,
      });
      enqueueSnackbar('Payment recorded successfully!', { variant: 'success' });
      setPayDialog({ open: false, payment: null });
      fetchPayments();
      fetchPaymentStats();
      fetchContract();
    } catch (err) {
      setPayError(err.message || 'Failed to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
        <Skeleton variant="text" width={320} height={36} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(5, 1fr)' }, gap: '16px' }}>
          <Box sx={{ gridColumn: { xs: '1', lg: 'span 4' } }}>
            {[1, 2, 3, 4].map((i) => (
              <Paper key={i} elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Skeleton variant="rounded" height={45} />
                  <Skeleton variant="rounded" height={45} />
                </Box>
              </Paper>
            ))}
          </Box>
          <Box sx={{ gridColumn: { xs: '1', lg: 'span 1' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 2 }}>
              <Skeleton variant="rounded" height={300} />
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="error" sx={{ borderRadius: 2.5 }}>Contract not found.</Alert>
        <Button
          onClick={() => navigate('/contracts')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
        >
          Back to Contracts
        </Button>
      </Box>
    );
  }

  const startDate = contract.contract_start_date ? contract.contract_start_date.slice(0, 10) : '';
  const endDate = contract.contract_end_date ? contract.contract_end_date.slice(0, 10) : '';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Top Header & Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/contracts" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Rental Contracts
            </Link>
            <Typography sx={{ color: '#475569', fontWeight: 600 }}>
              {contract.contract_number}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/contracts')}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#475569',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              Back to Contracts
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate(`/contracts/${id}/edit`)}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#4f46e5',
                borderColor: '#c7d2fe',
                '&:hover': { borderColor: '#818cf8', backgroundColor: '#eef2ff' },
              }}
            >
              Edit Lease
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={contract.is_active ? <DeactivateIcon sx={{ fontSize: 16 }} /> : <ActivateIcon sx={{ fontSize: 16 }} />}
              onClick={() => setToggleModalOpen(true)}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderColor: contract.is_active ? '#fecaca' : '#bbf7d0',
                color: contract.is_active ? '#dc2626' : '#16a34a',
                '&:hover': {
                  borderColor: contract.is_active ? '#fca5a5' : '#86efac',
                  backgroundColor: contract.is_active ? '#fef2f2' : '#f0fdf4',
                },
              }}
            >
              {contract.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              Rental Contract: {contract.contract_number}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
              View lease terms, financial pricing, premises allocation, and payment schedule.
            </Typography>
          </Box>
          <Chip
            label={contract.is_active ? 'Active Contract' : 'Inactive / Draft'}
            color={contract.is_active ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          />
        </Box>
      </Box>

      {/* Main Grid Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(5, 1fr)' },
          gap: '16px',
        }}
      >
        {/* LEFT: Detail Cards */}
        <Box
          sx={{
            gridColumn: { xs: '1', lg: 'span 4' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* CARD 1: Premises & Unit */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <FormSectionHeader
              icon={<BuildingIcon sx={{ fontSize: 18 }} />}
              title="Premises & Unit Selection"
              subtitle="Building, floor level, and leased unit allocation"
              badge="Space Allocation"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 2.5,
                rowGap: 2,
              }}
            >
              <DetailField label="Target Building" value={contract.building_name} />
              <DetailField
                label="Floor Level"
                value={
                  contract.floor_name || contract.floor_number != null
                    ? `${contract.floor_name || 'Floor'}${contract.floor_number != null ? ` (Floor ${contract.floor_number})` : ''}`
                    : null
                }
              />
              <DetailField label="Building Unit" value={contract.unit_number ? `Unit ${contract.unit_number}` : null} />
              <DetailField
                label="Tenant Organization"
                value={contract.tenant_organization_name || 'Individual / Unspecified Tenant'}
              />
            </Box>

            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UnitIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                    Unit {contract.unit_number || '—'}
                    {contract.floor_number != null ? ` • Floor ${contract.floor_number}` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Use Type: {contract.unit_use_type || 'Commercial Space'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Floor Area</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    {contract.area_value ? `${contract.area_value} m²` : 'Not Specified'}
                  </Typography>
                </Box>
                <Chip
                  label={contract.is_active ? 'Leased Unit' : 'Inactive Lease'}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: contract.is_active ? '#e0e7ff' : '#f1f5f9',
                    color: contract.is_active ? '#4338ca' : '#64748b',
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* CARD 2: Lease Term */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <FormSectionHeader
              icon={<CalendarIcon sx={{ fontSize: 18 }} />}
              title="Lease Term & Agreement Schedule"
              subtitle="Contract timeline, tenure duration, and key dates"
              badge="Timeline"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 2.5,
                rowGap: 2,
              }}
            >
              <DetailField label="Contract Reference Number" value={contract.contract_number} />
              <DetailField label="Contract Start Date" value={formatDate(startDate)} />
              <DetailField label="Contract End Date" value={formatDate(endDate)} />
              <DetailField
                label="Lease Duration"
                value={
                  termCalculations.totalDays > 0
                    ? `${termCalculations.totalMonths} Months (${termCalculations.totalDays} Days)`
                    : null
                }
              />
            </Box>

            {termCalculations.totalDays > 0 && (
              <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CalendarIcon sx={{ fontSize: 14 }} />}
                  label={`Tenure: ${termCalculations.totalMonths} Months (${termCalculations.totalDays} Days)`}
                  size="small"
                  sx={{
                    backgroundColor: termCalculations.isValidRange ? '#f0fdf4' : '#fef2f2',
                    color: termCalculations.isValidRange ? '#15803d' : '#b91c1c',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: `1px solid ${termCalculations.isValidRange ? '#bbf7d0' : '#fecaca'}`,
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* CARD 3: Financial Terms */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <FormSectionHeader
              icon={<PaymentIcon sx={{ fontSize: 18 }} />}
              title="Financial Terms & Rent Calculator"
              subtitle="Pricing matrix, billing frequency, and recurring rent"
              badge="Financials"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 2.5,
                rowGap: 2,
              }}
            >
              <DetailField
                label="Payment Frequency"
                value={
                  contract.rental_payment_type_name
                    ? `${contract.rental_payment_type_name}${contract.payment_duration_days ? ` (${contract.payment_duration_days} days)` : ''}`
                    : null
                }
              />
              <DetailField label="Payment Timing" value={contract.payment_timing_name} />
              <DetailField
                label="Rent per Square Meter"
                value={
                  contract.rent_amount_per_square_meter != null
                    ? `ETB ${formatCurrency(contract.rent_amount_per_square_meter)} /m²`
                    : null
                }
              />
              <DetailField
                label="Total Monthly Rent"
                value={`ETB ${formatCurrency(contract.rent_amount_total_per_month)}`}
                highlight
              />
            </Box>

            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Estimated Contract Value</Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#4f46e5' }}>
                  ETB {formatCurrency(totalContractValue)}
                </Typography>
              </Box>
              {contract.rental_payment_type_name && (
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                  Billed {contract.rental_payment_type_name.toLowerCase()}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* CARD 4: Remarks */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <FormSectionHeader
              icon={<ContractIcon sx={{ fontSize: 18 }} />}
              title="Operational Settings & Stipulations"
              subtitle="Contract activation status and compliance remarks"
              badge="Execution"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2 }}>
              <DetailField label="Contract Status" value={contract.is_active ? 'Active' : 'Inactive'} highlight={contract.is_active} />
              <DetailField label="Payment Records" value={`${contract.payments_count || payments.length || 0} installment(s)`} />
            </Box>

            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
              Contract Remarks & Stipulations
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                minHeight: 80,
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', color: contract.remarks ? '#334155' : '#94a3b8', lineHeight: 1.6 }}>
                {contract.remarks || 'No remarks or special stipulations recorded.'}
              </Typography>
            </Box>
          </Paper>

          {/* CARD 5: Payment Schedule */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3, pb: 2 }}>
              <FormSectionHeader
                icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
                title="Automated Payment Schedule"
                subtitle="Installment ledger, payment status, and schedule management"
                badge={`${payments.length} Installments`}
              />

              {paymentStats && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
                  {[
                    { label: 'Total Due', value: `ETB ${formatCurrency(paymentStats.totalAmountDue)}`, color: '#dc2626', bg: '#fee2e2', icon: <ReceiptIcon sx={{ fontSize: 18, color: '#dc2626' }} /> },
                    { label: 'Total Paid', value: `ETB ${formatCurrency(paymentStats.totalAmountPaid)}`, color: '#16a34a', bg: '#dcfce7', icon: <PaidIcon sx={{ fontSize: 18, color: '#16a34a' }} /> },
                    { label: 'Outstanding', value: `ETB ${formatCurrency(paymentStats.totalOutstanding)}`, color: '#ca8a04', bg: '#fef9c3', icon: <OutstandingIcon sx={{ fontSize: 18, color: '#ca8a04' }} /> },
                    { label: 'Overdue', value: `${paymentStats.overdueCount || 0} schedule(s)`, color: '#7c3aed', bg: '#ede9fe', icon: <OverdueIcon sx={{ fontSize: 18, color: '#7c3aed' }} /> },
                  ].map((card) => (
                    <Paper key={card.label} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: card.bg }}>{card.icon}</Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{card.label}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: card.color }}>{card.value}</Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={generating ? <CircularProgress size={14} /> : <GenerateIcon />}
                onClick={handleGenerateSchedule}
                disabled={generating}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderColor: '#c7d2fe',
                  color: '#4f46e5',
                  '&:hover': { borderColor: '#818cf8', backgroundColor: '#eef2ff' },
                }}
              >
                {generating ? 'Generating...' : 'Generate / Extend Schedule'}
              </Button>
            </Box>

            {loadingPayments ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
              </Box>
            ) : payments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                </Box>
                <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>
                  No Payment Schedule Yet
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', maxWidth: 360, mx: 'auto' }}>
                  Click &quot;Generate / Extend Schedule&quot; to create recurring payment installments for this contract.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 3, py: 1.25, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {payments.length} installments on record
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                    Total Due: ETB {formatCurrency(payments.reduce((acc, p) => acc + (Number(p.amount_due) || 0), 0))}
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 520, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { background: '#f1f5f9' }, '&::-webkit-scrollbar-thumb': { background: '#c7d2fe', borderRadius: 4 } }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#f8fafc', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75, px: 2 } }}>
                        <TableCell>#</TableCell>
                        <TableCell>DUE DATE</TableCell>
                        <TableCell>NEXT PAYMENT</TableCell>
                        <TableCell align="right">AMOUNT DUE</TableCell>
                        <TableCell align="right">AMOUNT PAID</TableCell>
                        <TableCell align="center">STATUS</TableCell>
                        <TableCell>REFERENCE</TableCell>
                        <TableCell align="center">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p, idx) => (
                        <TableRow
                          key={p.id}
                          hover
                          sx={{
                            backgroundColor: p.is_paid ? '#f0fdf4' : new Date(p.due_date) < new Date() && !p.is_paid ? '#fff7ed' : 'inherit',
                            '& td': { fontSize: '0.74rem', py: 0.85, px: 2 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#4f46e5' }}>#{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(p.due_date)}</TableCell>
                          <TableCell sx={{ color: '#64748b' }}>{formatDate(p.next_payment_date)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#dc2626' }}>
                            ETB {formatCurrency(p.amount_due)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>
                            {p.amount_paid ? `ETB ${formatCurrency(p.amount_paid)}` : '—'}
                          </TableCell>
                          <TableCell align="center">
                            <PaymentStatusChip isPaid={p.is_paid} dueDate={p.due_date} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {p.transaction_reference || '—'}
                            </Typography>
                            {p.payment_date && (
                              <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                Paid: {formatDate(p.payment_date)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {!p.is_paid ? (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => openPayDialog(p)}
                                sx={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  borderRadius: 1.5,
                                  px: 1.5,
                                  py: 0.25,
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                  boxShadow: 'none',
                                  '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                                }}
                              >
                                Pay
                              </Button>
                            ) : (
                              <Chip label="Done" size="small" sx={{ fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 700 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Box>

        {/* RIGHT: Sidebar */}
        <Box
          sx={{
            gridColumn: { xs: '1', lg: 'span 1' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Lease Agreement Preview */}
          <Paper
            elevation={0}
            sx={{
              height: 'fit-content',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2.25,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    backgroundColor: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ContractIcon sx={{ fontSize: 18, color: '#818cf8' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                    Lease Agreement
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Contract Overview
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={contract.contract_number}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(99,102,241,0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.3)',
                  fontFamily: 'monospace',
                }}
              />
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Premises
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Unit {contract.unit_number || '—'}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {contract.building_name || 'Building'}
                  {contract.floor_number != null ? ` • Floor ${contract.floor_number}` : ''}
                  {contract.area_value ? ` • ${contract.area_value} m²` : ''}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Lessee / Tenant
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  {contract.tenant_organization_name || 'Individual / Unspecified Tenant'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                  Term & Duration
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                  {startDate || 'Start'} → {endDate || 'End'}
                </Typography>
                {termCalculations.totalDays > 0 && (
                  <Typography sx={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                    {termCalculations.totalMonths} Months ({termCalculations.totalDays} Days)
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box sx={{ backgroundColor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Rate / m²</Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                    ETB {formatCurrency(contract.rent_amount_per_square_meter || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Monthly Rent</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                    ETB {formatCurrency(contract.rent_amount_total_per_month || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.75, borderTop: '1px dashed #cbd5e1' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Contract Value</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#4f46e5' }}>
                    ETB {formatCurrency(totalContractValue)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Progress */}
            {(Number(contract.total_amount_due) > 0 || paymentStats?.totalAmountDue > 0) && (
              <Box sx={{ mx: 3, mb: 2, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Payment Progress</Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5' }}>{paidPct.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paidPct}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                      borderRadius: 4,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>
                    Paid: ETB {formatCurrency(contract.total_amount_paid || paymentStats?.totalAmountPaid)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: outstanding > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    Due: ETB {formatCurrency(outstanding)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Contract Health Checklist */}
            <Box sx={{ mx: 3, mb: 2, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25 }}>
                Contract Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {[
                  { done: !!(contract.building_name && contract.unit_number), label: 'Premises allocated' },
                  { done: !!(startDate && endDate && termCalculations.isValidRange), label: 'Valid lease duration' },
                  { done: !!(contract.rental_payment_type_name && contract.payment_timing_name), label: 'Payment terms set' },
                  { done: !!(contract.rent_amount_total_per_month && parseFloat(contract.rent_amount_total_per_month) > 0), label: 'Rent configured' },
                  { done: payments.length > 0, label: 'Payment schedule exists' },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: item.done ? '#dcfce7' : '#fef3c7',
                        border: `1.5px solid ${item.done ? '#86efac' : '#fde68a'}`,
                        flexShrink: 0,
                      }}
                    >
                      {item.done ? (
                        <CheckCircleIcon sx={{ fontSize: 12, color: '#16a34a' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 11, color: '#f59e0b' }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.74rem', color: item.done ? '#15803d' : '#78350f', fontWeight: item.done ? 600 : 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Sidebar Actions */}
            <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={() => navigate(`/contracts/${id}/edit`)}
                sx={{
                  py: 1.25,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                    boxShadow: '0 6px 20px rgba(79,70,229,0.45)',
                  },
                }}
              >
                Edit Lease
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={contract.is_active ? <DeactivateIcon /> : <ActivateIcon />}
                onClick={() => setToggleModalOpen(true)}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: contract.is_active ? '#fecaca' : '#bbf7d0',
                  color: contract.is_active ? '#dc2626' : '#16a34a',
                }}
              >
                {contract.is_active ? 'Deactivate Contract' : 'Activate Contract'}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Record Payment Dialog */}
      <Dialog
        open={payDialog.open}
        onClose={() => setPayDialog({ open: false, payment: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ color: '#16a34a' }} />
            Record Payment
          </Box>
          <IconButton size="small" onClick={() => setPayDialog({ open: false, payment: null })}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {payDialog.payment && (
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2.5 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', mb: 0.5 }}>SCHEDULE DETAILS</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#334155' }}>
                Due Date: <strong>{formatDate(payDialog.payment.due_date)}</strong> • Amount Due:{' '}
                <strong>ETB {formatCurrency(payDialog.payment.amount_due)}</strong>
              </Typography>
            </Box>
          )}
          {payError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{payError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              type="number"
              label="Amount Paid (ETB)"
              value={payAmount}
              onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
              InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
              inputProps={{ min: 0, step: 'any' }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                Payment Date <span style={{ color: '#dc2626' }}>*</span>
              </Typography>
              <TextField
                required
                fullWidth
                size="small"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Transaction Reference"
              placeholder="e.g. TXN-98421, Bank receipt #"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Notes / Remarks"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setPayDialog({ open: false, payment: null })}
            disabled={recordingPayment}
            sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={recordingPayment}
            startIcon={recordingPayment ? <CircularProgress size={14} color="inherit" /> : <PaidIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
            }}
          >
            {recordingPayment ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={toggleModalOpen}
        title={contract.is_active ? 'Deactivate Contract' : 'Activate Contract'}
        message={
          contract.is_active
            ? `Are you sure you want to deactivate contract "${contract.contract_number}"? The unit will be marked as available.`
            : `Are you sure you want to reactivate contract "${contract.contract_number}"?`
        }
        onConfirm={handleToggleStatus}
        onClose={() => setToggleModalOpen(false)}
        loading={toggling}
      />
    </Box>
  );
};

export default ContractDetailPage;
