import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  Alert,
  InputAdornment,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
  CalendarMonth as CalendarIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { rentalPaymentTypesService } from '../../services/foundationService/rentalPaymentTypesService';
import { paymentTimingsService } from '../../services/foundationService/paymentTimingsService';
import { organizationService } from '../../services/organizationService/organizationService';

const SectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {icon}
      {title}
    </Typography>
    {subtitle && <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }}>{subtitle}</Typography>}
    <Divider sx={{ mt: 1 }} />
  </Box>
);

export const ContractEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [original, setOriginal] = useState(null);
  const [formData, setFormData] = useState({
    tenantOrganizationId: '',
    contractNumber: '',
    contractStartDate: '',
    contractEndDate: '',
    rentalPaymentTypeId: '',
    paymentTimingId: '',
    rentAmountPerSquareMeter: '',
    rentAmountTotalPerMonth: '',
    remarks: '',
  });

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTimings, setPaymentTimings] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        const [contractRes, ptRes, timRes, orgRes] = await Promise.all([
          rentalContractService.getContractById(id),
          rentalPaymentTypesService.getRentalPaymentTypes({ limit: 100, status: 'active' }),
          paymentTimingsService.getPaymentTimings({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 200, status: 'active' }),
        ]);

        const c = contractRes?.contract || contractRes;
        setOriginal(c);
        setFormData({
          tenantOrganizationId: c.tenant_organization_id || '',
          contractNumber: c.contract_number || '',
          contractStartDate: c.contract_start_date ? c.contract_start_date.slice(0, 10) : '',
          contractEndDate: c.contract_end_date ? c.contract_end_date.slice(0, 10) : '',
          rentalPaymentTypeId: c.rental_payment_type_id || '',
          paymentTimingId: c.payment_timing_id || '',
          rentAmountPerSquareMeter: c.rent_amount_per_square_meter ?? '',
          rentAmountTotalPerMonth: c.rent_amount_total_per_month ?? '',
          remarks: c.remarks || '',
        });

        setPaymentTypes(ptRes?.rentalPaymentTypes || ptRes?.rows || []);
        setPaymentTimings(timRes?.paymentTimings || timRes?.rows || []);
        setOrganizations(orgRes?.organizations || orgRes?.rows || []);
      } catch (err) {
        enqueueSnackbar('Failed to load contract data.', { variant: 'error' });
      } finally {
        setLoadingPage(false);
      }
    };
    init();
  }, [id, enqueueSnackbar]);

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const validate = () => {
    if (!formData.contractNumber.trim()) return 'Contract number is required.';
    if (!formData.contractStartDate) return 'Contract start date is required.';
    if (!formData.contractEndDate) return 'Contract end date is required.';
    if (new Date(formData.contractEndDate) <= new Date(formData.contractStartDate)) {
      return 'Contract end date must be after start date.';
    }
    if (!formData.rentalPaymentTypeId) return 'Payment type is required.';
    if (!formData.paymentTimingId) return 'Payment timing is required.';
    if (!formData.rentAmountTotalPerMonth) return 'Monthly rent amount is required.';
    if (parseFloat(formData.rentAmountTotalPerMonth) <= 0) return 'Monthly rent must be greater than 0.';
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        tenantOrganizationId: formData.tenantOrganizationId || null,
        contractNumber: formData.contractNumber.trim(),
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        rentalPaymentTypeId: formData.rentalPaymentTypeId,
        paymentTimingId: formData.paymentTimingId,
        rentAmountPerSquareMeter: formData.rentAmountPerSquareMeter ? parseFloat(formData.rentAmountPerSquareMeter) : null,
        rentAmountTotalPerMonth: parseFloat(formData.rentAmountTotalPerMonth),
        remarks: formData.remarks.trim() || null,
      };

      await rentalContractService.updateContract(id, payload);
      enqueueSnackbar('Contract updated successfully!', { variant: 'success' });
      navigate(`/contracts/${id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update rental contract.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingPage) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
        <Skeleton variant="text" width={300} height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {[1, 2, 3].map((i) => (
            <Paper key={i} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              {[1, 2, 3, 4].map((j) => <Skeleton key={j} variant="rounded" height={40} sx={{ mb: 2 }} />)}
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/contracts" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Rental Contracts
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to={`/contracts/${id}`} sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {original?.contract_number || 'Contract'}
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Edit</Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Edit Contract: {original?.contract_number}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/contracts/${id}`)}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Back to Details
        </Button>
      </Box>

      {/* Locked unit info */}
      {original && (
        <Alert
          severity="info"
          icon={<LockIcon />}
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          <strong>Property is locked:</strong> Building, Floor, and Unit cannot be changed after contract creation.
          {' '}Currently: <strong>{original.building_name}</strong> › Floor {original.floor_number} › Unit <strong>{original.unit_number}</strong>
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>

          {/* Column 1: Locked Property Info */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <SectionHeader
              icon={<ContractIcon sx={{ fontSize: 16, color: '#1a237e' }} />}
              title="Property (Read-only)"
              subtitle="These fields are locked and cannot be changed."
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth size="small" label="Building" value={original?.building_name || '—'} disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' } }}
              />
              <TextField
                fullWidth size="small" label="Floor" value={original ? `${original.floor_name || ''} (Floor ${original.floor_number})` : '—'} disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' } }}
              />
              <TextField
                fullWidth size="small" label="Unit" value={original?.unit_number || '—'} disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' } }}
              />
              {original?.area_value && (
                <TextField
                  fullWidth size="small" label="Unit Area" value={`${original.area_value} m²`} disabled
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' } }}
                />
              )}
              <TextField
                select
                fullWidth
                size="small"
                label="Tenant Organization"
                value={formData.tenantOrganizationId}
                onChange={handleChange('tenantOrganizationId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">No Tenant Assigned</MenuItem>
                {organizations.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Box>
          </Paper>

          {/* Column 2: Contract Details */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <SectionHeader
              icon={<CalendarIcon sx={{ fontSize: 16, color: '#1a237e' }} />}
              title="Contract Details"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required fullWidth size="small" label="Contract Number"
                value={formData.contractNumber}
                onChange={handleChange('contractNumber')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required fullWidth size="small" type="date" label="Contract Start Date"
                value={formData.contractStartDate}
                onChange={handleChange('contractStartDate')}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required fullWidth size="small" type="date" label="Contract End Date"
                value={formData.contractEndDate}
                onChange={handleChange('contractEndDate')}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required select fullWidth size="small" label="Payment Type"
                value={formData.rentalPaymentTypeId}
                onChange={handleChange('rentalPaymentTypeId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select</MenuItem>
                {paymentTypes.map((pt) => (
                  <MenuItem key={pt.id} value={pt.id}>
                    {pt.name}{pt.duration_days ? ` (${pt.duration_days} days)` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                required select fullWidth size="small" label="Payment Timing"
                value={formData.paymentTimingId}
                onChange={handleChange('paymentTimingId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select</MenuItem>
                {paymentTimings.map((pt) => <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>)}
              </TextField>
              <TextField
                fullWidth size="small" multiline rows={3} label="Remarks / Notes"
                value={formData.remarks}
                onChange={handleChange('remarks')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Paper>

          {/* Column 3: Financial Details */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <SectionHeader
              icon={<PaymentIcon sx={{ fontSize: 16, color: '#1a237e' }} />}
              title="Financial Details"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth size="small" type="number" label="Rent per m² (ETB)"
                value={formData.rentAmountPerSquareMeter}
                onChange={handleChange('rentAmountPerSquareMeter')}
                disabled={saving}
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                required fullWidth size="small" type="number" label="Total Monthly Rent (ETB)"
                value={formData.rentAmountTotalPerMonth}
                onChange={handleChange('rentAmountTotalPerMonth')}
                disabled={saving}
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                helperText="The actual monthly payment amount."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* Current financials summary */}
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase' }}>
                  Current Contract Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Payments Made:</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                      {original?.payments_count ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Total Due:</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                      ETB {Number(original?.total_amount_due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Total Paid:</Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                      ETB {Number(original?.total_amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Submit Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/contracts/${id}`)}
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 4,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)' },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
