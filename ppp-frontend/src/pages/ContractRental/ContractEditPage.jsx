import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
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
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
  CalendarMonth as CalendarIcon,
  BusinessCenter as TenantIcon,
  Apartment as BuildingIcon,
  Layers as FloorIcon,
  MeetingRoom as UnitIcon,
  SquareFoot as AreaIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Schedule as ScheduleIcon,
  ReceiptLong as ReceiptIcon,
  RestartAlt as ResetIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { rentalContractService } from '../../services/rentalContractServices';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
import { rentalPaymentTypesService } from '../../services/foundationService/rentalPaymentTypesService';
import { paymentTimingsService } from '../../services/foundationService/paymentTimingsService';
import { organizationService } from '../../services/organizationService/organizationService';

// Format currency
const formatCurrency = (val) => {
  if (val == null || val === '' || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Round to 2 decimal places (cent precision)
const round2 = (v) => Math.round(v * 100) / 100;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Status chip for installments loaded from the database
const SavedPaymentStatusChip = ({ isPaid, isGrace, dueDate }) => {
  if (isGrace) {
    return <Chip label="Paid • Grace" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#e0e7ff', color: '#4338ca' }} />;
  }
  if (isPaid) {
    return <Chip label="Paid" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#16a34a' }} />;
  }
  if (dueDate && new Date(dueDate) < new Date()) {
    return <Chip label="Overdue" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }} />;
  }
  return <Chip label="Pending" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fef9c3', color: '#ca8a04' }} />;
};

// Shared styling for form section cards
const sectionPaperSx = {
  p: { xs: 2.25, sm: 3 },
  borderRadius: 3,
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

// Field Label Component
const FieldLabel = ({ children, required, sx }) => (
  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75, ...sx }}>
    {children}
    {required && <Box component="span" sx={{ color: '#dc2626' }}> *</Box>}
  </Typography>
);

