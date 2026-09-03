import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  LinearProgress,
  Alert,
  Skeleton,
  Grid,
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
  Business as BuildingIcon,
  Add as AddIcon,
  Autorenew as GenerateIcon,
  Block as DeactivateIcon,
  TaskAlt as ActivateIcon,
  Close as CloseIcon,
  BusinessCenter as TenantIcon,
  Receipt as ReceiptIcon,
  TrendingDown as OutstandingIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService, rentalPaymentsService } from '../../services/rentalContractServices';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const formatCurrency = (val) => {
  if (val == null || val === '') return '—';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const InfoRow = ({ label, value, valueColor }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
    <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.78rem', color: valueColor || '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
      {value || '—'}
    </Typography>
  </Box>
);

const PaymentStatusChip = ({ isPaid, dueDate }) => {
  if (isPaid) {
    return <Chip icon={<PaidIcon sx={{ fontSize: '14px !important' }} />} label="Paid" size="small" sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.68rem' }} />;
  }
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  if (isOverdue) {
    return <Chip icon={<OverdueIcon sx={{ fontSize: '14px !important' }} />} label="Overdue" size="small" sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.68rem' }} />;
  }
  return <Chip icon={<UnpaidIcon sx={{ fontSize: '14px !important' }} />} label="Pending" size="small" sx={{ backgroundColor: '#fef9c3', color: '#ca8a04', fontWeight: 700, fontSize: '0.68rem' }} />;
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
  const [activeTab, setActiveTab] = useState(0);

  // Toggle modal
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Generate schedule
  const [generating, setGenerating] = useState(false);

  // Pay Dialog
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
    } catch {}
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchContract();
      setLoading(false);
    };
    init();
  }, [fetchContract]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchPayments();
      fetchPaymentStats();
    }
  }, [activeTab, fetchPayments, fetchPaymentStats]);

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
        <Skeleton variant="text" width={350} height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} variant="text" sx={{ mb: 1 }} />)}
          </Paper>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="text" sx={{ mb: 1 }} />)}
          </Paper>
        </Box>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Contract not found.</Alert>
        <Button onClick={() => navigate('/contracts')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>Back to Contracts</Button>
      </Box>
    );
  }

  const outstanding = (Number(contract.total_amount_due) || 0) - (Number(contract.total_amount_paid) || 0);
  const paidPct = contract.total_amount_due > 0 ? Math.min(100, (Number(contract.total_amount_paid) / Number(contract.total_amount_due)) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/" sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>Dashboard</Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/contracts" sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>Rental Contracts</Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{contract.contract_number}</Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Contract: {contract.contract_number}
          </Typography>
          <Chip
            label={contract.is_active ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              backgroundColor: contract.is_active ? '#dcfce7' : '#fee2e2',
              color: contract.is_active ? '#16a34a' : '#dc2626',
              fontWeight: 700, fontSize: '0.72rem',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/contracts')}
            sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/contracts/${id}/edit`)}
            sx={{ borderRadius: 2, borderColor: '#0284c7', color: '#0284c7', fontWeight: 600, fontSize: '0.82rem' }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={contract.is_active ? <DeactivateIcon /> : <ActivateIcon />}
            onClick={() => setToggleModalOpen(true)}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.82rem',
              borderColor: contract.is_active ? '#dc2626' : '#16a34a',
              color: contract.is_active ? '#dc2626' : '#16a34a',
            }}
          >
            {contract.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', minHeight: 48 },
            '& .Mui-selected': { color: '#4f46e5' },
            '& .MuiTabs-indicator': { backgroundColor: '#4f46e5' },
          }}
        >
          <Tab label="Contract Information" icon={<ContractIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label={`Payments & Schedule (${contract.payments_count || 0})`} icon={<PaymentIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Contract Information */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              {/* Property Info */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BuildingIcon sx={{ fontSize: 15 }} /> Property
                </Typography>
                <InfoRow label="Building" value={contract.building_name} />
                <InfoRow label="Floor" value={`${contract.floor_name || ''} (Floor ${contract.floor_number})`} />
                <InfoRow label="Unit Number" value={contract.unit_number} />
                <InfoRow label="Area" value={contract.area_value ? `${contract.area_value} m²` : null} />
                <InfoRow label="Use Type" value={contract.unit_use_type} />
                <InfoRow label="Tenant" value={contract.tenant_organization_name} />
              </Box>

              {/* Contract Details */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 15 }} /> Contract Details
                </Typography>
                <InfoRow label="Contract #" value={contract.contract_number} />
                <InfoRow label="Start Date" value={formatDate(contract.contract_start_date)} />
                <InfoRow label="End Date" value={formatDate(contract.contract_end_date)} />
                <InfoRow label="Payment Type" value={`${contract.rental_payment_type_name || '—'}${contract.payment_duration_days ? ` (${contract.payment_duration_days} days)` : ''}`} />
                <InfoRow label="Payment Timing" value={contract.payment_timing_name} />
                <InfoRow label="Status" value={contract.is_active ? 'Active' : 'Inactive'} valueColor={contract.is_active ? '#16a34a' : '#dc2626'} />
                {contract.remarks && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>REMARKS</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#334155', mt: 0.25 }}>{contract.remarks}</Typography>
                  </Box>
                )}
              </Box>

              {/* Financial Summary */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MoneyIcon sx={{ fontSize: 15 }} /> Financial Summary
                </Typography>
                <InfoRow label="Monthly Rent" value={`ETB ${formatCurrency(contract.rent_amount_total_per_month)}`} valueColor="#4f46e5" />
                <InfoRow label="Rate per m²" value={contract.rent_amount_per_square_meter ? `ETB ${formatCurrency(contract.rent_amount_per_square_meter)}` : null} />
                <InfoRow label="Payments Made" value={`${contract.payments_count || 0} records`} />
                <InfoRow label="Total Due" value={`ETB ${formatCurrency(contract.total_amount_due)}`} valueColor="#dc2626" />
                <InfoRow label="Total Paid" value={`ETB ${formatCurrency(contract.total_amount_paid)}`} valueColor="#16a34a" />
                <InfoRow
                  label="Outstanding"
                  value={`ETB ${formatCurrency(outstanding)}`}
                  valueColor={outstanding > 0 ? '#dc2626' : '#16a34a'}
                />

                {/* Progress bar */}
                {Number(contract.total_amount_due) > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Payment Progress</Typography>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5' }}>{paidPct.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={paidPct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Payments & Schedule */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {/* Payment Stats */}
            {paymentStats && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                {[
                  { label: 'Total Due', value: `ETB ${formatCurrency(paymentStats.totalAmountDue)}`, color: '#dc2626', bg: '#fee2e2', icon: <ReceiptIcon sx={{ fontSize: 20, color: '#dc2626' }} /> },
                  { label: 'Total Paid', value: `ETB ${formatCurrency(paymentStats.totalAmountPaid)}`, color: '#16a34a', bg: '#dcfce7', icon: <PaidIcon sx={{ fontSize: 20, color: '#16a34a' }} /> },
                  { label: 'Outstanding', value: `ETB ${formatCurrency(paymentStats.totalOutstanding)}`, color: '#ca8a04', bg: '#fef9c3', icon: <OutstandingIcon sx={{ fontSize: 20, color: '#ca8a04' }} /> },
                  { label: 'Overdue', value: `${paymentStats.overdueCount || 0} schedule(s)`, color: '#7c3aed', bg: '#ede9fe', icon: <OverdueIcon sx={{ fontSize: 20, color: '#7c3aed' }} /> },
                ].map((card) => (
                  <Paper key={card.label} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: card.bg }}>{card.icon}</Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{card.label}</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: card.color }}>{card.value}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Generate schedule button */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={generating ? <CircularProgress size={14} /> : <GenerateIcon />}
                onClick={handleGenerateSchedule}
                disabled={generating}
                sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.82rem', borderColor: '#4f46e5', color: '#4f46e5' }}
              >
                {generating ? 'Generating...' : 'Generate / Extend Schedule'}
              </Button>
            </Box>

            {/* Payments Table */}
            {loadingPayments ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
              </Box>
            ) : (
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>DUE DATE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>NEXT PAYMENT</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'right' }}>AMOUNT DUE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'right' }}>AMOUNT PAID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>REFERENCE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                          <PaymentIcon sx={{ fontSize: 36, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                          No payment schedules yet. Click "Generate / Extend Schedule" to create them.
                        </TableCell>
                      </TableRow>
                    )}
                    {payments.map((p, idx) => (
                      <TableRow key={p.id} hover sx={{ backgroundColor: p.is_paid ? '#f0fdf4' : (new Date(p.due_date) < new Date() && !p.is_paid ? '#fff7ed' : 'inherit') }}>
                        <TableCell sx={{ fontSize: '0.78rem', color: '#64748b' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                            {formatDate(p.due_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {formatDate(p.next_payment_date)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                            ETB {formatCurrency(p.amount_due)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a' }}>
                            {p.amount_paid ? `ETB ${formatCurrency(p.amount_paid)}` : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
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
                        <TableCell sx={{ textAlign: 'center' }}>
                          {!p.is_paid && (
                            <Tooltip title="Record Payment">
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
                                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                  boxShadow: 'none',
                                  '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                                }}
                              >
                                Pay
                              </Button>
                            </Tooltip>
                          )}
                          {p.is_paid && (
                            <Chip label="✓ Done" size="small" sx={{ fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 700 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Record Payment Dialog */}
      <Dialog open={payDialog.open} onClose={() => setPayDialog({ open: false, payment: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
                Due Date: <strong>{formatDate(payDialog.payment.due_date)}</strong> • Amount Due: <strong>ETB {formatCurrency(payDialog.payment.amount_due)}</strong>
              </Typography>
            </Box>
          )}
          {payError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{payError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required fullWidth size="small" type="number" label="Amount Paid (ETB)"
              value={payAmount}
              onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }}
              InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
              inputProps={{ min: 0, step: 'any' }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              required fullWidth size="small" type="date" label="Payment Date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth size="small" label="Transaction Reference"
              placeholder="e.g. TXN-98421, Bank receipt #"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth size="small" multiline rows={2} label="Notes / Remarks"
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
            sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#cbd5e1', color: '#475569' }}
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
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
            }}
          >
            {recordingPayment ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Modal */}
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
