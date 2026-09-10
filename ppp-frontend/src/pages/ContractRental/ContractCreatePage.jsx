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
  Grid,
  InputAdornment,
  Tooltip,
  IconButton,
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
  AutoFixHigh as AutoIcon,
  Info as InfoIcon,
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
  FlashOn as QuickIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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

export const ContractCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Query parameter extraction for pre-populating form
  const queryBuildingId = searchParams.get('buildingId') || '';
  const queryFloorId = searchParams.get('floorId') || '';
  const queryUnitId = searchParams.get('unitId') || '';
  const queryTenantId = searchParams.get('tenantId') || '';

  // Initial Form State
  const initialFormState = {
    buildingId: queryBuildingId,
    floorId: queryFloorId,
    unitId: queryUnitId,
    tenantOrganizationId: queryTenantId,
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    rentalPaymentTypeId: '',
    paymentTimingId: '',
    rentAmountPerSquareMeter: '',
    rentAmountTotalPerMonth: '',
    remarks: '',
    isActive: true,
    generateSchedule: true,
    gracePeriod: '0',
  };

  // Lease duration inputs (year + month fields)
  const [leaseDurationYears, setLeaseDurationYears] = useState('');
  const [leaseDurationMonths, setLeaseDurationMonths] = useState('');

  const [formData, setFormData] = useState(initialFormState);

  // Lookups
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTimings, setPaymentTimings] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Loading and error states
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active tab index for the core form area (pure UI state — sections 1-5)
  const [activeSection, setActiveSection] = useState(0);

  // Selected unit snapshot
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Fetch initial lookups
  useEffect(() => {
    const init = async () => {
      setLoadingLookups(true);
      try {
        const [bRes, ptRes, timRes, orgRes] = await Promise.all([
          buildingsService.getBuildings({ limit: 200, status: 'active' }),
          rentalPaymentTypesService.getRentalPaymentTypes({ limit: 100, status: 'active' }),
          paymentTimingsService.getPaymentTimings({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 200, status: 'active' }),
        ]);

        const buildingsList = bRes?.buildings || bRes?.rows || (Array.isArray(bRes) ? bRes : []);
        const pTypes = ptRes?.rentalPaymentTypes || ptRes?.rows || (Array.isArray(ptRes) ? ptRes : []);
        const pTimings = timRes?.paymentTimings || timRes?.rows || (Array.isArray(timRes) ? timRes : []);
        const orgs = orgRes?.organizations || orgRes?.rows || (Array.isArray(orgRes) ? orgRes : []);

        setBuildings(buildingsList);
        setPaymentTypes(pTypes);
        setPaymentTimings(pTimings);
        setOrganizations(orgs);

        // Auto-select standard defaults if available
        setFormData((prev) => {
          const next = { ...prev };
          if (!next.rentalPaymentTypeId && pTypes.length > 0) {
            // Find "Monthly" or first
            const monthly = pTypes.find((p) => p.name.toLowerCase().includes('month')) || pTypes[0];
            next.rentalPaymentTypeId = monthly.id;
          }
          if (!next.paymentTimingId && pTimings.length > 0) {
            const advance = pTimings.find((p) => p.name.toLowerCase().includes('advance')) || pTimings[0];
            next.paymentTimingId = advance.id;
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to load initial lookups:', err);
        enqueueSnackbar('Failed to load foundation data', { variant: 'error' });
      } finally {
        setLoadingLookups(false);
      }
    };
    init();
  }, [enqueueSnackbar]);

  // Cascading: Building -> Floors
  useEffect(() => {
    if (!formData.buildingId) {
      setFloors([]);
      setUnits([]);
      setFormData((p) => ({ ...p, floorId: '', unitId: '' }));
      setSelectedUnit(null);
      return;
    }

    setLoadingFloors(true);
    buildingFloorsService
      .getFloors({ buildingId: formData.buildingId, limit: 100, status: 'active' })
      .then((r) => {
        const floorRows = r?.floors || r?.rows || (Array.isArray(r) ? r : []);
        setFloors(floorRows);
        // If there's an active query param floorId, verify and keep it
        if (queryFloorId && floorRows.some((f) => f.id === queryFloorId)) {
          setFormData((p) => ({ ...p, floorId: queryFloorId }));
        }
      })
      .catch(() => {
        enqueueSnackbar('Failed to load building floors', { variant: 'error' });
      })
      .finally(() => setLoadingFloors(false));
  }, [formData.buildingId, queryFloorId, enqueueSnackbar]);

  // Cascading: Floor -> Units
  useEffect(() => {
    if (!formData.floorId) {
      setUnits([]);
      setFormData((p) => ({ ...p, unitId: '' }));
      setSelectedUnit(null);
      return;
    }

    setLoadingUnits(true);
    buildingUnitsService
      .getUnits({ floorId: formData.floorId, limit: 100, status: 'active' })
      .then((r) => {
        const unitRows = r?.units || r?.rows || (Array.isArray(r) ? r : []);
        setUnits(unitRows);
        // If query param unitId matches, select it
        if (queryUnitId && unitRows.some((u) => u.id === queryUnitId)) {
          setFormData((p) => ({ ...p, unitId: queryUnitId }));
        }
      })
      .catch(() => {
        enqueueSnackbar('Failed to load floor units', { variant: 'error' });
      })
      .finally(() => setLoadingUnits(false));
  }, [formData.floorId, queryUnitId, enqueueSnackbar]);

  // Update selectedUnit snapshot and auto-compute rate when unitId changes
  useEffect(() => {
    if (!formData.unitId) {
      setSelectedUnit(null);
      return;
    }
    const unit = units.find((u) => u.id === formData.unitId);
    setSelectedUnit(unit || null);

    if (unit?.area_value && formData.rentAmountPerSquareMeter) {
      const area = parseFloat(unit.area_value);
      const perSqm = parseFloat(formData.rentAmountPerSquareMeter);
      if (!isNaN(area) && !isNaN(perSqm) && area > 0) {
        const total = (area * perSqm).toFixed(2);
        setFormData((p) => ({ ...p, rentAmountTotalPerMonth: total }));
      }
    }
  }, [formData.unitId, units]);

  // Handle auto-calculating Total Monthly Rent from Rent per m² × unit area
  const handlePerSqmChange = (val) => {
    setFormData((p) => {
      const next = { ...p, rentAmountPerSquareMeter: val };
      if (selectedUnit?.area_value && val !== '') {
        const area = parseFloat(selectedUnit.area_value);
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

  // Recalculate end date from start + years + months fields
  const recalcEndDate = (startDate, years, months) => {
    const y = parseInt(years, 10) || 0;
    const m = parseInt(months, 10) || 0;
    if (!startDate || (y === 0 && m === 0)) return '';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + y);
    end.setMonth(end.getMonth() + m);
    end.setDate(end.getDate() - 1); // day before = standard end
    return end.toISOString().split('T')[0];
  };

  const handleDurationYearChange = (e) => {
    const raw = e.target.value;
    // Only allow positive integers
    if (raw !== '' && (!/^\d+$/.test(raw) || parseInt(raw, 10) < 1)) return;
    setLeaseDurationYears(raw);
    const newEnd = recalcEndDate(formData.contractStartDate, raw, leaseDurationMonths);
    setFormData((p) => ({ ...p, contractEndDate: newEnd }));
    if (errorMsg) setErrorMsg('');
  };

  const handleDurationMonthChange = (e) => {
    const raw = e.target.value;
    // Only allow non-negative integers between 0 and 11
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

  // Selected payment type object
  const selectedPaymentType = useMemo(() => {
    return paymentTypes.find((pt) => pt.id === formData.rentalPaymentTypeId) || null;
  }, [paymentTypes, formData.rentalPaymentTypeId]);

  // Selected building object
  const selectedBuilding = useMemo(() => {
    return buildings.find((b) => b.id === formData.buildingId) || null;
  }, [buildings, formData.buildingId]);

  // Selected organization object
  const selectedTenant = useMemo(() => {
    return organizations.find((o) => o.id === formData.tenantOrganizationId) || null;
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

  // Live Payment Schedule Simulator
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

    // duration_days is numeric(10,2) — keep its decimal part (e.g. 15.50) in every schedule calculation
    const durationDays = selectedPaymentType?.duration_days
      ? parseFloat(selectedPaymentType.duration_days)
      : 30;
    const intervalDays = durationDays > 0 ? durationDays : 30;
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    // Round up when decimal is >= 0.5 (e.g. 30.4 -> 30, but 30.5 or 30.6 -> 31)
    const totalDays = termCalculations.totalDays;
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= 0) return [];

    // The schedule lists the PRE-GRACE amounts first: the contract total (monthly rent × lease
    // months) distributed evenly across the installments. The grace deduction (grace months ×
    // monthly rent) is then taken off the FIRST installments top-down — leading installments are
    // zeroed (pre-paid grace) or reduced until the deduction is consumed, and every other
    // installment keeps its pre-grace amount. Rounding cents are absorbed by the last installment.
    const monthly = parseFloat(formData.rentAmountTotalPerMonth) || 0;
    const noGraceTotal = round2(monthly * termCalculations.totalMonths);
    const graceDeduction = round2(monthly * gracePeriodMonths);

    const baseAmounts = [];
    let runningBase = 0;
    for (let i = 0; i < numberOfSchedules; i++) {
      if (i === numberOfSchedules - 1) {
        baseAmounts.push(Math.max(0, round2(noGraceTotal - runningBase)));
      } else {
        const amt = round2(noGraceTotal / numberOfSchedules);
        baseAmounts.push(amt);
        runningBase = round2(runningBase + amt);
      }
    }

    const amounts = [];
    const graceFlags = [];
    let remainingDeduction = graceDeduction;
    for (let i = 0; i < numberOfSchedules; i++) {
      if (remainingDeduction > 0 && baseAmounts[i] > 0 && remainingDeduction >= baseAmounts[i]) {
        amounts.push(0);
        graceFlags.push(true);
        remainingDeduction = round2(remainingDeduction - baseAmounts[i]);
      } else if (remainingDeduction > 0 && baseAmounts[i] > 0) {
        amounts.push(round2(baseAmounts[i] - remainingDeduction));
        graceFlags.push(false);
        remainingDeduction = 0;
      } else {
        amounts.push(baseAmounts[i]);
        graceFlags.push(false);
      }
    }

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const [sY, sM, sD] = formData.contractStartDate.split('-').map(Number);
    const [eY, eM, eD] = formData.contractEndDate.split('-').map(Number);
    const endBound = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

    // Payment timing: ADVANCE bills from the contract start; AFTER_USAGE bills exactly one
    // month (the payment-type month unit nearest to 30) after the contract start.
    const selectedTiming = paymentTimings.find((t) => String(t.id) === String(formData.paymentTimingId));
    const afterUsage = String(selectedTiming?.timing_code || '').trim().toUpperCase() === 'AFTER_USAGE';

    const schedule = [];
    // Anchor at noon so fractional-day intervals and DST shifts never cross a calendar date boundary
    let currentDue = new Date(sY, sM - 1, sD, 12);
    if (afterUsage) currentDue = new Date(currentDue.getTime() + monthDays * 24 * 60 * 60 * 1000);

    for (let count = 1; count <= numberOfSchedules; count++) {
      const nextDue = new Date(currentDue.getTime() + intervalMs);

      const dueDateStr = formatYMD(currentDue);
      const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;
      const isGrace = graceFlags[count - 1];

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
    formData.paymentTimingId,
    termCalculations.totalDays,
    termCalculations.totalMonths,
    termCalculations.isValidRange,
    formData.rentAmountTotalPerMonth,
    selectedPaymentType,
    paymentTimings,
    gracePeriodMonths,
    monthDays,
  ]);

  // Validation
  const validate = () => {
    if (!formData.buildingId) return 'Please select a building.';
    if (!formData.floorId) return 'Please select a floor level.';
    if (!formData.unitId) return 'Please select a specific unit.';
    if (!formData.tenantOrganizationId) return 'Please select a tenant organization.';
    if (selectedUnit?.is_rented) return 'The selected unit is already leased under an active contract.';
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
    const err = validate();
    if (err) {
      setErrorMsg(err);
      enqueueSnackbar(err, { variant: 'error' });
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const floor = floors.find((f) => f.id === formData.floorId);
      const payload = {
        buildingId: formData.buildingId,
        floorId: formData.floorId,
        unitId: formData.unitId,
        floorNumber: floor?.floor_number ?? selectedUnit?.floor_number ?? null,
        unitNumber: selectedUnit?.unit_number ?? null,
        areaValue: selectedUnit?.area_value ? parseFloat(selectedUnit.area_value) : null,
        tenantOrganizationId: formData.tenantOrganizationId || null,
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
      };

      const res = await rentalContractService.createContract(payload);
      const contractId = res?.contract?.id || res?.id;

      enqueueSnackbar(res?.message || 'Rental contract created successfully!', { variant: 'success' });
      navigate(contractId ? `/contracts/${contractId}` : '/contracts');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to create rental contract.';
      setErrorMsg(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Quick autofill demo handler
  const handleAutofillDemo = () => {
    if (buildings.length > 0 && !formData.buildingId) {
      setFormData((p) => ({ ...p, buildingId: buildings[0].id }));
    }
    if (organizations.length > 0 && !formData.tenantOrganizationId) {
      setFormData((p) => ({ ...p, tenantOrganizationId: organizations[0].id }));
    }
    const newYears = '1';
    const newMonths = '';
    setLeaseDurationYears(newYears);
    setLeaseDurationMonths(newMonths);
    const newEnd = recalcEndDate(formData.contractStartDate, newYears, newMonths);
    setFormData((p) => ({
      ...p,
      contractEndDate: newEnd,
      rentAmountPerSquareMeter: '200.00',
      rentAmountTotalPerMonth: '',
      remarks: 'Standard Commercial Lease Agreement. Includes access to shared facilities.',
    }));
    enqueueSnackbar('Populated sample lease values for testing', { variant: 'info' });
  };

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
              New Lease Agreement
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<QuickIcon sx={{ fontSize: 16 }} />}
              onClick={handleAutofillDemo}
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
              Autofill Sample
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/contracts')}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#64748b',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              Back to Contracts
            </Button>
          </Box>
        </Box>

        {/* Hero Title */}
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
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
              Create Rental Contract
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              Draft a formal commercial lease agreement with real-time rent computation and automated schedule generation.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Global Error Alert */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Workspace: full-width form on top, preview & schedule side-by-side below (4-col grid) */}
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
              aria-label="Contract form sections"
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
              {activeSection === 0 && (
              <Box>
                <FormSectionHeader
                  step={1}
                  icon={<BuildingIcon sx={{ fontSize: 18 }} />}
                  title="Premises & Space Selection"
                  subtitle="Select the specific building, floor level, and unit to be leased."
                  badge="Required"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                  {/* Building Selection — searchable Autocomplete, full-width anchor */}
                  <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                    <FieldLabel required>Target Building</FieldLabel>
                    <Autocomplete
                      fullWidth
                      size="small"
                      disabled={saving || loadingLookups}
                      options={buildings}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option?.name || '';
                      }}
                      isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
                      value={selectedBuilding}
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          buildingId: newValue ? newValue.id : '',
                          floorId: '',
                          unitId: '',
                        }));
                        setFloors([]);
                        setUnits([]);
                        setSelectedUnit(null);
                        if (errorMsg) setErrorMsg('');
                      }}
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
                      onChange={handleChange('floorId')}
                      disabled={saving || !formData.buildingId || loadingFloors}
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
                              {f.name} (Level {f.floor_number})
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
                      onChange={handleChange('unitId')}
                      disabled={saving || !formData.floorId || loadingUnits}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                      InputProps={{
                        endAdornment: loadingUnits ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                      }}
                    >
                      <MenuItem value="" disabled>
                        {!formData.floorId ? 'Select a floor level first' : 'Select Unit...'}
                      </MenuItem>
                      {/* Units flagged not-for-rent are hidden from the list */}
                      {units.filter((u) => u.is_for_rent !== false).map((u) => {
                        const isRented = u.is_rented;
                        return (
                          <MenuItem key={u.id} value={u.id} disabled={isRented}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', py: 0.25 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UnitIcon sx={{ fontSize: 16, color: isRented ? '#cbd5e1' : '#10b981' }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isRented ? '#94a3b8' : '#0f172a' }}>
                                  Unit {u.unit_number}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  • {u.unit_use_type || 'General Use'}
                                </Typography>
                                {u.area_value && (
                                  <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    • {u.area_value} {u.area_unit_name || u.area_unit_code || 'm²'}
                                  </Typography>
                                )}
                              </Box>
                              {isRented ? (
                                <Chip
                                  label="Already Rented"
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}
                                />
                              ) : (
                                <Chip
                                  label="Available"
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#16a34a' }}
                                />
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Box>

                  {/* Unit Availability Strip / Selected Unit Snapshot */}
                  <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                    {selectedUnit ? (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          backgroundColor: selectedUnit.is_rented ? '#fff1f2' : '#f0fdf4',
                          border: selectedUnit.is_rented ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2,
                              backgroundColor: selectedUnit.is_rented ? '#ffe4e6' : '#dcfce7',
                              color: selectedUnit.is_rented ? '#e11d48' : '#16a34a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <UnitIcon sx={{ fontSize: 22 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                              Unit {selectedUnit.unit_number} Snapshot
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Floor {selectedUnit.floor_number} • Use Type: <strong>{selectedUnit.unit_use_type || 'General'}</strong>
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {selectedUnit.area_value && (
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                FLOOR AREA
                              </Typography>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                                {selectedUnit.area_value} {selectedUnit.area_unit_name || selectedUnit.area_unit_code || 'm²'}
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={selectedUnit.is_rented ? 'Leased / Occupied' : 'Ready to Lease'}
                            size="small"
                            sx={{
                              height: 24,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              backgroundColor: selectedUnit.is_rented ? '#fee2e2' : '#dcfce7',
                              color: selectedUnit.is_rented ? '#dc2626' : '#15803d',
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 1.75,
                          borderRadius: 2.5,
                          border: '1px dashed #cbd5e1',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                        }}
                      >
                        <UnitIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Select a floor level to view unit availability and area
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
              )}

              {/* SECTION 2: TENANT & LESSEE INFORMATION */}
              {activeSection === 1 && (
              <Box>
                <FormSectionHeader
                  step={2}
                  icon={<TenantIcon sx={{ fontSize: 18 }} />}
                  title="Tenant / Lessee Organization"
                  subtitle="Specify the tenant party legally bound to this lease agreement."
                  badge="Required"
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                  {/* Tenant Organization — searchable Autocomplete */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Tenant Organization</FieldLabel>
                    <Autocomplete
                      fullWidth
                      size="small"
                      disabled={saving || loadingLookups}
                      options={organizations}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option?.name || '';
                      }}
                      isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
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
                          <Box component="li" key={option.id || key} {...restProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
                            <TenantIcon sx={{ fontSize: 18, color: '#4f46e5', flexShrink: 0 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                                {option.name}
                              </Typography>
                              {(option.organization_type_name || option.email) && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {option.organization_type_name ? `${option.organization_type_name} • ` : ''}{option.email || option.phone || ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search & select organization..."
                          error={Boolean(errorMsg && !formData.tenantOrganizationId)}
                          helperText={errorMsg && !formData.tenantOrganizationId ? 'Tenant organization is required' : ''}
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
                        '& .MuiOutlinedInput-root': {
                          width: '100%',
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>

                  {/* Selected tenant contact strip */}
                  {selectedTenant && (
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TenantIcon sx={{ fontSize: 15, color: '#4f46e5' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                          Selected Tenant: <strong>{selectedTenant.name}</strong>
                          {selectedTenant.email ? ` • Email: ${selectedTenant.email}` : ''}
                          {selectedTenant.phone ? ` • Tel: ${selectedTenant.phone}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              )}

              {/* SECTION 3: CONTRACT PERIOD & PAYMENT TERMS */}
              {activeSection === 2 && (
              <Box>
                <FormSectionHeader
                  step={3}
                  icon={<CalendarIcon sx={{ fontSize: 18 }} />}
                  title="Lease Term & Agreement Schedule"
                  subtitle="Define contract reference number, validity dates, and payment cycles."
                  badge="Required"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, width: '100%' }}>
                  {/* Contract Reference Number — backend-generated, display only */}
                  <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                    <FieldLabel>Contract Reference Number</FieldLabel>
                    <Box
                      sx={{
                        height: 40,
                        width: '100%',
                        borderRadius: 2,
                        border: '1px dashed #c7d2fe',
                        backgroundColor: '#f8faff',
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        gap: 1,
                      }}
                    >
                      <AutoIcon sx={{ fontSize: 15, color: '#6366f1' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 700 }}>
                        Auto-generated by system on contract creation
                      </Typography>
                      <Chip
                        label="RC-YYYY-XXXX"
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#e0e7ff', color: '#4338ca', ml: 'auto' }}
                      />
                    </Box>
                  </Box>

                  {/* Start Date */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Contract Start Date</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={handleStartDateChange}
                      disabled={saving}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                    />
                  </Box>

                  {/* Lease Duration: Year + Month integer inputs */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Lease Duration</FieldLabel>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Years"
                        value={leaseDurationYears}
                        onChange={handleDurationYearChange}
                        disabled={saving}
                        inputProps={{ min: 1, step: 1 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>yr</Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: '50%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        placeholder="Months"
                        value={leaseDurationMonths}
                        onChange={handleDurationMonthChange}
                        disabled={saving}
                        inputProps={{ min: 0, max: 11, step: 1 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>mo</Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: '50%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Box>

                  {/* Contract End Date — read-only, auto-calculated */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Contract End Date</FieldLabel>
                    <Box
                      sx={{
                        height: 40,
                        width: '100%',
                        borderRadius: 2,
                        border: formData.contractEndDate && termCalculations.isValidRange ? '1px solid #bbf7d0' : '1px dashed #cbd5e1',
                        backgroundColor: formData.contractEndDate && termCalculations.isValidRange ? '#f0fdf4' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        gap: 1,
                      }}
                    >
                      <CalendarIcon sx={{ fontSize: 15, color: formData.contractEndDate ? '#16a34a' : '#94a3b8' }} />
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: formData.contractEndDate && termCalculations.isValidRange ? '#15803d' : '#94a3b8',
                        }}
                      >
                        {formData.contractEndDate || 'Set lease duration'}
                      </Typography>
                      {termCalculations.totalMonths > 0 && termCalculations.isValidRange && (
                        <Chip
                          label={`${termCalculations.totalMonths} mo • ${termCalculations.totalDays} d`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', ml: 'auto', flexShrink: 0 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>

                  {/* Payment Frequency (Rental Payment Type) */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Payment Frequency</FieldLabel>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={formData.rentalPaymentTypeId}
                      onChange={handleChange('rentalPaymentTypeId')}
                      disabled={saving || loadingLookups}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                    >
                      <MenuItem value="" disabled>
                        Select Payment Frequency...
                      </MenuItem>
                      {paymentTypes.map((pt) => (
                        <MenuItem key={pt.id} value={pt.id}>
                          {pt.name} {pt.duration_days ? `(${pt.duration_days} days)` : ''}
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
                      disabled={saving || loadingLookups}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                    >
                      <MenuItem value="" disabled>
                        Select Payment Timing...
                      </MenuItem>
                      {paymentTimings.map((tim) => (
                        <MenuItem key={tim.id} value={tim.id}>
                          {tim.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Grace Period — whole months with no rent due at lease start */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel>Grace Period</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0"
                      value={formData.gracePeriod}
                      onChange={handleGracePeriodChange}
                      disabled={saving}
                      inputProps={{ min: 0, step: 1 }}
                      error={termCalculations.totalMonths > 0 && gracePeriodMonths > termCalculations.totalMonths}
                      helperText={
                        termCalculations.totalMonths > 0 && gracePeriodMonths > termCalculations.totalMonths
                          ? `Cannot exceed the ${termCalculations.totalMonths} months contract duration`
                          : 'Whole number of months (no decimals) with no rent charged at lease start. Defaults to 0.'
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>months</Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                    />
                  </Box>
                </Box>
              </Box>
              )}

              {/* SECTION 4: FINANCIAL TERMS & RENT COMPUTATION */}
              {activeSection === 3 && (
              <Box>
                <FormSectionHeader
                  step={4}
                  icon={<PaymentIcon sx={{ fontSize: 18 }} />}
                  title="Financial Terms & Rent Calculator"
                  subtitle="Specify monthly rent directly, or set the rate per square meter to auto-calculate."
                  badge="Auto-Calculating"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                  {/* Rent per Square Meter — user enters this */}
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                      <FieldLabel required sx={{ mb: 0 }}>
                        Rent per Square Meter
                      </FieldLabel>
                      {selectedUnit?.area_value && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Unit Area: {selectedUnit.area_value} m²
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="e.g. 250.00"
                      value={formData.rentAmountPerSquareMeter}
                      onChange={handleChange('rentAmountPerSquareMeter')}
                      disabled={saving}
                      inputProps={{ min: 0, step: 'any' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ETB</Typography>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ m²</Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                    />
                  </Box>

                  {/* Total Monthly Rent — auto-calculated, read-only */}
                  <Box sx={{ width: '100%' }}>
                    <FieldLabel required>Total Monthly Rent</FieldLabel>
                    <Box
                      sx={{
                        height: 40,
                        width: '100%',
                        borderRadius: 2,
                        border: formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0
                          ? '1px solid #bbf7d0'
                          : '1px dashed #cbd5e1',
                        backgroundColor: formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0
                          ? '#f0fdf4'
                          : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ETB</Typography>
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0
                            ? '#15803d'
                            : '#94a3b8',
                          flexGrow: 1,
                        }}
                      >
                        {formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0
                          ? formatCurrency(formData.rentAmountTotalPerMonth)
                          : selectedUnit?.area_value
                            ? 'Enter rate per m² to calculate'
                            : 'Select a unit first'}
                      </Typography>
                      {formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0 && (
                        <Chip
                          label="Auto"
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.5 }}>
                      {selectedUnit?.area_value
                        ? `${selectedUnit.area_value} m² × rate per m²`
                        : 'Auto-calculated from unit area × rate'}
                    </Typography>
                  </Box>

                  {/* Live Financial Projection Card */}
                  {formData.rentAmountTotalPerMonth && parseFloat(formData.rentAmountTotalPerMonth) > 0 && (
                    <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            MONTHLY RENT
                          </Typography>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            ETB {formatCurrency(formData.rentAmountTotalPerMonth)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            ANNUAL EQUIVALENT (12 MO)
                          </Typography>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5' }}>
                            ETB {formatCurrency(parseFloat(formData.rentAmountTotalPerMonth) * 12)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            ESTIMATED CONTRACT TOTAL
                          </Typography>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>
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
                      disabled={saving}
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
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#e2e8f0' },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
              )}

              {/* SECTION 5: CONTRACT EXECUTION OPTIONS */}
              {activeSection === 4 && (
              <Box>
                <FormSectionHeader
                  step={5}
                  icon={<ReceiptIcon sx={{ fontSize: 18 }} />}
                  title="Execution & Schedule Settings"
                  subtitle="Control contract status on creation and automated installment generation."
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5, width: '100%' }}>
                  <Box sx={{ width: '100%', p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            Activate Contract Immediately
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                            When enabled, marks the leased unit as &quot;Rented&quot; and enables billing immediately.
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>

                  <Box sx={{ width: '100%', p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          disabled
                          color="primary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4f46e5',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4f46e5',
                              opacity: 0.6,
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              Auto-Generate Payment Schedule
                            </Typography>
                            <Chip
                              label="Always Active"
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
                            Generates recurring payment installments based on the selected payment frequency.
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Box>
              </Box>
              )}

              {/* Panel footer navigation */}
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
            gridColumn: { lg: '1 / span 2' },
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
                    RC-PENDING
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
                    Issuance Readiness Checklist
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {[
                      { done: !!(formData.buildingId && formData.floorId && formData.unitId), label: 'Premises & unit selected' },
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
                    disabled={saving}
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
                    }}
                  >
                    {saving ? 'Creating Agreement...' : 'Create Contract & Issue Schedule'}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/contracts')}
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

        {/* DIV 3: Automated Payment Schedule — bottom-right half */}
        <Paper
          className="div3"
          elevation={0}
          sx={{
            gridColumn: { lg: '3 / span 2' },
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
                        {selectedPaymentType?.name ? `${selectedPaymentType.name} frequency` : 'Recurring schedule simulator'}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={simulatedSchedule.length > 0 && formData.generateSchedule ? `${simulatedSchedule.length} Installments` : 'Pending Setup'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: simulatedSchedule.length > 0 && formData.generateSchedule ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.15)',
                      color: simulatedSchedule.length > 0 && formData.generateSchedule ? '#818cf8' : '#94a3b8',
                      border: `1px solid ${simulatedSchedule.length > 0 && formData.generateSchedule ? 'rgba(99,102,241,0.3)' : 'rgba(148,163,184,0.2)'}`,
                    }}
                  />
                </Box>

                {/* Body Content */}
                {simulatedSchedule.length > 0 && formData.generateSchedule ? (
                  <>
                    {/* Summary Bar */}
                    <Box sx={{ px: 3, py: 1.25, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {simulatedSchedule.length} installments scheduled
                        {gracePeriodMonths > 0 ? ` • ${gracePeriodMonths} grace month(s) deducted` : ''}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                        Total: ETB {formatCurrency(simulatedSchedule.reduce((acc, s) => acc + s.amount, 0))}
                      </Typography>
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
                              <TableCell align="right" sx={{ fontWeight: 700, color: item.isGrace ? '#94a3b8' : '#16a34a' }}>
                                ETB {formatCurrency(item.amount)}
                              </TableCell>
                              <TableCell align="right">
                                {item.isGrace ? (
                                  <Tooltip title="Grace period installment — marked paid with no transaction reference">
                                    <Chip label="Paid • Grace" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#16a34a' }} />
                                  </Tooltip>
                                ) : (
                                  <Chip label="Pending" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fef9c3', color: '#ca8a04' }} />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ px: 3, py: 1.5, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                        Installments will be automatically recorded in the billing ledger upon contract creation.
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
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
                      Schedule Simulation Pending
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', maxWidth: 300, mx: 'auto', mb: 2 }}>
                      Complete the lease period, payment frequency, and monthly rent on the left to preview automated payment installments.
                    </Typography>

                    {/* Prerequisite status checklist */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, textAlign: 'left', p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.unitId ? '#22c55e' : '#cbd5e1' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: formData.unitId ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          Unit: {formData.unitId ? 'Selected' : 'Missing'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: termCalculations.isValidRange ? '#22c55e' : '#cbd5e1' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: termCalculations.isValidRange ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          Dates: {termCalculations.isValidRange ? 'Configured' : 'Missing'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: formData.rentalPaymentTypeId ? '#22c55e' : '#cbd5e1' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: formData.rentalPaymentTypeId ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          Frequency: {formData.rentalPaymentTypeId ? 'Selected' : 'Missing'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: parseFloat(formData.rentAmountTotalPerMonth) > 0 ? '#22c55e' : '#cbd5e1' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: parseFloat(formData.rentAmountTotalPerMonth) > 0 ? '#15803d' : '#64748b', fontWeight: 600 }}>
                          Rent: {parseFloat(formData.rentAmountTotalPerMonth) > 0 ? 'Specified' : 'Missing'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ContractCreatePage;