// Section Header Component — numbered step badge + gradient icon tile
const FormSectionHeader = ({ step, icon, title, subtitle, badge }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(79, 70, 229, 0.28)',
        }}
      >
        {icon}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: -6,
          right: -8,
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontSize: '0.6rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #ffffff',
        }}
      >
        {step}
      </Box>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #e0e7ff' }}
          />
        )}
      </Box>
      {subtitle && (
        <Typography sx={{ fontSize: '0.76rem', color: '#64748b', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

// Derive integer years and months from start date and end date
const deriveYearsAndMonths = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return { years: '', months: '' };
  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return { years: '', months: '' };

  const adj = new Date(e);
  adj.setDate(adj.getDate() + 1); // standard end date convention (start + Y + M - 1 day)

  let years = adj.getFullYear() - s.getFullYear();
  let months = adj.getMonth() - s.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return { years: '', months: '' };
  return {
    years: years > 0 ? String(years) : '',
    months: months >= 0 && (years > 0 || months > 0) ? String(months) : '',
  };
};

export const ContractEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [original, setOriginal] = useState(null);
  const [savedPayments, setSavedPayments] = useState([]);

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
    isActive: true,
    generateSchedule: true,
    gracePeriod: '0',
  });

  // Lease duration inputs (year + month fields)
  const [leaseDurationYears, setLeaseDurationYears] = useState('');
  const [leaseDurationMonths, setLeaseDurationMonths] = useState('');

  // Dropdown datasets
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTimings, setPaymentTimings] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Selections & status
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active tab index for the 5-step form
  const [activeSection, setActiveSection] = useState(0);

  // Initial Data Fetching
  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      setErrorMsg('');
      try {
        const [contractRes, bldgRes, ptRes, timRes, orgRes, payRes] = await Promise.all([
          rentalContractService.getContractById(id),
          buildingsService.getBuildings({ limit: 100, is_active: true }),
          rentalPaymentTypesService.getRentalPaymentTypes({ limit: 100, status: 'active' }),
          paymentTimingsService.getPaymentTimings({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 200, status: 'active' }),
          // Saved installments for this contract (shown until the schedule inputs change)
          rentalContractService.getContractPayments(id).catch(() => null),
        ]);

        const c = contractRes?.contract || contractRes;
        setOriginal(c);
        setSavedPayments(payRes?.payments || payRes?.rows || (Array.isArray(payRes) ? payRes : []));

        const bldgs = bldgRes?.buildings || bldgRes?.rows || [];
        setBuildings(bldgs);
        setPaymentTypes(ptRes?.rentalPaymentTypes || ptRes?.rows || []);
        setPaymentTimings(timRes?.paymentTimings || timRes?.rows || []);
        setOrganizations(orgRes?.organizations || orgRes?.rows || []);

        const sDate = c.contract_start_date ? c.contract_start_date.slice(0, 10) : '';
        const eDate = c.contract_end_date ? c.contract_end_date.slice(0, 10) : '';
        const { years, months } = deriveYearsAndMonths(sDate, eDate);
        setLeaseDurationYears(years);
        setLeaseDurationMonths(months);

        // Pre-seed selected unit from contract snapshot
        const initUnit = {
          id: c.unit_id,
          unit_number: c.unit_number || c.current_unit_number,
          floor_number: c.floor_number,
          area_value: c.area_value,
          area_unit_name: c.area_unit_name || 'm²',
          is_rented: false, // current lease belongs to this contract
          unit_use_type: c.unit_use_type,
        };
        setSelectedUnit(initUnit);

        setFormData({
          buildingId: c.building_id || '',
          floorId: c.floor_id || '',
          unitId: c.unit_id || '',
          tenantOrganizationId: c.tenant_organization_id || '',
          contractNumber: c.contract_number || '',
          contractStartDate: sDate,
          contractEndDate: eDate,
          rentalPaymentTypeId: c.rental_payment_type_id || '',
          paymentTimingId: c.payment_timing_id || '',
          rentAmountPerSquareMeter: c.rent_amount_per_square_meter ?? '',
          rentAmountTotalPerMonth: c.rent_amount_total_per_month ?? '',
          remarks: c.remarks || '',
          isActive: c.is_active !== undefined ? Boolean(c.is_active) : true,
          generateSchedule: true,
          gracePeriod: c.grace_period != null ? String(Math.max(0, parseInt(c.grace_period, 10) || 0)) : '0',
        });

        // Fetch dependent floors and units for current building
        if (c.building_id) {
          try {
            const flRes = await buildingFloorsService.getFloors({
              buildingId: c.building_id,
              limit: 100,
              status: 'all',
            });
            let fls = flRes?.floors || flRes?.rows || (Array.isArray(flRes) ? flRes : []);
            if (c.floor_id && !fls.some((f) => String(f.id) === String(c.floor_id))) {
              fls = [
                {
                  id: c.floor_id,
                  name: c.floor_name || 'Current Floor',
                  floor_number: c.floor_number,
                },
                ...fls,
              ];
            }
            setFloors(fls);

            if (c.floor_id) {
              const unRes = await buildingUnitsService.getUnits({
                buildingId: c.building_id,
                floorId: c.floor_id,
                limit: 100,
                status: 'all',
              });
              let uns = unRes?.units || unRes?.rows || (Array.isArray(unRes) ? unRes : []);
              if (c.unit_id && !uns.some((u) => String(u.id) === String(c.unit_id))) {
                uns = [
                  {
                    id: c.unit_id,
                    unit_number: c.unit_number || c.current_unit_number,
                    floor_number: c.floor_number,
                    area_value: c.area_value,
                    area_unit_name: c.area_unit_name || 'm²',
                    is_rented: false,
                    unit_use_type: c.unit_use_type,
                  },
                  ...uns,
                ];
              }
              setUnits(uns);
              const foundU = uns.find((u) => String(u.id) === String(c.unit_id));
              if (foundU) setSelectedUnit(foundU);
            }
          } catch (depErr) {
            console.error('Error fetching dependent floors/units in edit init:', depErr);
          }
        }
      } catch (err) {
        console.error('Failed to initialize edit contract page:', err);
        setErrorMsg('Failed to load contract details. Please refresh or try again.');
        enqueueSnackbar('Failed to load contract data.', { variant: 'error' });
      } finally {
        setLoadingPage(false);
      }
    };

    if (id) {
      init();
    }
  }, [id, enqueueSnackbar]);

  // Recalculate end date from start + years + months
  const recalcEndDate = (startDate, years, months) => {
    const y = parseInt(years, 10) || 0;
    const m = parseInt(months, 10) || 0;
    if (!startDate || (y === 0 && m === 0)) return '';
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const end = new Date(sY, sM - 1, sD);
    end.setFullYear(end.getFullYear() + y);
    end.setMonth(end.getMonth() + m);
    end.setDate(end.getDate() - 1); // standard lease end convention

    const yStr = end.getFullYear();
    const mStr = String(end.getMonth() + 1).padStart(2, '0');
    const dStr = String(end.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  };

  const handleDurationYearChange = (e) => {
    const raw = e.target.value;
    if (raw !== '' && (!/^\d+$/.test(raw) || parseInt(raw, 10) < 1)) return;
    setLeaseDurationYears(raw);
    const newEnd = recalcEndDate(formData.contractStartDate, raw, leaseDurationMonths);
    setFormData((p) => ({ ...p, contractEndDate: newEnd }));
    if (errorMsg) setErrorMsg('');
  };

  const handleDurationMonthChange = (e) => {
    const raw = e.target.value;
    if (raw !== '') {
      if (!/^\d+$/.test(raw)) return;
      const val = parseInt(raw, 10);
      if (val < 0 || val > 11) return;
    }
    setLeaseDurationMonths(raw);
    const newEnd = recalcEndDate(formData.contractStartDate, leaseDurationYears, raw);
    setFormData((p) => ({ ...p, contractEndDate: newEnd }));
    if (errorMsg) setErrorMsg('');
  };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setFormData((p) => {
      const newEnd = recalcEndDate(newStart, leaseDurationYears, leaseDurationMonths);
      return { ...p, contractStartDate: newStart, contractEndDate: newEnd };
    });
    if (errorMsg) setErrorMsg('');
  };

  // Grace period: whole months only (no decimals, no negatives). Empty value falls back to 0.
  const handleGracePeriodChange = (e) => {
    const raw = e.target.value;
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setFormData((p) => ({ ...p, gracePeriod: raw }));
    if (errorMsg) setErrorMsg('');
  };

  // Building selection
  const handleBuildingChange = async (event, newValue) => {
    const newBuildingId = newValue ? newValue.id : '';
    setFormData((p) => ({
      ...p,
      buildingId: newBuildingId,
      floorId: '',
      unitId: '',
      rentAmountTotalPerMonth: '',
    }));
    setFloors([]);
    setUnits([]);
    setSelectedUnit(null);
    if (errorMsg) setErrorMsg('');

    if (newBuildingId) {
      setLoadingFloors(true);
      try {
        const res = await buildingFloorsService.getFloors({
          buildingId: newBuildingId,
          limit: 100,
          status: 'all',
        });
        setFloors(res?.floors || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        enqueueSnackbar('Failed to load floors for selected building.', { variant: 'error' });
      } finally {
        setLoadingFloors(false);
      }
    }
  };

  // Floor selection
  const handleFloorChange = async (e) => {
    const floorId = e.target.value;
    setFormData((p) => ({
      ...p,
      floorId,
      unitId: '',
      rentAmountTotalPerMonth: '',
    }));
    setUnits([]);
    setSelectedUnit(null);
    if (errorMsg) setErrorMsg('');

    if (floorId && formData.buildingId) {
      setLoadingUnits(true);
      try {
        const res = await buildingUnitsService.getUnits({
          buildingId: formData.buildingId,
          floorId,
          limit: 100,
          status: 'all',
        });
        setUnits(res?.units || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        enqueueSnackbar('Failed to load units for selected floor.', { variant: 'error' });
      } finally {
        setLoadingUnits(false);
      }
    }
  };

  // Unit selection
  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    const unit = units.find((u) => u.id === unitId) || null;
    setSelectedUnit(unit);

    let newTotal = formData.rentAmountTotalPerMonth;
    if (unit && unit.area_value && formData.rentAmountPerSquareMeter) {
      const area = parseFloat(unit.area_value);
      const rate = parseFloat(formData.rentAmountPerSquareMeter);
      if (!isNaN(area) && !isNaN(rate) && area > 0) {
        newTotal = (area * rate).toFixed(2);
      }
    }

    setFormData((p) => ({
      ...p,
      unitId,
      rentAmountTotalPerMonth: newTotal,
    }));
    if (errorMsg) setErrorMsg('');
  };

  // Rent per square meter driver
  const handlePerSqmChange = (val) => {
    setFormData((p) => {
      const next = { ...p, rentAmountPerSquareMeter: val };
      if (val !== '' && !isNaN(val)) {
        const area = selectedUnit?.area_value ? parseFloat(selectedUnit.area_value) : null;
        const rate = parseFloat(val);
        if (!isNaN(area) && !isNaN(rate) && area > 0) {
          next.rentAmountTotalPerMonth = (area * rate).toFixed(2);
        } else {
          next.rentAmountTotalPerMonth = '';
        }
      } else {
        next.rentAmountTotalPerMonth = '';
      }
      return next;
    });
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    if (field === 'rentAmountPerSquareMeter') {
      handlePerSqmChange(val);
    } else {
      setFormData((p) => ({ ...p, [field]: val }));
    }
    if (errorMsg) setErrorMsg('');
  };

  // Calculate lease term duration in months and days
  const termCalculations = useMemo(() => {
    if (!formData.contractStartDate || !formData.contractEndDate) {
      return { totalDays: 0, totalMonths: 0, isValidRange: true };
    }
    const [sY, sM, sD] = formData.contractStartDate.split('-').map(Number);
    const [eY, eM, eD] = formData.contractEndDate.split('-').map(Number);
    const startUTC = Date.UTC(sY, sM - 1, sD);
    const endUTC = Date.UTC(eY, eM - 1, eD);
    const diffMs = endUTC - startUTC;
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const totalMonths = Math.max(0, Math.round((totalDays / 30.4375) * 10) / 10);
    const isValidRange = endUTC > startUTC;
    return { totalDays, totalMonths, isValidRange };
  }, [formData.contractStartDate, formData.contractEndDate]);

  // Grace period: whole months at the start of the lease with no rent due (defaults to 0)
  const gracePeriodMonths = useMemo(() => {
    const str = String(formData.gracePeriod ?? '').trim();
    return /^\d+$/.test(str) ? parseInt(str, 10) : 0;
  }, [formData.gracePeriod]);

  // "Month" unit for the grace window: the rental payment type whose duration_days is nearest to 30
  const monthDays = useMemo(() => {
    let best = 30;
    for (const pt of paymentTypes) {
      const d = parseFloat(pt.duration_days);
      if (Number.isFinite(d) && d > 0 && Math.abs(d - 30) < Math.abs(best - 30)) best = d;
    }
    return best;
  }, [paymentTypes]);

  // The schedule is dirty when any schedule-affecting input differs from the saved contract —
  // only then does the panel preview a regenerated schedule instead of the saved installments.
  const scheduleDirty = useMemo(() => {
    if (!original) return false;
    const savedStart = original.contract_start_date ? original.contract_start_date.slice(0, 10) : '';
    const savedEnd = original.contract_end_date ? original.contract_end_date.slice(0, 10) : '';
    return (
      formData.contractStartDate !== savedStart ||
      formData.contractEndDate !== savedEnd ||
      String(formData.rentalPaymentTypeId) !== String(original.rental_payment_type_id ?? '') ||
      round2(parseFloat(formData.rentAmountTotalPerMonth) || 0) !== round2(parseFloat(original.rent_amount_total_per_month) || 0) ||
      gracePeriodMonths !== (parseInt(original.grace_period, 10) || 0)
    );
  }, [original, formData.contractStartDate, formData.contractEndDate, formData.rentalPaymentTypeId, formData.rentAmountTotalPerMonth, gracePeriodMonths]);

  // Show the database schedule when nothing schedule-affecting has been modified
  const showSavedSchedule = !scheduleDirty && savedPayments.length > 0;

  // An unchanged save can re-send the saved installments so they are preserved exactly instead
  // of being regenerated — but only when no real (money) payment exists and the saved total
  // matches the expected contract total, otherwise the backend falls back to regeneration.
  const canPreserveSaved = useMemo(() => {
    if (scheduleDirty || savedPayments.length === 0) return false;
    if (savedPayments.some((p) => p.is_paid && Number(p.amount_due) > 0)) return false;
    const savedTotal = round2(savedPayments.reduce((acc, p) => acc + (Number(p.amount_due) || 0), 0));
    const expectedTotal = round2((parseFloat(formData.rentAmountTotalPerMonth) || 0) * Math.max(0, termCalculations.totalMonths - gracePeriodMonths));
    return Math.abs(savedTotal - expectedTotal) <= 0.02;
  }, [scheduleDirty, savedPayments, formData.rentAmountTotalPerMonth, termCalculations.totalMonths, gracePeriodMonths]);

  // Selected payment type object
  const selectedPaymentType = useMemo(() => {
    return paymentTypes.find((pt) => String(pt.id) === String(formData.rentalPaymentTypeId)) || null;
  }, [paymentTypes, formData.rentalPaymentTypeId]);

  // Selected building object
  const selectedBuilding = useMemo(() => {
    return buildings.find((b) => String(b.id) === String(formData.buildingId)) || null;
  }, [buildings, formData.buildingId]);

  // Selected organization object
  const selectedTenant = useMemo(() => {
    return organizations.find((o) => String(o.id) === String(formData.tenantOrganizationId)) || null;
  }, [organizations, formData.tenantOrganizationId]);

  // Billable lease months: the grace months carry zero rent, so they are excluded from the total
  const billableMonths = useMemo(
    () => Math.max(0, termCalculations.totalMonths - gracePeriodMonths),
    [termCalculations.totalMonths, gracePeriodMonths]
  );

  // Compute Total Contract Value
  const totalContractValue = useMemo(() => {
    const monthly = parseFloat(formData.rentAmountTotalPerMonth) || 0;
    if (monthly <= 0 || billableMonths <= 0) return 0;
    return Math.round(monthly * billableMonths * 100) / 100;
  }, [formData.rentAmountTotalPerMonth, billableMonths]);

  // Live Payment Schedule Simulator (Synchronized with ContractCreatePage with two-decimal duration days and noon-anchored time intervals)
  const simulatedSchedule = useMemo(() => {
    if (
      !formData.contractStartDate ||
      !formData.contractEndDate ||
      !termCalculations.isValidRange ||
      !formData.rentAmountTotalPerMonth ||
      parseFloat(formData.rentAmountTotalPerMonth) <= 0
    ) {
      return [];
    }

    // duration_days is numeric(10,2) — keep its decimal part (e.g. 15.50 or 7.02) in every schedule calculation
    const durationDays = selectedPaymentType?.duration_days
      ? parseFloat(selectedPaymentType.duration_days)
      : 30;
    const intervalDays = durationDays > 0 ? durationDays : 30;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    // Round up when decimal is >= 0.5 (e.g. 30.4 -> 30, but 30.5 or 30.6 -> 31)
    const totalDays = termCalculations.totalDays;
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= 0) return [];

    // The Lease Agreement Preview's "Total Contract Value" (monthly rent × billable months) is the
    // authoritative amount. The grace window covers the first graceDays days of the contract
    // (grace months × the payment-type month unit nearest to 30), and the total is distributed
    // across installments in proportion to each installment's chargeable days — installments
    // fully inside the window become zero (pre-paid grace) and a cycle straddling the boundary
    // is pro-rated. Rounding cents are absorbed by the final chargeable installment.
    const contractTotal = totalContractValue;
    const graceDays = gracePeriodMonths * monthDays;

    const chargeablePerInstallment = [];
    let totalChargeableDays = 0;
    for (let count = 1; count <= numberOfSchedules; count++) {
      const offsetDays = (count - 1) * intervalDays;
      const overlapDays = graceDays > 0 ? Math.max(0, Math.min(intervalDays, graceDays - offsetDays)) : 0;
      const chargeableDays = intervalDays - overlapDays;
      chargeablePerInstallment.push(chargeableDays);
      totalChargeableDays += chargeableDays;
    }

    let lastChargeableIndex = -1;
    chargeablePerInstallment.forEach((c, i) => { if (c > 0) lastChargeableIndex = i; });
    const amounts = [];
    let runningSum = 0;
    chargeablePerInstallment.forEach((chargeableDays, i) => {
      if (totalChargeableDays <= 0 || chargeableDays <= 0) {
        amounts.push(0);
        return;
      }
      if (i === lastChargeableIndex) {
        amounts.push(Math.max(0, Math.round((contractTotal - runningSum) * 100) / 100));
      } else {
        const amt = Math.round((contractTotal * (chargeableDays / totalChargeableDays)) * 100) / 100;
        amounts.push(amt);
        runningSum += amt;
      }
    });

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const [sY, sM, sD] = formData.contractStartDate.split('-').map(Number);
    const [eY, eM, eD] = formData.contractEndDate.split('-').map(Number);
    const endBound = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

    const schedule = [];
    // Anchor at noon so fractional-day intervals and DST shifts never cross a calendar date boundary
    let currentDue = new Date(sY, sM - 1, sD, 12);

    for (let count = 1; count <= numberOfSchedules; count++) {
      const nextDue = new Date(currentDue.getTime() + intervalMs);

      const dueDateStr = formatYMD(currentDue);
      const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;
      const isGrace = chargeablePerInstallment[count - 1] <= 0;

      schedule.push({
        installmentNumber: count,
        dueDate: dueDateStr,
        nextDate: nextDateStr,
        amount: amounts[count - 1],
        isGrace,
      });

      currentDue = nextDue;
    }
    return schedule;
  }, [
    formData.contractStartDate,
    formData.contractEndDate,
    termCalculations.totalDays,
    termCalculations.isValidRange,
    formData.rentAmountTotalPerMonth,
    selectedPaymentType,
    totalContractValue,
    gracePeriodMonths,
    monthDays,
  ]);

  // User-tuned installment amounts: editing one installment redistributes the difference across
  // the others so the schedule total always stays equal to the contract total (locked).
  const [editedAmounts, setEditedAmounts] = useState({});

  // Any baseline change (dates, rent, frequency, grace period) rebuilds the schedule and clears edits
  useEffect(() => {
    setEditedAmounts({});
  }, [simulatedSchedule]);

  const displayAmount = (item) => editedAmounts[item.installmentNumber] ?? item.amount;

  const handleAmountEdit = (installmentNumber, raw) => {
    const parsed = parseFloat(raw);
    if (raw === '' || raw === null || !Number.isFinite(parsed) || parsed < 0) return;
    let newValue = round2(parsed);

    // Current displayed amounts of the editable (non-grace) installments
    const currentAmounts = new Map();
    let total = 0;
    simulatedSchedule.forEach((s) => {
      if (s.isGrace) return;
      const amt = round2(displayAmount(s));
      currentAmounts.set(s.installmentNumber, amt);
      total = round2(total + amt);
    });

    // The edited installment can never exceed the locked total
    newValue = Math.min(newValue, total);
    const oldValue = currentAmounts.get(installmentNumber) ?? 0;
    const targetOthers = round2(total - newValue);

    const others = [...currentAmounts.entries()].filter(([key]) => key !== installmentNumber);
    const next = {};
    if (others.length === 0) {
      next[installmentNumber] = total;
      setEditedAmounts(next);
      return;
    }

    // Redistribute the difference proportionally by current amounts; the last one absorbs rounding cents
    const othersTotal = round2(others.reduce((acc, [, v]) => acc + v, 0));
    let allocated = 0;
    others.forEach(([key, amt], idx) => {
      if (idx === others.length - 1) {
        const v = Math.max(0, round2(targetOthers - allocated));
        next[key] = v;
        allocated = round2(allocated + v);
      } else {
        const v = othersTotal > 0 ? round2(amt * (targetOthers / othersTotal)) : 0;
        next[key] = v;
        allocated = round2(allocated + v);
      }
    });
    next[installmentNumber] = round2(total - allocated);

    setEditedAmounts((prev) => ({ ...prev, ...next }));
  };

  // Reset to original saved values
  const handleResetToOriginal = () => {
    if (!original) return;
    const sDate = original.contract_start_date ? original.contract_start_date.slice(0, 10) : '';
    const eDate = original.contract_end_date ? original.contract_end_date.slice(0, 10) : '';
    const { years, months } = deriveYearsAndMonths(sDate, eDate);
    setLeaseDurationYears(years);
    setLeaseDurationMonths(months);

    setFormData({
      buildingId: original.building_id || '',
      floorId: original.floor_id || '',
      unitId: original.unit_id || '',
      tenantOrganizationId: original.tenant_organization_id || '',
      contractNumber: original.contract_number || '',
      contractStartDate: sDate,
      contractEndDate: eDate,
      rentalPaymentTypeId: original.rental_payment_type_id || '',
      paymentTimingId: original.payment_timing_id || '',
      rentAmountPerSquareMeter: original.rent_amount_per_square_meter ?? '',
      rentAmountTotalPerMonth: original.rent_amount_total_per_month ?? '',
      remarks: original.remarks || '',
      isActive: original.is_active !== undefined ? Boolean(original.is_active) : true,
      generateSchedule: true,
      gracePeriod: original.grace_period != null ? String(Math.max(0, parseInt(original.grace_period, 10) || 0)) : '0',
    });
    setErrorMsg('');
    enqueueSnackbar('Reset form to original contract values', { variant: 'info' });
  };

  // Validation
  const validate = () => {
    if (original?.is_active) {
      return 'Active contracts cannot be edited. Please deactivate the contract first.';
    }
    if (!formData.buildingId) return 'Please select a building.';
    if (!formData.floorId) return 'Please select a floor level.';
    if (!formData.unitId) return 'Please select a specific unit.';
    if (!formData.tenantOrganizationId) return 'Please select a tenant organization.';
    if (selectedUnit?.is_rented && String(selectedUnit.id) !== String(original?.unit_id)) {
      return 'The selected unit is already leased under an active contract.';
    }
    if (!formData.contractStartDate) return 'Contract start date is required.';
    if (
      (!leaseDurationYears || parseInt(leaseDurationYears, 10) < 1) &&
      (!leaseDurationMonths || parseInt(leaseDurationMonths, 10) < 1)
    ) {
      return 'Please enter at least 1 year or 1 month for the lease term.';
    }
    if (leaseDurationMonths !== '' && (parseInt(leaseDurationMonths, 10) < 0 || parseInt(leaseDurationMonths, 10) > 11)) {
      return 'Lease months must be between 0 and 11.';
    }
    if (!formData.contractEndDate) return 'Lease end date could not be calculated.';
    if (new Date(formData.contractEndDate) <= new Date(formData.contractStartDate)) {
      return 'Contract end date must be strictly after the start date.';
    }
    if (gracePeriodMonths > termCalculations.totalMonths) {
      return `Grace period cannot be greater than the contract duration (${termCalculations.totalMonths} months).`;
    }
    if (!formData.rentalPaymentTypeId) return 'Please select a payment frequency (Rental Payment Type).';
    if (!formData.paymentTimingId) return 'Please select payment timing (e.g. In Advance).';
    if (!formData.rentAmountPerSquareMeter || parseFloat(formData.rentAmountPerSquareMeter) <= 0) {
      return 'Please specify a valid rent per square meter greater than 0.';
    }
    if (!formData.rentAmountTotalPerMonth || parseFloat(formData.rentAmountTotalPerMonth) <= 0) {
      return 'Total monthly rent could not be calculated. Please ensure a unit with area is selected.';
    }
    if (!formData.remarks || !formData.remarks.trim()) {
      return 'Contract remarks & stipulations are required.';
    }
    return null;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (original?.is_active) {
      const msg = 'Active contracts cannot be edited. Please deactivate the contract first.';
      setErrorMsg(msg);
      enqueueSnackbar(msg, { variant: 'error' });
      return;
    }
    const err = validate();
    if (err) {
      setErrorMsg(err);
      enqueueSnackbar(err, { variant: 'error' });
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const floor = floors.find((f) => String(f.id) === String(formData.floorId));
      const payload = {
        buildingId: formData.buildingId,
        floorId: formData.floorId,
        unitId: formData.unitId,
        floorNumber: floor?.floor_number ?? selectedUnit?.floor_number ?? null,
        unitNumber: selectedUnit?.unit_number ?? null,
        areaValue: selectedUnit?.area_value ? parseFloat(selectedUnit.area_value) : null,
        tenantOrganizationId: formData.tenantOrganizationId || null,
        contractNumber: formData.contractNumber.trim(),
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        rentalPaymentTypeId: formData.rentalPaymentTypeId,
        paymentTimingId: formData.paymentTimingId,
        rentAmountPerSquareMeter: formData.rentAmountPerSquareMeter
          ? parseFloat(formData.rentAmountPerSquareMeter)
          : null,
        rentAmountTotalPerMonth: parseFloat(formData.rentAmountTotalPerMonth),
        remarks: formData.remarks.trim(),
        isActive: formData.isActive,
        generateSchedule: formData.generateSchedule,
        gracePeriod: gracePeriodMonths,
        // Persist schedule intent:
        // - inputs changed + user tuned amounts → store the customized distribution
        // - nothing changed → re-send the saved installments so an unchanged save does not
        //   recompute or clobber the existing schedule (skipped when real payments exist)
        ...(scheduleDirty && Object.keys(editedAmounts).length > 0
          ? { customSchedule: simulatedSchedule.map((s) => ({ dueDate: s.dueDate, amount: round2(displayAmount(s)) })) }
          : canPreserveSaved
            ? { customSchedule: savedPayments.map((p) => ({ dueDate: String(p.due_date || '').slice(0, 10), amount: round2(Number(p.amount_due) || 0) })) }
            : {}),
      };

      await rentalContractService.updateContract(id, payload);
      enqueueSnackbar('Rental contract updated successfully!', { variant: 'success' });
      navigate(`/contracts/${id}`);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to update rental contract.';
      setErrorMsg(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingPage) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
        <Skeleton variant="text" width={320} height={36} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, 1fr)' }, gap: '16px' }}>
          <Box sx={{ gridColumn: { xs: '1', lg: 'span 4' } }}>
            <Paper elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Skeleton variant="text" width={240} height={32} sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Skeleton variant="rounded" height={45} />
                <Skeleton variant="rounded" height={45} />
              </Box>
            </Paper>
          </Box>
          <Box sx={{ gridColumn: { xs: '1', lg: 'span 2' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Skeleton variant="rounded" height={320} />
            </Paper>
          </Box>
          <Box sx={{ gridColumn: { xs: '1', lg: 'span 2' } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Skeleton variant="rounded" height={320} />
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

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
            <Link underline="hover" color="inherit" component={RouterLink} to={`/contracts/${id}`} sx={{ color: '#94a3b8', fontWeight: 500 }}>
              {original?.contract_number || 'Contract'}
            </Link>
            <Typography sx={{ color: '#475569', fontWeight: 600 }}>
              Edit Lease
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetToOriginal}
              disabled={saving}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#6366f1',
                borderColor: '#c7d2fe',
                backgroundColor: '#eef2ff',
                '&:hover': { borderColor: '#818cf8', backgroundColor: '#e0e7ff' },
              }}
            >
              Reset to Saved
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate(`/contracts/${id}`)}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#64748b',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              Back to Details
            </Button>
          </Box>
        </Box>

        {/* Hero Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <ContractIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
                  Edit Rental Contract: {original?.contract_number}
                </Typography>
                <Chip
                  label={formData.isActive ? '● Active' : '○ Inactive / Draft'}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: formData.isActive ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)',
                    color: formData.isActive ? '#15803d' : '#64748b',
                    border: `1px solid ${formData.isActive ? '#bbf7d0' : '#e2e8f0'}`,
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Modify commercial lease parameters, financial pricing, duration schedule, and unit allocations.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Active Contract Alert */}
      {original?.is_active && (
        <Alert
          severity="warning"
          icon={<LockIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600, fontSize: '0.84rem' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(`/contracts/${id}`)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              View Contract
            </Button>
          }
        >
          This rental contract is currently ACTIVE. Active contracts are locked against editing. If you need to make changes, please deactivate the contract from the details page first.
        </Alert>
      )}

      {/* Global Error Alert */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Workspace: 5-step tabbed form on top, preview & schedule side-by-side below (4-col grid) */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        className="parent"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, 1fr)' },
          gap: '12px',
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* DIV 1: The big form area — tabbed core form (Steps 1-5) */}
        <Box
          className="div1"
          sx={{
            gridColumn: { lg: 'span 4 / span 4' },
            gridRow: { lg: 'span 2 / span 2' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              ...sectionPaperSx,
              p: 0,
              overflow: 'hidden',
            }}
          >
            {/* Tab Bar — Steps 1-5 */}
            <Tabs
              value={activeSection}
              onChange={(event, newValue) => setActiveSection(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Contract edit sections"
              sx={{
                minHeight: 58,
                pt: 1,
                px: { xs: 0.5, sm: 1.5 },
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: '#4f46e5' },
              }}
            >
              {[
                { icon: <BuildingIcon sx={{ fontSize: 17 }} />, label: 'Premises' },
                { icon: <TenantIcon sx={{ fontSize: 17 }} />, label: 'Tenant' },
                { icon: <CalendarIcon sx={{ fontSize: 17 }} />, label: 'Lease Term' },
                { icon: <PaymentIcon sx={{ fontSize: 17 }} />, label: 'Financials' },
                { icon: <ReceiptIcon sx={{ fontSize: 17 }} />, label: 'Execution' },
              ].map((tab, idx) => (
                <Tab
                  key={tab.label}
                  value={idx}
                  disableRipple
                  icon={tab.icon}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                      <Typography sx={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'inherit', opacity: 0.55, lineHeight: 1.2 }}>
                        Step {idx + 1}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'inherit', lineHeight: 1.3 }}>
                        {tab.label}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    minHeight: 58,
                    textTransform: 'none',
                    color: '#94a3b8',
                    '&.Mui-selected': { color: '#4f46e5' },
                  }}
                />
              ))}
            </Tabs>

            {/* Active Section Content */}
            <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
              {/* STEP 1: PREMISES & UNIT ALLOCATION */}
              {activeSection === 0 && (
                <Box>
                  <FormSectionHeader
                    step={1}
                    icon={<BuildingIcon sx={{ fontSize: 18 }} />}
                    title="Premises & Space Selection"
                    subtitle="Select the target building, floor level, and unit to be leased."
                    badge="Space Allocation"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                    {/* Building Selection — searchable Autocomplete, full-width */}
                    <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                      <FieldLabel required>Target Building</FieldLabel>
                      <Autocomplete
                        fullWidth
                        size="small"
                        disabled={saving || loadingPage || Boolean(original?.is_active)}
                        options={buildings}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option;
                          return option?.name || '';
                        }}
                        isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id || val)}
                        value={selectedBuilding}
                        onChange={handleBuildingChange}
                        renderOption={(props, option) => {
                          const { key, ...restProps } = props;
                          return (
                            <Box component="li" key={option.id || key} {...restProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
                              <BuildingIcon sx={{ fontSize: 18, color: '#4f46e5', flexShrink: 0 }} />
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                                  {option.name}
                                </Typography>
                                {option.address && (
                                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    {option.address}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search & select building..."
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                width: '100%',
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                              },
                            }}
                          />
                        )}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 },
                        }}
                      />
                    </Box>

                    {/* Floor Level Selection */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Floor Level</FieldLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.floorId}
                        onChange={handleFloorChange}
                        disabled={saving || !formData.buildingId || loadingFloors || Boolean(original?.is_active)}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                        InputProps={{
                          endAdornment: loadingFloors ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                        }}
                      >
                        <MenuItem value="" disabled>
                          {!formData.buildingId ? 'Select a building first' : 'Select Floor Level...'}
                        </MenuItem>
                        {floors.map((f) => (
                          <MenuItem key={f.id} value={f.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FloorIcon sx={{ fontSize: 16, color: '#4f46e5' }} />
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {f.name || `Floor ${f.floor_number}`} (Level {f.floor_number})
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    {/* Unit Selection */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Building Unit</FieldLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.unitId}
                        onChange={handleUnitChange}
                        disabled={saving || !formData.floorId || loadingUnits || Boolean(original?.is_active)}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                        InputProps={{
                          endAdornment: loadingUnits ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                        }}
                      >
                        <MenuItem value="" disabled>
                          {!formData.floorId ? 'Select a floor first' : 'Select Unit...'}
                        </MenuItem>
                        {/* Units flagged not-for-rent are hidden — except this contract's own unit, which stays selectable */}
                        {units
                          .filter((u) => u.is_for_rent !== false || String(u.id) === String(original?.unit_id))
                          .map((u) => {
                          const isCurrentUnit = String(u.id) === String(original?.unit_id);
                          const isOccupiedByOther = u.is_rented && !isCurrentUnit;
                          return (
                            <MenuItem key={u.id} value={u.id} disabled={isOccupiedByOther}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <UnitIcon sx={{ fontSize: 16, color: isOccupiedByOther ? '#94a3b8' : '#4f46e5' }} />
                                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    Unit {u.unit_number} {isCurrentUnit ? '(Current Unit)' : ''}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  {u.area_value && (
                                    <Chip
                                      label={`${u.area_value} ${u.area_unit_name || 'm²'}`}
                                      size="small"
                                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#f1f5f9' }}
                                    />
                                  )}
                                  {isOccupiedByOther ? (
                                    <Chip
                                      label="Leased"
                                      size="small"
                                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}
                                    />
                                  ) : (
                                    <Chip
                                      label={isCurrentUnit ? 'Current Lease' : 'Available'}
                                      size="small"
                                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: isCurrentUnit ? '#e0e7ff' : '#dcfce7', color: isCurrentUnit ? '#4338ca' : '#15803d' }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </Box>

                    {/* Selected Unit Snapshot Card */}
                    {selectedUnit && (
                      <Box sx={{ gridColumn: '1 / -1', width: '100%', p: 2, borderRadius: 2.5, backgroundColor: '#f8faff', border: '1px solid #e0e7ff' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                          Selected Space Summary
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                          <Chip
                            icon={<UnitIcon sx={{ fontSize: 15 }} />}
                            label={`Unit ${selectedUnit.unit_number}`}
                            sx={{ fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #c7d2fe', color: '#1e293b' }}
                          />
                          <Chip
                            icon={<FloorIcon sx={{ fontSize: 15 }} />}
                            label={`Floor Level: ${selectedUnit.floor_number}`}
                            sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #c7d2fe', color: '#475569' }}
                          />
                          {selectedUnit.area_value && (
                            <Chip
                              icon={<AreaIcon sx={{ fontSize: 15 }} />}
                              label={`Gross Area: ${selectedUnit.area_value} ${selectedUnit.area_unit_name || 'm²'}`}
                              sx={{ fontWeight: 700, backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d' }}
                            />
                          )}
                          {selectedUnit.unit_use_type && (
                            <Chip
                              label={`Space Use: ${selectedUnit.unit_use_type}`}
                              sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* STEP 2: TENANT ORGANIZATION */}
              {activeSection === 1 && (
                <Box>
                  <FormSectionHeader
                    step={2}
                    icon={<TenantIcon sx={{ fontSize: 18 }} />}
                    title="Tenant Organization"
                    subtitle="Select or assign the commercial enterprise leasing this space."
                    badge="Required"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, width: '100%' }}>
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Tenant Organization</FieldLabel>
                      <Autocomplete
                        fullWidth
                        size="small"
                        disabled={saving || loadingPage || Boolean(original?.is_active)}
                        options={organizations}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option;
                          return option?.name || '';
                        }}
                        isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id || val)}
                        value={selectedTenant}
                        onChange={(event, newValue) => {
                          setFormData((prev) => ({
                            ...prev,
                            tenantOrganizationId: newValue ? newValue.id : '',
                          }));
                          if (errorMsg) setErrorMsg('');
                        }}
                        renderOption={(props, option) => {
                          const { key, ...restProps } = props;
                          return (
                            <Box component="li" key={option.id || key} {...restProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                              <TenantIcon sx={{ fontSize: 18, color: '#4f46e5', flexShrink: 0 }} />
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                                  {option.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {option.organization_type_name || 'Commercial Entity'} • {option.email || option.phone || 'No direct contact'}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search organization by name..."
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                width: '100%',
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                              },
                            }}
                          />
                        )}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 },
                        }}
                      />
                    </Box>

                    {/* Selected Tenant Card */}
                    {selectedTenant && (
                      <Box sx={{ width: '100%', p: 2, borderRadius: 2.5, backgroundColor: '#f8faff', border: '1px solid #e0e7ff' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                          Assigned Lessee Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                          <Chip
                            icon={<TenantIcon sx={{ fontSize: 15 }} />}
                            label={selectedTenant.name}
                            sx={{ fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #c7d2fe', color: '#0f172a' }}
                          />
                          {selectedTenant.organization_type_name && (
                            <Chip
                              label={`Type: ${selectedTenant.organization_type_name}`}
                              sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}
                            />
                          )}
                          {selectedTenant.contact_person && (
                            <Chip
                              label={`Contact: ${selectedTenant.contact_person}`}
                              sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}
                            />
                          )}
                          {selectedTenant.phone && (
                            <Chip
                              label={`Tel: ${selectedTenant.phone}`}
                              sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}
                            />
                          )}
                          {selectedTenant.email && (
                            <Chip
                              label={selectedTenant.email}
                              sx={{ fontWeight: 600, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#475569' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* STEP 3: LEASE TERM & DURATION */}
              {activeSection === 2 && (
                <Box>
                  <FormSectionHeader
                    step={3}
                    icon={<CalendarIcon sx={{ fontSize: 18 }} />}
                    title="Lease Term & Duration"
                    subtitle="Specify commencement date and lease duration in years and months."
                    badge="Term Duration"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, width: '100%' }}>
                    {/* Contract Start Date */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Commencement Date</FieldLabel>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={formData.contractStartDate}
                        onChange={handleStartDateChange}
                        disabled={saving || Boolean(original?.is_active)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Duration in Years */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel>Lease Term (Years)</FieldLabel>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="e.g. 1, 2, 5"
                        value={leaseDurationYears}
                        onChange={handleDurationYearChange}
                        disabled={saving || Boolean(original?.is_active)}
                        inputProps={{ min: 1, step: 1 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">years</InputAdornment>,
                        }}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Duration in Months */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel>Additional Months</FieldLabel>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="0 - 11"
                        value={leaseDurationMonths}
                        onChange={handleDurationMonthChange}
                        disabled={saving || Boolean(original?.is_active)}
                        inputProps={{ min: 0, max: 11, step: 1 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">months</InputAdornment>,
                        }}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Calculated End Date */}
                    <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                      <FieldLabel required>Calculated Expiration Date</FieldLabel>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={formData.contractEndDate}
                        disabled
                        InputLabelProps={{ shrink: true }}
                        helperText="Automatically computed based on start date and specified years & months"
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            width: '100%',
                            borderRadius: 2,
                            backgroundColor: '#f8fafc',
                          },
                        }}
                      />
                    </Box>

                    {/* Duration Summary Banner */}
                    {formData.contractStartDate && formData.contractEndDate && termCalculations.isValidRange && (
                      <Box sx={{ gridColumn: '1 / -1', width: '100%', p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                              Valid Lease Term Defined
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={`${termCalculations.totalDays} Total Calendar Days`}
                              size="small"
                              sx={{ height: 22, fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}
                            />
                            <Chip
                              label={`${termCalculations.totalMonths} Lease Months`}
                              size="small"
                              sx={{ height: 22, fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* STEP 4: FINANCIALS & RENT CONFIGURATION */}
              {activeSection === 3 && (
                <Box>
                  <FormSectionHeader
                    step={4}
                    icon={<PaymentIcon sx={{ fontSize: 18 }} />}
                    title="Financials & Rent Configuration"
                    subtitle="Configure rental pricing per m², automated monthly rent calculation, and payment frequency."
                    badge="Rent & Terms"
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                    {/* Payment Frequency */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Payment Frequency (Rental Payment Type)</FieldLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.rentalPaymentTypeId}
                        onChange={handleChange('rentalPaymentTypeId')}
                        disabled={saving || Boolean(original?.is_active)}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      >
                        <MenuItem value="" disabled>Select payment frequency...</MenuItem>
                        {paymentTypes.map((pt) => (
                          <MenuItem key={pt.id} value={pt.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{pt.name}</Typography>
                              {pt.duration_days && (
                                <Chip label={`${parseFloat(pt.duration_days)} days`} size="small" sx={{ height: 18, fontSize: '0.62rem' }} />
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    {/* Payment Timing */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Payment Timing</FieldLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={formData.paymentTimingId}
                        onChange={handleChange('paymentTimingId')}
                        disabled={saving || Boolean(original?.is_active)}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      >
                        <MenuItem value="" disabled>Select payment timing...</MenuItem>
                        {paymentTimings.map((tm) => (
                          <MenuItem key={tm.id} value={tm.id}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{tm.name}</Typography>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    {/* Grace Period — whole months with no rent due at lease start */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel>Grace Period (Months)</FieldLabel>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="0"
                        value={formData.gracePeriod}
                        onChange={handleGracePeriodChange}
                        disabled={saving || Boolean(original?.is_active)}
                        inputProps={{ min: 0, step: 1 }}
                        error={termCalculations.totalMonths > 0 && gracePeriodMonths > termCalculations.totalMonths}
                        helperText={
                          termCalculations.totalMonths > 0 && gracePeriodMonths > termCalculations.totalMonths
                            ? `Cannot exceed the ${termCalculations.totalMonths} months contract duration`
                            : 'Whole number of months (no decimals) with no rent charged at lease start. Defaults to 0.'
                        }
                        InputProps={{
                          endAdornment: <InputAdornment position="end">months</InputAdornment>,
                        }}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Rent per Square Meter */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Rent per m² (Monthly Rate)</FieldLabel>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="0.00"
                        value={formData.rentAmountPerSquareMeter}
                        onChange={(e) => handlePerSqmChange(e.target.value)}
                        disabled={saving || Boolean(original?.is_active)}
                        inputProps={{ min: 0, step: '0.01' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                        }}
                        helperText={selectedUnit?.area_value ? `Unit area: ${selectedUnit.area_value} ${selectedUnit.area_unit_name || 'm²'}` : 'Select a unit to auto-compute total monthly rent'}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Monthly Rent Total */}
                    <Box sx={{ width: '100%' }}>
                      <FieldLabel required>Total Monthly Rent</FieldLabel>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        placeholder="0.00"
                        value={formData.rentAmountTotalPerMonth}
                        onChange={handleChange('rentAmountTotalPerMonth')}
                        disabled={saving || Boolean(original?.is_active)}
                        inputProps={{ min: 0, step: '0.01' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                        }}
                        helperText={formData.rentAmountPerSquareMeter && selectedUnit?.area_value ? 'Auto-calculated from Rent/m² × Unit Area' : 'Enter directly or compute via Rent per m²'}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            width: '100%',
                            borderRadius: 2,
                            backgroundColor: formData.rentAmountPerSquareMeter && selectedUnit?.area_value ? '#f0fdf4' : '#ffffff',
                          },
                        }}
                      />
                    </Box>

                    {/* Estimated Total Value Highlight */}
                    {totalContractValue > 0 && (
                      <Box sx={{ gridColumn: '1 / -1', width: '100%', p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Full Lease Term Estimate
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>
                              {gracePeriodMonths > 0
                                ? `${termCalculations.totalMonths} mo − ${gracePeriodMonths} grace = ${billableMonths} billable months × ETB ${formatCurrency(formData.rentAmountTotalPerMonth)} / month`
                                : `${termCalculations.totalMonths} months × ETB ${formatCurrency(formData.rentAmountTotalPerMonth)} / month`}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                              ESTIMATED CONTRACT TOTAL
                            </Typography>
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a' }}>
                              ETB {formatCurrency(totalContractValue)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Remarks / Special Stipulations */}
                    <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                      <FieldLabel required>Contract Remarks & Stipulations</FieldLabel>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        required
                        placeholder="Specify special terms, grace periods, utility deposits, or maintenance clauses..."
                        value={formData.remarks}
                        onChange={handleChange('remarks')}
                        disabled={saving || Boolean(original?.is_active)}
                        error={Boolean(errorMsg && !formData.remarks?.trim())}
                        helperText={errorMsg && !formData.remarks?.trim() ? 'Contract remarks & stipulations are required.' : ''}
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                      {/* Quick suggestion chips */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Suggestions:</Typography>
                        {[
                          'Standard commercial lease terms apply',
                          'Utilities & service charges billed separately',
                          'Includes 2-month refundable security deposit',
                          '5% annual rent escalation clause',
                        ].map((sug, i) => (
                          <Chip
                            key={i}
                            label={sug}
                            size="small"
                            onClick={() => {
                              if (original?.is_active) return;
                              setFormData((p) => ({
                                ...p,
                                remarks: p.remarks ? `${p.remarks}. ${sug}.` : `${sug}.`,
                              }));
                            }}
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              cursor: original?.is_active ? 'default' : 'pointer',
                              '&:hover': { backgroundColor: original?.is_active ? '#f1f5f9' : '#e2e8f0' },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* STEP 5: CONTRACT EXECUTION OPTIONS */}
              {activeSection === 4 && (
                <Box>
                  <FormSectionHeader
                    step={5}
                    icon={<ReceiptIcon sx={{ fontSize: 18 }} />}
                    title="Execution & Schedule Settings"
                    subtitle="Manage contract number, activation status, and schedule synchronization."
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                    {/* Contract Number */}
                    <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                      <FieldLabel required>Contract Number / Reference</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        value={formData.contractNumber}
                        onChange={handleChange('contractNumber')}
                        disabled={saving || Boolean(original?.is_active)}
                        placeholder="e.g. RC-2026-0001"
                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      />
                    </Box>

                    {/* Activation switch */}
                    <Box sx={{ width: '100%', p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive}
                            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                            disabled={saving || Boolean(original?.is_active)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              Contract Active Status
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {formData.isActive ? 'Contract is marked active and unit is leased.' : 'Contract is in draft/inactive mode.'}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Schedule Generation switch */}
                    <Box sx={{ width: '100%', p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.generateSchedule}
                            onChange={(e) => setFormData((p) => ({ ...p, generateSchedule: e.target.checked }))}
                            disabled={saving || Boolean(original?.is_active)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                Regenerate Payment Schedule
                              </Typography>
                              <Chip
                                label="Recommended"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  backgroundColor: '#e0e7ff',
                                  color: '#4338ca',
                                  border: '1px solid #c7d2fe',
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Recalculates and updates payment installments based on modified rent and duration.
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Step navigation footer */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  mt: 3,
                  pt: 2.5,
                  borderTop: '1px dashed #e2e8f0',
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
                  disabled={activeSection === 0 || saving}
                  onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#64748b',
                    borderColor: '#cbd5e1',
                    '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
                  }}
                >
                  Previous Step
                </Button>

                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                  Step {activeSection + 1} of 5
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  disabled={activeSection === 4 || saving}
                  onClick={() => setActiveSection((s) => Math.min(4, s + 1))}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4f46e5',
                    borderColor: '#c7d2fe',
                    backgroundColor: '#eef2ff',
                    '&:hover': { borderColor: '#818cf8', backgroundColor: '#e0e7ff' },
                  }}
                >
                  Next Step
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* DIV 2: LEASE AGREEMENT PREVIEW — bottom-left half */}
        <Paper
          className="div2"
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 1', lg: '1 / span 2' },
            gridRowStart: { lg: 3 },
            height: 'fit-content',
            alignSelf: 'start',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Banner */}
          <Box
            sx={{
              px: 3,
              pt: 2.5,
              pb: 2.5,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
              color: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon sx={{ fontSize: 18, color: '#818cf8' }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', color: '#cbd5e1', textTransform: 'uppercase' }}>
                  LEASE AGREEMENT PREVIEW
                </Typography>
              </Box>
              <Chip
                label={formData.isActive ? '● Active' : '○ Draft'}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: formData.isActive ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)',
                  color: formData.isActive ? '#34d399' : '#94a3b8',
                  border: `1px solid ${formData.isActive ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.25)'}`,
                }}
              />
            </Box>

            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', fontFamily: 'monospace', lineHeight: 1.2, mb: 0.5 }}>
              {formData.contractNumber || 'RC-PENDING'}
            </Typography>

            <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {selectedBuilding?.name || 'No Building Selected'}
              {selectedUnit ? ` • Unit ${selectedUnit.unit_number} (Floor ${selectedUnit.floor_number})` : ''}
            </Typography>

            {formData.contractStartDate && formData.contractEndDate && termCalculations.isValidRange && (
              <Box sx={{ mt: 1.75, px: 1.5, py: 0.6, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 13, color: '#818cf8' }} />
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                  {formData.contractStartDate} → {formData.contractEndDate}
                </Typography>
                <Box sx={{ width: '1px', height: 11, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 800 }}>
                  {termCalculations.totalMonths} mo
                </Typography>
              </Box>
            )}
          </Box>

          {/* Property Detail Rows */}
          <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
            {[
              { label: 'Contract Number', value: formData.contractNumber || '—' },
              { label: 'Lessee / Tenant', value: selectedTenant?.name || '— Unassigned' },
              { label: 'Premises', value: selectedUnit ? `Unit ${selectedUnit.unit_number} (Level ${selectedUnit.floor_number})` : '—' },
              { label: 'Space Use Type', value: selectedUnit?.unit_use_type || '—' },
              { label: 'Floor Area', value: selectedUnit?.area_value ? `${selectedUnit.area_value} ${selectedUnit.area_unit_name || 'm²'}` : '—' },
              { label: 'Rate per m²', value: formData.rentAmountPerSquareMeter ? `ETB ${formatCurrency(formData.rentAmountPerSquareMeter)}` : '—' },
              { label: 'Payment Cycle', value: selectedPaymentType?.name || '—' },
              { label: 'Grace Period', value: `${gracePeriodMonths} month(s) — no charge` },
            ].map((row, i, arr) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.85, borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <Typography sx={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>{row.label}</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Financial Summary Highlight */}
          <Box sx={{ mx: 3, my: 2, p: 2, borderRadius: 2.5, background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', border: '1px solid #e0e7ff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Box>
                <Typography sx={{ fontSize: '0.64rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                  Monthly Rent
                </Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#312e81' }}>
                  ETB {formatCurrency(formData.rentAmountTotalPerMonth)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.64rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>
                  Total Contract Value
                </Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d' }}>
                  ETB {formatCurrency(totalContractValue)}
                </Typography>
              </Box>
            </Box>
            {termCalculations.totalMonths > 0 && formData.rentAmountTotalPerMonth && (
              <Typography sx={{ fontSize: '0.7rem', color: '#6366f1', textAlign: 'center', mt: 0.75, fontWeight: 500 }}>
                {gracePeriodMonths > 0
                  ? `${termCalculations.totalMonths} mo − ${gracePeriodMonths} grace = ${billableMonths} billable months × ETB ${formatCurrency(formData.rentAmountTotalPerMonth)}`
                  : `${termCalculations.totalMonths} months × ETB ${formatCurrency(formData.rentAmountTotalPerMonth)}`}
              </Typography>
            )}
          </Box>

          {/* Readiness Checklist */}
          <Box sx={{ mx: 3, mb: 2, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25 }}>
              Update Readiness Checklist
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { done: !original?.is_active, label: original?.is_active ? 'Contract is locked (Active)' : 'Contract unlocked for editing' },
                { done: !!(formData.buildingId && formData.floorId && formData.unitId), label: 'Premises & unit allocated' },
                { done: !!formData.tenantOrganizationId, label: 'Tenant organization selected' },
                { done: !!(formData.contractStartDate && formData.contractEndDate && termCalculations.isValidRange), label: 'Valid lease duration set' },
                { done: !!(formData.rentalPaymentTypeId && formData.paymentTimingId), label: 'Payment terms configured' },
                { done: !!(formData.rentAmountPerSquareMeter && parseFloat(formData.rentAmountPerSquareMeter) > 0 && formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0), label: 'Rent calculated' },
                { done: !!formData.remarks?.trim(), label: 'Remarks & stipulations provided' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: item.done ? '#dcfce7' : '#fef3c7', border: `1.5px solid ${item.done ? '#86efac' : '#fde68a'}`, flexShrink: 0 }}>
                    {item.done ? <CheckCircleIcon sx={{ fontSize: 12, color: '#16a34a' }} /> : <WarningIcon sx={{ fontSize: 11, color: '#f59e0b' }} />}
                  </Box>
                  <Typography sx={{ fontSize: '0.74rem', color: item.done ? '#15803d' : '#78350f', fontWeight: item.done ? 600 : 500 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving || Boolean(original?.is_active)}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{
                py: 1.35,
                borderRadius: 2.5,
                fontWeight: 800,
                fontSize: '0.88rem',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                  boxShadow: '0 6px 20px rgba(79,70,229,0.45)',
                },
                '&:disabled': {
                  backgroundColor: '#e2e8f0',
                  color: '#94a3b8',
                },
              }}
            >
              {saving ? 'Updating Contract...' : original?.is_active ? 'Contract Locked (Active)' : 'Save Changes & Update Schedule'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate(`/contracts/${id}`)}
              disabled={saving}
              sx={{
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.82rem',
                textTransform: 'none',
                borderColor: '#cbd5e1',
                color: '#64748b',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              Cancel & Return
            </Button>
          </Box>
        </Paper>

        {/* DIV 3: AUTOMATED PAYMENT SCHEDULE — bottom-right half */}
        <Paper
          className="div3"
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 1', lg: '3 / span 2' },
            gridRowStart: { lg: 3 },
            height: 'fit-content',
            alignSelf: 'start',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Banner */}
          <Box
            sx={{
              px: 3,
              py: 2,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScheduleIcon sx={{ fontSize: 18, color: '#818cf8' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                  Automated Payment Schedule
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {showSavedSchedule
                    ? 'Saved installments from the database'
                    : selectedPaymentType?.name
                      ? `${selectedPaymentType.name} frequency (${parseFloat(selectedPaymentType.duration_days || 30)} days)`
                      : 'Recurring schedule simulator'}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={
                showSavedSchedule
                  ? `${savedPayments.length} Installments (Saved)`
                  : simulatedSchedule.length > 0 && formData.generateSchedule
                    ? `${simulatedSchedule.length} Installments (Preview)`
                    : 'Pending Setup'
              }
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: showSavedSchedule || (simulatedSchedule.length > 0 && formData.generateSchedule) ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.15)',
                color: showSavedSchedule || (simulatedSchedule.length > 0 && formData.generateSchedule) ? '#818cf8' : '#94a3b8',
                border: `1px solid ${showSavedSchedule || (simulatedSchedule.length > 0 && formData.generateSchedule) ? 'rgba(99,102,241,0.3)' : 'rgba(148,163,184,0.2)'}`,
              }}
            />
          </Box>

          {/* Body Content */}
          {showSavedSchedule ? (
            <>
              {/* Saved Schedule Summary Bar */}
              <Box sx={{ px: 3, py: 1.25, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {savedPayments.length} installments saved in the database
                  {savedPayments.some((p) => p.is_paid && Number(p.amount_due) === 0 && !p.transaction_reference)
                    ? ` • ${savedPayments.filter((p) => p.is_paid && Number(p.amount_due) === 0 && !p.transaction_reference).length} grace installment(s)`
                    : ''}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                  Total Due: ETB {formatCurrency(savedPayments.reduce((acc, p) => acc + (Number(p.amount_due) || 0), 0))}
                </Typography>
              </Box>

              {/* Saved Schedule Table */}
              <TableContainer sx={{ maxHeight: 520, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { background: '#f1f5f9' }, '&::-webkit-scrollbar-thumb': { background: '#c7d2fe', borderRadius: 4 } }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: '#f8fafc', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75, px: 2 } }}>
                      <TableCell>#</TableCell>
                      <TableCell>DUE DATE</TableCell>
                      <TableCell>NEXT PAYMENT</TableCell>
                      <TableCell align="right">AMOUNT DUE (ETB)</TableCell>
                      <TableCell align="right">AMOUNT PAID</TableCell>
                      <TableCell align="center">STATUS</TableCell>
                      <TableCell>REFERENCE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedPayments.map((p, idx) => {
                      const isGrace = Boolean(p.is_paid) && Number(p.amount_due) === 0 && !p.transaction_reference;
                      return (
                        <TableRow
                          key={p.id}
                          hover
                          sx={{
                            backgroundColor: isGrace ? '#eef2ff' : p.is_paid ? '#f0fdf4' : new Date(p.due_date) < new Date() ? '#fff7ed' : 'inherit',
                            '& td': { fontSize: '0.74rem', py: 0.85, px: 2 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#4f46e5' }}>#{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(p.due_date)}</TableCell>
                          <TableCell sx={{ color: '#64748b' }}>{formatDate(p.next_payment_date)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: isGrace ? '#94a3b8' : '#dc2626' }}>
                            ETB {formatCurrency(p.amount_due)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>
                            {p.amount_paid ? `ETB ${formatCurrency(p.amount_paid)}` : '—'}
                          </TableCell>
                          <TableCell align="center">
                            <SavedPaymentStatusChip isPaid={p.is_paid} isGrace={isGrace} dueDate={p.due_date} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {p.transaction_reference || (isGrace ? 'Grace — no reference' : '—')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ px: 3, py: 1.5, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                  Showing the installments saved in the database. Change the lease term, rent, frequency, or grace period to preview a regenerated schedule.
                </Typography>
              </Box>
            </>
          ) : simulatedSchedule.length > 0 && formData.generateSchedule ? (
            <>
              {savedPayments.length > 0 && (
                <Alert severity="info" sx={{ mx: 3, mt: 2, borderRadius: 2, fontSize: '0.78rem' }}>
                  Schedule inputs were modified — this is a preview. The {savedPayments.length} saved installment(s) will be replaced when you save.
                </Alert>
              )}
              {/* Summary Bar */}
              <Box sx={{ px: 3, py: 1.25, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {simulatedSchedule.length} installments scheduled
                  {gracePeriodMonths > 0 ? ` • ${gracePeriodMonths} grace month(s) deducted` : ''}
                  {Object.keys(editedAmounts).length > 0 ? ' • customized' : ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Total is locked to the contract value — editing an installment redistributes the amount across the other months">
                    <Chip
                      icon={<LockIcon sx={{ fontSize: 11 }} />}
                      label="Total locked"
                      size="small"
                      sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                    />
                  </Tooltip>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                    Total: ETB {formatCurrency(simulatedSchedule.reduce((acc, s) => acc + displayAmount(s), 0))}
                  </Typography>
                </Box>
              </Box>

              {/* Scrollable Schedule Table */}
              <TableContainer sx={{ maxHeight: 520, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { background: '#f1f5f9' }, '&::-webkit-scrollbar-thumb': { background: '#c7d2fe', borderRadius: 4 } }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: '#f8fafc', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', py: 0.75, px: 2 } }}>
                      <TableCell>#</TableCell>
                      <TableCell>DUE DATE</TableCell>
                      <TableCell align="right">CYCLE AMOUNT (ETB)</TableCell>
                      <TableCell align="right">STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simulatedSchedule.map((item) => (
                      <TableRow key={item.installmentNumber} hover sx={{ '& td': { fontSize: '0.74rem', py: 0.85, px: 2 } }}>
                        <TableCell sx={{ fontWeight: 700, color: '#4f46e5' }}>
                          #{item.installmentNumber}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.dueDate}
                        </TableCell>
                        <TableCell align="right">
                          {item.isGrace ? (
                            <Typography sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.74rem' }}>
                              ETB {formatCurrency(item.amount)}
                            </Typography>
                          ) : (
                            <TextField
                              size="small"
                              type="number"
                              value={displayAmount(item)}
                              onChange={(e) => handleAmountEdit(item.installmentNumber, e.target.value)}
                              disabled={saving || Boolean(original?.is_active)}
                              inputProps={{ min: 0, step: '0.01', sx: { textAlign: 'right', py: 0.5, fontSize: '0.78rem', fontWeight: 700 } }}
                              sx={{ width: 122, '& .MuiOutlinedInput-root': { borderRadius: 1.5, backgroundColor: '#ffffff' } }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {item.isGrace ? (
                            <Tooltip title="Grace period installment — marked paid with no transaction reference">
                              <Chip label="Paid • Grace" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#16a34a' }} />
                            </Tooltip>
                          ) : (
                            <Chip label="Simulated" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fef9c3', color: '#ca8a04' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                Payment Schedule Preview
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 300, mx: 'auto' }}>
                Define start date, valid term duration, monthly rent, and payment frequency to simulate recurring installments.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ContractEditPage;
