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
  Chip,
  Grid,
  InputAdornment,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
  AutoFixHigh as AutoIcon,
  Info as InfoIcon,
  CalendarMonth as CalendarIcon,
  BusinessCenter as TenantIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
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

export const ContractCreatePage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    buildingId: '',
    floorId: '',
    unitId: '',
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

  // Lookup lists
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTimings, setPaymentTimings] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Loading states
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected unit snapshot preview
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Fetch base lookups once
  useEffect(() => {
    const init = async () => {
      try {
        const [bRes, ptRes, timRes, orgRes] = await Promise.all([
          buildingsService.getBuildings({ limit: 200, status: 'active' }),
          rentalPaymentTypesService.getRentalPaymentTypes({ limit: 100, status: 'active' }),
          paymentTimingsService.getPaymentTimings({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 200, status: 'active' }),
        ]);
        setBuildings(bRes?.buildings || bRes?.rows || []);
        setPaymentTypes(ptRes?.rentalPaymentTypes || ptRes?.rows || []);
        setPaymentTimings(timRes?.paymentTimings || timRes?.rows || []);
        setOrganizations(orgRes?.organizations || orgRes?.rows || []);
      } catch (err) {
        console.error('Failed to load lookups:', err);
      }
    };
    init();
  }, []);

  // Cascading: building → floors
  useEffect(() => {
    if (!formData.buildingId) {
      setFloors([]);
      setUnits([]);
      setFormData((p) => ({ ...p, floorId: '', unitId: '' }));
      setSelectedUnit(null);
      return;
    }
    setLoadingFloors(true);
    buildingFloorsService.getFloors({ buildingId: formData.buildingId, limit: 100, status: 'active' })
      .then((r) => setFloors(r?.floors || r?.rows || []))
      .catch(() => {})
      .finally(() => setLoadingFloors(false));
    setFormData((p) => ({ ...p, floorId: '', unitId: '' }));
    setUnits([]);
    setSelectedUnit(null);
  }, [formData.buildingId]);

  // Cascading: floor → available units
  useEffect(() => {
    if (!formData.floorId) {
      setUnits([]);
      setFormData((p) => ({ ...p, unitId: '' }));
      setSelectedUnit(null);
      return;
    }
    setLoadingUnits(true);
    buildingUnitsService.getUnits({ floorId: formData.floorId, limit: 100, status: 'active' })
      .then((r) => {
        const allUnits = r?.units || r?.rows || [];
        // Show all units but mark rented ones
        setUnits(allUnits);
      })
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
    setFormData((p) => ({ ...p, unitId: '' }));
    setSelectedUnit(null);
  }, [formData.floorId]);

  // When unit selected, capture snapshot
  useEffect(() => {
    if (!formData.unitId) { setSelectedUnit(null); return; }
    const unit = units.find((u) => u.id === formData.unitId);
    setSelectedUnit(unit || null);
    // Auto-calculate monthly rent if per sqm and area are available
    if (unit?.area_value && formData.rentAmountPerSquareMeter) {
      const monthly = parseFloat(formData.rentAmountPerSquareMeter) * parseFloat(unit.area_value);
      setFormData((p) => ({ ...p, rentAmountTotalPerMonth: monthly.toFixed(2) }));
    }
  }, [formData.unitId, units]);

  // Auto-calc monthly rent when per-sqm changes
  const handlePerSqmChange = (val) => {
    setFormData((p) => ({ ...p, rentAmountPerSquareMeter: val }));
    if (selectedUnit?.area_value && val) {
      const monthly = parseFloat(val) * parseFloat(selectedUnit.area_value);
      if (!isNaN(monthly)) {
        setFormData((p) => ({ ...p, rentAmountPerSquareMeter: val, rentAmountTotalPerMonth: monthly.toFixed(2) }));
        return;
      }
    }
  };

  const handleChange = (field) => (e) => {
    if (field === 'rentAmountPerSquareMeter') {
      handlePerSqmChange(e.target.value);
    } else {
      setFormData((p) => ({ ...p, [field]: e.target.value }));
    }
    if (errorMsg) setErrorMsg('');
  };

  const validate = () => {
    if (!formData.buildingId) return 'Please select a building.';
    if (!formData.floorId) return 'Please select a floor.';
    if (!formData.unitId) return 'Please select a unit.';
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
      const floor = floors.find((f) => f.id === formData.floorId);
      const payload = {
        buildingId: formData.buildingId,
        floorId: formData.floorId,
        unitId: formData.unitId,
        floorNumber: floor?.floor_number ?? null,
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

      const result = await rentalContractService.createContract(payload);
      const contractId = result?.contract?.id || result?.id;
      enqueueSnackbar(result?.message || 'Rental contract created successfully!', { variant: 'success' });
      navigate(contractId ? `/contracts/${contractId}` : '/contracts');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create rental contract.');
    } finally {
      setSaving(false);
    }
  };

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
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              New Contract
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Create Rental Contract
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/contracts')}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Back to Contracts
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>

          {/* Column 1: Property Selection */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <SectionHeader
              icon={<ContractIcon sx={{ fontSize: 16, color: '#1a237e' }} />}
              title="Property Selection"
              subtitle="Select the building, floor, and specific unit to lease."
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                select
                fullWidth
                size="small"
                label="Building"
                value={formData.buildingId}
                onChange={handleChange('buildingId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Building</MenuItem>
                {buildings.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>

              <TextField
                required
                select
                fullWidth
                size="small"
                label="Floor"
                value={formData.floorId}
                onChange={handleChange('floorId')}
                disabled={saving || !formData.buildingId || loadingFloors}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ endAdornment: loadingFloors ? <CircularProgress size={14} /> : null }}
              >
                <MenuItem value="">Select Floor</MenuItem>
                {floors.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name} (Floor {f.floor_number})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                required
                select
                fullWidth
                size="small"
                label="Unit"
                value={formData.unitId}
                onChange={handleChange('unitId')}
                disabled={saving || !formData.floorId || loadingUnits}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ endAdornment: loadingUnits ? <CircularProgress size={14} /> : null }}
              >
                <MenuItem value="">Select Unit</MenuItem>
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id} disabled={u.is_rented}>
                    {u.unit_number} — {u.unit_use_type}
                    {u.is_rented ? ' (Already Rented)' : ''}
                    {u.area_value ? ` — ${u.area_value} m²` : ''}
                  </MenuItem>
                ))}
              </TextField>

              {/* Unit snapshot preview */}
              {selectedUnit && (
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', mb: 0.5 }}>
                    UNIT SNAPSHOT (saved with contract)
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>
                    Unit: <strong>{selectedUnit.unit_number}</strong> • Type: <strong>{selectedUnit.unit_use_type}</strong>
                  </Typography>
                  {selectedUnit.area_value && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>
                      Area: <strong>{selectedUnit.area_value} m²</strong>
                    </Typography>
                  )}
                  {selectedUnit.is_rented && (
                    <Chip label="Already Rented" size="small" sx={{ mt: 0.5, backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.68rem' }} />
                  )}
                </Box>
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
              subtitle="Contract reference number and lease duration."
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                fullWidth
                size="small"
                label="Contract Number"
                placeholder="e.g. RC-2026-0001"
                value={formData.contractNumber}
                onChange={handleChange('contractNumber')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                  Contract Start Date <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={handleChange('contractStartDate')}
                  disabled={saving}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                  Contract End Date <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={handleChange('contractEndDate')}
                  disabled={saving}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <TextField
                required
                select
                fullWidth
                size="small"
                label="Payment Type (Frequency)"
                value={formData.rentalPaymentTypeId}
                onChange={handleChange('rentalPaymentTypeId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Payment Type</MenuItem>
                {paymentTypes.map((pt) => (
                  <MenuItem key={pt.id} value={pt.id}>
                    {pt.name}{pt.duration_days ? ` (${pt.duration_days} days)` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                required
                select
                fullWidth
                size="small"
                label="Payment Timing"
                value={formData.paymentTimingId}
                onChange={handleChange('paymentTimingId')}
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Payment Timing</MenuItem>
                {paymentTimings.map((pt) => (
                  <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Remarks / Notes"
                placeholder="Special terms, conditions, or notes..."
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
              subtitle="Set rent amount. Monthly total auto-calculated if area and per-sqm rate are provided."
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Rent per m² (ETB)"
                placeholder="e.g. 150.00"
                value={formData.rentAmountPerSquareMeter}
                onChange={handleChange('rentAmountPerSquareMeter')}
                disabled={saving}
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                  endAdornment: (
                    <Tooltip title="If unit area is set, monthly total is auto-calculated.">
                      <InfoIcon sx={{ fontSize: 16, color: '#94a3b8', cursor: 'help' }} />
                    </Tooltip>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                fullWidth
                size="small"
                type="number"
                label="Total Monthly Rent (ETB)"
                placeholder="e.g. 15000.00"
                value={formData.rentAmountTotalPerMonth}
                onChange={handleChange('rentAmountTotalPerMonth')}
                disabled={saving}
                inputProps={{ min: 0, step: 'any' }}
                InputProps={{ startAdornment: <InputAdornment position="start">ETB</InputAdornment> }}
                helperText="This is the actual monthly payment amount."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* Summary preview */}
              {formData.rentAmountTotalPerMonth && formData.contractStartDate && formData.contractEndDate && (
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AutoIcon sx={{ fontSize: 14 }} />
                    PAYMENT SCHEDULE PREVIEW
                  </Typography>
                  {(() => {
                    const start = new Date(formData.contractStartDate);
                    const end = new Date(formData.contractEndDate);
                    const months = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
                    const total = months * parseFloat(formData.rentAmountTotalPerMonth || 0);
                    return (
                      <>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>
                          Duration: ~<strong>{months}</strong> months
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>
                          Total Contract Value: <strong>ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#6366f1', mt: 0.5 }}>
                          Payment schedules will be auto-generated based on the selected payment type frequency.
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Submit Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/contracts')}
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
            {saving ? 'Creating Contract...' : 'Create Contract & Generate Schedule'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
