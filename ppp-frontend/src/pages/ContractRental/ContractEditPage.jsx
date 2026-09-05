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
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Description as ContractIcon,
  Payments as PaymentIcon,
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
  Lock as LockIcon,
  FlashOn as QuickIcon,
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

// Section Header Component
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
  });

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

  // Initial Data Fetching
  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      setErrorMsg('');
      try {
        const [contractRes, bldgRes, ptRes, timRes, orgRes] = await Promise.all([
          rentalContractService.getContractById(id),
          buildingsService.getBuildings({ limit: 100, is_active: true }),
          rentalPaymentTypesService.getRentalPaymentTypes({ limit: 100, status: 'active' }),
          paymentTimingsService.getPaymentTimings({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 200, status: 'active' }),
        ]);

        const c = contractRes?.contract || contractRes;
        setOriginal(c);

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

  // Compute Total Contract Value
  const totalContractValue = useMemo(() => {
    const monthly = parseFloat(formData.rentAmountTotalPerMonth) || 0;
    if (monthly <= 0 || termCalculations.totalMonths <= 0) return 0;
    return Math.round(monthly * termCalculations.totalMonths * 100) / 100;
  }, [formData.rentAmountTotalPerMonth, termCalculations.totalMonths]);

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

    const durationDays = selectedPaymentType?.duration_days
      ? parseInt(selectedPaymentType.duration_days, 10)
      : 30;
    const intervalDays = durationDays > 0 ? durationDays : 30;

    // Round up when decimal is >= 0.5 (e.g. 30.4 -> 30, but 30.5 or 30.6 -> 31)
    const totalDays = termCalculations.totalDays;
    const numberOfSchedules = Math.round(totalDays / intervalDays);
    if (numberOfSchedules <= 0) return [];

    const monthlyRent = parseFloat(formData.rentAmountTotalPerMonth) || 0;
    const amountPerCycle = parseFloat(((monthlyRent / 30) * intervalDays).toFixed(2));

    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const [sY, sM, sD] = formData.contractStartDate.split('-').map(Number);
    const [eY, eM, eD] = formData.contractEndDate.split('-').map(Number);
    const endBound = new Date(eY, eM - 1, eD);

    const schedule = [];
    let currentDue = new Date(sY, sM - 1, sD);

    for (let count = 1; count <= numberOfSchedules; count++) {
      const nextDue = new Date(currentDue);
      nextDue.setDate(nextDue.getDate() + intervalDays);

      const dueDateStr = formatYMD(currentDue);
      const nextDateStr = nextDue <= endBound ? formatYMD(nextDue) : null;

      schedule.push({
        installmentNumber: count,
        dueDate: dueDateStr,
        nextDate: nextDateStr,
        amount: amountPerCycle > 0 ? amountPerCycle : monthlyRent,
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
  ]);

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
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Skeleton variant="rounded" height={220} />
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
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate(`/contracts/${id}`)}
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                color: '#475569',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
            >
              Back to Details
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              Edit Rental Contract: {original?.contract_number}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
              Modify lease terms, financial pricing, duration schedule, and unit allocations.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={formData.isActive ? 'Active Contract' : 'Inactive / Draft'}
              color={formData.isActive ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Active Contract Alert */}
      {original?.is_active && (
        <Alert
          severity="warning"
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
          This rental contract is currently ACTIVE. Active contracts cannot be edited. If you need to make changes, please deactivate the contract from the details page first.
        </Alert>
      )}

      {/* Inline Error Alert */}
      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg('')}
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500, fontSize: '0.82rem' }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Form & Sidebar Grid Layout */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        className="parent"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(5, 1fr)' },
          gap: '16px',
        }}
      >
        {/* DIV 1: FORM SECTION (Main Form Columns) */}
        <Box
          className="div1"
          sx={{
            gridColumn: { xs: '1', lg: 'span 4' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* CARD 1: Premises & Unit Selection */}
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
              subtitle="Target Building, Floor level, and Building Unit allocation"
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
              {/* Target Building — Searchable Autocomplete */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Target Building <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Autocomplete
                  options={buildings}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option?.name ? `${option.name}${option.building_code ? ` (${option.building_code})` : ''}` : '';
                  }}
                  isOptionEqualToValue={(option, val) => option?.id === val?.id}
                  value={selectedBuilding}
                  onChange={handleBuildingChange}
                  disabled={saving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      placeholder="Search building name, code..."
                      error={Boolean(errorMsg && !formData.buildingId)}
                      helperText={errorMsg && !formData.buildingId ? 'Please select a building' : ''}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          width: '100%',
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                      <Box key={key} component="li" {...restProps} sx={{ py: 1, px: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BuildingIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                            {option.name}
                          </Typography>
                        </Box>
                        {option.address && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', ml: 3 }}>
                            {option.address}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                  noOptionsText="No matching buildings found"
                />
              </Box>

              {/* Floor Level */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Floor Level <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.floorId ? String(formData.floorId) : ''}
                  onChange={handleFloorChange}
                  disabled={Boolean(original?.is_active) || !formData.buildingId || loadingFloors || saving}
                  error={Boolean(errorMsg && !formData.floorId)}
                  helperText={
                    !formData.buildingId
                      ? 'Select a building first'
                      : loadingFloors
                      ? 'Loading floors...'
                      : errorMsg && !formData.floorId
                      ? 'Floor is required'
                      : ''
                  }
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.82rem' }}>
                    Select Floor Level
                  </MenuItem>
                  {floors.map((fl) => (
                    <MenuItem key={fl.id} value={String(fl.id)} sx={{ fontSize: '0.82rem' }}>
                      {fl.name} (Floor {fl.floor_number})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Building Unit */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Building Unit <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.unitId ? String(formData.unitId) : ''}
                  onChange={handleUnitChange}
                  disabled={Boolean(original?.is_active) || !formData.floorId || loadingUnits || saving}
                  error={Boolean(errorMsg && !formData.unitId)}
                  helperText={
                    !formData.floorId
                      ? 'Select a floor first'
                      : loadingUnits
                      ? 'Loading units...'
                      : errorMsg && !formData.unitId
                      ? 'Unit is required'
                      : ''
                  }
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.82rem' }}>
                    Select Building Unit
                  </MenuItem>
                  {units.map((u) => {
                    const isCurrentUnit = String(u.id) === String(original?.unit_id);
                    const isAlreadyRented = u.is_rented && !isCurrentUnit;
                    return (
                      <MenuItem
                        key={u.id}
                        value={String(u.id)}
                        disabled={isAlreadyRented}
                        sx={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}
                      >
                        <span>
                          Unit {u.unit_number} {u.area_value ? `(${u.area_value} m²)` : ''}
                        </span>
                        {isCurrentUnit ? (
                          <Chip label="Current" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#e0e7ff', color: '#4338ca' }} />
                        ) : isAlreadyRented ? (
                          <Chip label="Rented" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#fee2e2', color: '#dc2626' }} />
                        ) : null}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>

              {/* Tenant Organization — Searchable Autocomplete */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Tenant Organization <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Autocomplete
                  options={organizations}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option?.name || '';
                  }}
                  isOptionEqualToValue={(option, val) => option?.id === val?.id}
                  value={selectedTenant}
                  onChange={(event, newValue) => {
                    setFormData((p) => ({
                      ...p,
                      tenantOrganizationId: newValue ? newValue.id : '',
                    }));
                    if (errorMsg) setErrorMsg('');
                  }}
                  disabled={Boolean(original?.is_active) || saving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      placeholder="Search tenant organization..."
                      error={Boolean(errorMsg && !formData.tenantOrganizationId)}
                      helperText={errorMsg && !formData.tenantOrganizationId ? 'Tenant organization is required' : ''}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          width: '100%',
                          borderRadius: 2,
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                      <Box key={key} component="li" {...restProps} sx={{ py: 1, px: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TenantIcon sx={{ fontSize: 16, color: '#4f46e5' }} />
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                            {option.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.25, ml: 3 }}>
                          {option.organization_type && (
                            <Chip
                              label={option.organization_type}
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, backgroundColor: '#f1f5f9' }}
                            />
                          )}
                          {option.email && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {option.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText="No matching organizations found"
                />
              </Box>
            </Box>

            {/* Selected Unit Details Banner */}
            {selectedUnit && (
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
                      Unit {selectedUnit.unit_number} {selectedUnit.floor_number ? `• Floor ${selectedUnit.floor_number}` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Use Type: {selectedUnit.unit_use_type || 'Commercial Space'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Floor Area</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedUnit.area_value ? `${selectedUnit.area_value} m²` : 'Not Specified'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUnit.id === original?.unit_id ? 'Current Unit' : selectedUnit.is_rented ? 'Rented' : 'Available'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: selectedUnit.id === original?.unit_id ? '#e0e7ff' : selectedUnit.is_rented ? '#fee2e2' : '#dcfce7',
                      color: selectedUnit.id === original?.unit_id ? '#4338ca' : selectedUnit.is_rented ? '#dc2626' : '#16a34a',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Paper>

          {/* CARD 2: Lease Term & Agreement Schedule */}
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
              {/* Contract Reference Number */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contract Reference Number
                </Typography>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                      {formData.contractNumber || original?.contract_number || '—'}
                    </Typography>
                  </Box>
                  <Chip
                    label="Existing Reference"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      border: '1px solid #c7d2fe',
                    }}
                  />
                </Box>
              </Box>

              {/* Contract Start Date */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contract Start Date <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={handleStartDateChange}
                  disabled={saving}
                  error={Boolean(errorMsg && !formData.contractStartDate)}
                  helperText={errorMsg && !formData.contractStartDate ? 'Start date is required' : ''}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                />
              </Box>

              {/* Quick Term Duration: Years & Months inputs */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Quick Term Duration <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
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
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contract End Date <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: formData.contractEndDate ? '#0f172a' : '#94a3b8' }}>
                      {formData.contractEndDate || 'Auto-calculated from term'}
                    </Typography>
                  </Box>
                  <Chip
                    label="Computed End Date"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      border: '1px solid #86efac',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Calculated Duration Banner */}
            {formData.contractStartDate && formData.contractEndDate && (
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
                {!termCalculations.isValidRange && (
                  <Typography sx={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                    Warning: End date must be strictly after the start date.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>

          {/* CARD 3: Financial Terms & Rent Calculator */}
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
              subtitle="Pricing matrix, billing frequency, and recurring rent calculations"
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
              {/* Payment Frequency */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Payment Frequency <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.rentalPaymentTypeId}
                  onChange={handleChange('rentalPaymentTypeId')}
                  disabled={saving}
                  error={Boolean(errorMsg && !formData.rentalPaymentTypeId)}
                  helperText={errorMsg && !formData.rentalPaymentTypeId ? 'Payment frequency is required' : ''}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.82rem' }}>
                    Select Payment Frequency
                  </MenuItem>
                  {paymentTypes.map((pt) => (
                    <MenuItem key={pt.id} value={pt.id} sx={{ fontSize: '0.82rem' }}>
                      {pt.name} {pt.duration_days ? `(${pt.duration_days} days)` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Payment Timing */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Payment Timing <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formData.paymentTimingId}
                  onChange={handleChange('paymentTimingId')}
                  disabled={saving}
                  error={Boolean(errorMsg && !formData.paymentTimingId)}
                  helperText={errorMsg && !formData.paymentTimingId ? 'Payment timing is required' : ''}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.82rem' }}>
                    Select Timing
                  </MenuItem>
                  {paymentTimings.map((tm) => (
                    <MenuItem key={tm.id} value={tm.id} sx={{ fontSize: '0.82rem' }}>
                      {tm.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Rent per Square Meter (Editable driver) */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Rent per Square Meter <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="e.g. 200.00"
                  value={formData.rentAmountPerSquareMeter}
                  onChange={(e) => handlePerSqmChange(e.target.value)}
                  disabled={saving}
                  error={Boolean(errorMsg && (!formData.rentAmountPerSquareMeter || parseFloat(formData.rentAmountPerSquareMeter) <= 0))}
                  helperText={
                    selectedUnit?.area_value
                      ? `Calculates total from ${selectedUnit.area_value} m²`
                      : 'Select a unit with area to calculate total rent'
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/m²</InputAdornment>,
                  }}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { width: '100%', borderRadius: 2 } }}
                />
              </Box>

              {/* Total Monthly Rent — read-only display box */}
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Total Monthly Rent <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 40,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                      ETB
                    </Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: formData.rentAmountTotalPerMonth ? '#16a34a' : '#94a3b8' }}>
                      {formData.rentAmountTotalPerMonth
                        ? formatCurrency(formData.rentAmountTotalPerMonth)
                        : selectedUnit?.area_value
                        ? 'Enter rate per m²'
                        : 'Select a unit first'}
                    </Typography>
                  </Box>
                  <Chip
                    label="Auto-Calculated"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      border: '1px solid #86efac',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* CARD 4: Operational Settings & Execution Parameters */}
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
              title="Operational Settings & Execution Parameters"
              subtitle="Contract activation, ledger automation, and compliance stipulations"
              badge="Execution"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                columnGap: 2.5,
                rowGap: 2,
              }}
            >
              {/* Active Contract Switch */}
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
                        Active Contract
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                        When enabled, marks the leased unit as "Rented" and enables recurring billing immediately.
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Auto-Generate Payment Schedule — Locked as always selected */}
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

              {/* Remarks / Special Stipulations — Mandatory */}
              <Box sx={{ gridColumn: '1 / -1', width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contract Remarks & Stipulations <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                </Typography>
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
          </Paper>
        </Box>

        {/* RIGHT SIDEBAR COLUMN: Preview & Schedule */}
        <Box
          sx={{
            gridColumn: { xs: '1', lg: 5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* DIV 2: LEASE AGREEMENT PREVIEW */}
          <Paper
            className="div2"
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
          {/* Header Banner */}
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
                  Review & Update Contract
                </Typography>
              </Box>
            </Box>
            <Chip
              label={formData.contractNumber || 'RC-CURRENT'}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 800,
                backgroundColor: 'rgba(99,102,241,0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.3)',
                fontFamily: 'monospace',
              }}
            />
          </Box>

          {/* Quick Snapshot Rows */}
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Unit & Property */}
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                Premises
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedUnit ? `Unit ${selectedUnit.unit_number}` : 'No Unit Selected'}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                {selectedBuilding?.name || 'Building pending'}
                {selectedUnit?.floor_number ? ` • Floor ${selectedUnit.floor_number}` : ''}
                {selectedUnit?.area_value ? ` • ${selectedUnit.area_value} m²` : ''}
              </Typography>
            </Box>

            <Divider />

            {/* Tenant */}
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                Lessee / Tenant
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedTenant?.name || 'Individual / Unspecified Tenant'}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                {selectedTenant?.organization_type || 'Private Organization'}
              </Typography>
            </Box>

            <Divider />

            {/* Timeline */}
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                Term & Duration
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                {formData.contractStartDate || 'Start'} → {formData.contractEndDate || 'End'}
              </Typography>
              {termCalculations.totalDays > 0 && (
                <Typography sx={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                  {termCalculations.totalMonths} Months ({termCalculations.totalDays} Days)
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Financial Summary */}
            <Box sx={{ backgroundColor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Rate / m²</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                  ETB {formatCurrency(formData.rentAmountPerSquareMeter || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Monthly Rent</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                  ETB {formatCurrency(formData.rentAmountTotalPerMonth || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.75, borderTop: '1px dashed #cbd5e1' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>Contract Value</Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#4f46e5' }}>
                  ETB {formatCurrency(totalContractValue)}
                </Typography>
              </Box>
              {selectedPaymentType && (
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.75, textAlign: 'center' }}>
                  Billed {selectedPaymentType.name.toLowerCase()}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Readiness Checklist */}
          <Box sx={{ mx: 3, mb: 2, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25 }}>
              Update Readiness Checklist
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
            <Tooltip title={original?.is_active ? 'Active contracts cannot be edited. Deactivate first.' : ''}>
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={Boolean(original?.is_active) || saving}
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
                  {saving ? 'Updating Lease...' : 'Save Changes'}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="text"
              fullWidth
              disabled={saving}
              onClick={() => navigate(`/contracts/${id}`)}
              sx={{
                py: 0.75,
                borderRadius: 2,
                fontSize: '0.78rem',
                color: '#64748b',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
              }}
            >
              Cancel & Discard Edits
            </Button>
          </Box>
        </Paper>

        {/* DIV 3: Automated Payment Schedule */}
        <Paper
          className="div3"
          elevation={0}
          sx={{
            gridColumnStart: { xs: '1', lg: 5 },
            gridRow: { xs: 'auto', lg: 2 },
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
              label={simulatedSchedule.length > 0 ? `${simulatedSchedule.length} Installments` : 'Pending Setup'}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: simulatedSchedule.length > 0 ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.15)',
                color: simulatedSchedule.length > 0 ? '#818cf8' : '#94a3b8',
                border: `1px solid ${simulatedSchedule.length > 0 ? 'rgba(99,102,241,0.3)' : 'rgba(148,163,184,0.2)'}`,
              }}
            />
          </Box>

          {/* Body Content */}
          {simulatedSchedule.length > 0 ? (
            <>
              {/* Summary Bar */}
              <Box sx={{ px: 3, py: 1.25, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {simulatedSchedule.length} installments scheduled
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
                      <TableCell align="right">CYCLE AMOUNT</TableCell>
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
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>
                          ETB {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label="Pending" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fef9c3', color: '#ca8a04' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ px: 3, py: 1.5, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center' }}>
                  Installment schedule aligned with contract duration and payment frequency.
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
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
    </Box>
  );
};

export default ContractEditPage;
