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
  useMediaQuery,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Layers as FloorIcon,
  MeetingRoom as UnitIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
import { buildingTypesService } from '../../services/foundationService/buildingTypesService';
import { regionsService } from '../../services/foundationService/regionsService';
import { zonesService } from '../../services/foundationService/zonesService';
import { woredasService } from '../../services/foundationService/woredasService';
import { areaUnitsService } from '../../services/foundationService/areaUnitsService';
import { floorTypesService } from '../../services/foundationService/floorTypesService';

const extractArray = (res, field) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (field && Array.isArray(res[field])) return res[field];
  if (field && res.data && Array.isArray(res.data[field])) return res.data[field];
  if (Array.isArray(res.rows)) return res.rows;
  if (res.data && Array.isArray(res.data.rows)) return res.data.rows;
  return [];
};

export const BuildingEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nameAmharic: '',
    nameAfaanOromo: '',
    description: '',
    buildingTypeId: '',
    regionId: '',
    zoneId: '',
    woredaId: '',
    address: '',
    totalFloors: '',
    totalAreaValue: '',
    areaUnitId: '',
    yearBuilt: '',
  });

  // Dynamic Floor & Unit Line Items
  const [floorsList, setFloorsList] = useState([]);
  const [expandedFloorIndex, setExpandedFloorIndex] = useState(null);

  // Lookups
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [areaUnits, setAreaUnits] = useState([]);
  const [floorTypes, setFloorTypes] = useState([]);

  const [buildingMeta, setBuildingMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Lookups and Building Details
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [btRes, regRes, auRes, ftRes, buildingRes, floorsRes, unitsRes] = await Promise.all([
          buildingTypesService.getBuildingTypes({ limit: 100 }),
          regionsService.getRegions({ limit: 100 }),
          areaUnitsService.getAreaUnits({ limit: 100 }),
          floorTypesService.getFloorTypes({ limit: 100, status: 'active' }),
          buildingsService.getBuildingById(id),
          buildingFloorsService.getFloors({ buildingId: id, limit: 100 }),
          buildingUnitsService.getUnits({ buildingId: id, limit: 200 }),
        ]);

        const btList = extractArray(btRes, 'buildingTypes');
        const regList = extractArray(regRes, 'regions');
        const auList = extractArray(auRes, 'areaUnits');
        const ftList = extractArray(ftRes, 'floorTypes');

        setBuildingTypes(btList);
        setRegions(regList);
        setAreaUnits(auList);
        setFloorTypes(ftList);

        const b = buildingRes?.data?.building || buildingRes?.building || buildingRes?.data || buildingRes;
        const existingFloors = extractArray(floorsRes, 'floors');
        const existingUnits = extractArray(unitsRes, 'units');

        if (b) {
          setBuildingMeta({
            floorsCount: existingFloors.length || b.floors_count || b.total_floors || 0,
            unitsCount: existingUnits.length || b.units_count || 0,
          });

          setFormData({
            name: b.name || '',
            nameAmharic: b.name_amharic || '',
            nameAfaanOromo: b.name_afaan_oromo || '',
            description: b.description || '',
            buildingTypeId: b.building_type_id || '',
            regionId: b.region_id || '',
            zoneId: b.zone_id || '',
            woredaId: b.woreda_id || '',
            address: b.address || '',
            totalFloors: b.total_floors !== null && b.total_floors !== undefined ? b.total_floors.toString() : '',
            totalAreaValue: b.total_area_value !== null && b.total_area_value !== undefined ? b.total_area_value.toString() : '',
            areaUnitId: b.area_unit_id || '',
            yearBuilt: b.year_built !== null && b.year_built !== undefined ? b.year_built.toString() : '',
          });

          // Map existing floors and units to line items
          if (existingFloors.length > 0) {
            const mapped = existingFloors.map((f) => {
              const fUnits = existingUnits.filter((u) => u.floor_id === f.id || String(u.floor_number) === String(f.floor_number));
              const expectedCount = f.expected_unit_count !== undefined && f.expected_unit_count !== null
                ? parseInt(f.expected_unit_count, 10)
                : (fUnits.length || 4);

              // Existing unit items
              const unitItems = fUnits.map((u) => ({
                id: u.id,
                unitNumber: u.unit_number || '',
                unitUseType: u.unit_use_type || 'Commercial',
                areaValue: u.area_value !== null && u.area_value !== undefined ? u.area_value.toString() : '',
                isRented: Boolean(u.is_rented),
                isForRent: u.is_for_rent !== undefined ? Boolean(u.is_for_rent) : true,
                isActive: u.is_active !== undefined ? Boolean(u.is_active) : true,
              }));

              // If unit items are fewer than expectedCount, add remaining unit templates
              if (unitItems.length < expectedCount) {
                const startIdx = unitItems.length + 1;
                for (let u = startIdx; u <= expectedCount; u++) {
                  unitItems.push({
                    unitNumber: `${f.floor_number}-${String(u).padStart(2, '0')}`,
                    unitUseType: 'Commercial',
                    areaValue: '',
                    isRented: false,
                    isForRent: true,
                    isActive: true,
                  });
                }
              }

              return {
                id: f.id,
                floorNumber: f.floor_number,
                name: f.name || `Floor ${f.floor_number}`,
                floorTypeId: f.floor_type_id || (ftList[0]?.id || ''),
                expectedUnitCount: expectedCount,
                units: unitItems,
              };
            });
            setFloorsList(mapped);
          } else if (b.total_floors && b.total_floors > 0) {
            // Generate floor line items if no floor records existed yet in database
            const defaultFtId = ftList[0]?.id || '';
            const genFloors = [];
            for (let i = 1; i <= b.total_floors; i++) {
              const defaultUnits = 4;
              const units = [];
              for (let u = 1; u <= defaultUnits; u++) {
                units.push({
                  unitNumber: `${i}-${String(u).padStart(2, '0')}`,
                  unitUseType: 'Commercial',
                  areaValue: '',
                  isRented: false,
                  isForRent: true,
                  isActive: true,
                });
              }
              genFloors.push({
                floorNumber: i,
                name: `Floor ${i}`,
                floorTypeId: defaultFtId,
                expectedUnitCount: defaultUnits,
                units,
              });
            }
            setFloorsList(genFloors);
          }

          if (b.region_id) {
            const zRes = await zonesService.getZones({ regionId: b.region_id, limit: 100 });
            setZones(extractArray(zRes, 'zones'));
          }
          if (b.zone_id) {
            const wRes = await woredasService.getWoredas({ zoneId: b.zone_id, limit: 100 });
            setWoredas(extractArray(wRes, 'woredas'));
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load building details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadInitialData();
  }, [id]);

  const handleRegionChange = async (e) => {
    const regionId = e.target.value;
    setFormData((prev) => ({ ...prev, regionId, zoneId: '', woredaId: '' }));
    setZones([]);
    setWoredas([]);
    if (regionId) {
      try {
        const res = await zonesService.getZones({ regionId, limit: 100 });
        setZones(extractArray(res, 'zones'));
      } catch (err) {
        console.error('Failed to load zones:', err);
      }
    }
  };

  const handleZoneChange = async (e) => {
    const zoneId = e.target.value;
    setFormData((prev) => ({ ...prev, zoneId, woredaId: '' }));
    setWoredas([]);
    if (zoneId) {
      try {
        const res = await woredasService.getWoredas({ zoneId, limit: 100 });
        setWoredas(extractArray(res, 'woredas'));
      } catch (err) {
        console.error('Failed to load woredas:', err);
      }
    }
  };

  // Adjust floor line items when totalFloors is edited
  const handleTotalFloorsChange = (val) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    setFormData((prev) => ({ ...prev, totalFloors: cleanVal }));
    if (errorMsg) setErrorMsg('');

    const count = parseInt(cleanVal, 10);
    if (!count || count < 1) {
      setFloorsList([]);
      return;
    }

    const defaultFloorTypeId = floorTypes[0]?.id || '';

    setFloorsList((prev) => {
      const currentList = [...prev];
      if (currentList.length < count) {
        // Add new floors
        for (let i = currentList.length + 1; i <= count; i++) {
          const defaultUnitsPerFloor = 4;
          const initialUnits = [];
          for (let u = 1; u <= defaultUnitsPerFloor; u++) {
            initialUnits.push({
              unitNumber: `${i}-${String(u).padStart(2, '0')}`,
              unitUseType: 'Commercial',
              areaValue: '',
              isRented: false,
              isForRent: true,
              isActive: true,
            });
          }
          currentList.push({
            floorNumber: i,
            name: `Floor ${i}`,
            floorTypeId: defaultFloorTypeId,
            expectedUnitCount: defaultUnitsPerFloor,
            units: initialUnits,
          });
        }
        return currentList;
      } else if (currentList.length > count) {
        // Trim excess floors
        return currentList.slice(0, count);
      }
      return currentList;
    });
  };

  const handleChange = (field) => (e) => {
    if (field === 'totalFloors') {
      handleTotalFloorsChange(e.target.value);
    } else {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errorMsg) setErrorMsg('');
    }
  };

  // --- Floor Line Item Handlers ---
  const handleFloorFieldChange = (index, field, value) => {
    setFloorsList((prev) => {
      const updated = [...prev];
      const floor = { ...updated[index] };

      if (field === 'expectedUnitCount') {
        const cleanCount = value.replace(/[^0-9]/g, '');
        const newExpected = cleanCount === '' ? 0 : parseInt(cleanCount, 10);
        floor.expectedUnitCount = cleanCount;

        // Synchronize unit line items for this floor
        const currentUnits = floor.units || [];
        const floorNum = floor.floorNumber;
        if (currentUnits.length < newExpected) {
          const nextUnits = [...currentUnits];
          for (let u = currentUnits.length + 1; u <= newExpected; u++) {
            nextUnits.push({
              unitNumber: `${floorNum}-${String(u).padStart(2, '0')}`,
              unitUseType: 'Commercial',
              areaValue: '',
              isRented: false,
              isForRent: true,
              isActive: true,
            });
          }
          floor.units = nextUnits;
        } else if (currentUnits.length > newExpected) {
          floor.units = currentUnits.slice(0, newExpected);
        }
      } else {
        floor[field] = value;
      }

      updated[index] = floor;
      return updated;
    });
  };

  // --- Unit Line Item Handlers ---
  const handleUnitFieldChange = (floorIndex, unitIndex, field, value) => {
    setFloorsList((prev) => {
      const updated = [...prev];
      const floor = { ...updated[floorIndex] };
      const units = [...floor.units];
      units[unitIndex] = { ...units[unitIndex], [field]: value };
      floor.units = units;
      updated[floorIndex] = floor;
      return updated;
    });
  };

  const handleAddUnitToFloor = (floorIndex) => {
    setFloorsList((prev) => {
      const updated = [...prev];
      const floor = { ...updated[floorIndex] };
      const units = [...floor.units];
      const nextIdx = units.length + 1;
      units.push({
        unitNumber: `${floor.floorNumber}-${String(nextIdx).padStart(2, '0')}`,
        unitUseType: 'Commercial',
        areaValue: '',
        isRented: false,
        isForRent: true,
        isActive: true,
      });
      floor.units = units;
      floor.expectedUnitCount = units.length;
      updated[floorIndex] = floor;
      return updated;
    });
  };

  const handleRemoveUnitFromFloor = (floorIndex, unitIndex) => {
    setFloorsList((prev) => {
      const updated = [...prev];
      const floor = { ...updated[floorIndex] };
      const units = floor.units.filter((_, idx) => idx !== unitIndex);
      floor.units = units;
      floor.expectedUnitCount = units.length;
      updated[floorIndex] = floor;
      return updated;
    });
  };

  const totalCalculatedUnits = floorsList.reduce((acc, f) => acc + (f.units?.length || 0), 0);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) { setErrorMsg('Building name is required.'); return; }
    if (!formData.buildingTypeId) { setErrorMsg('Building Type is required.'); return; }

    const totalFloorsVal = Number(formData.totalFloors);
    if (!formData.totalFloors || isNaN(totalFloorsVal) || totalFloorsVal < 1 || !Number.isInteger(totalFloorsVal)) {
      setErrorMsg('Total floors must be a whole number greater than 0.');
      return;
    }

    // Validate floor line items
    for (let i = 0; i < floorsList.length; i++) {
      const f = floorsList[i];
      if (!f.name || !f.name.trim()) {
        setErrorMsg(`Floor name is required for Floor #${f.floorNumber}.`);
        return;
      }
      if (!f.floorTypeId) {
        setErrorMsg(`Please select a Floor Type for "${f.name}".`);
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      nameAmharic: formData.nameAmharic.trim() || null,
      nameAfaanOromo: formData.nameAfaanOromo.trim() || null,
      description: formData.description.trim() || null,
      buildingTypeId: formData.buildingTypeId,
      regionId: formData.regionId || null,
      zoneId: formData.zoneId || null,
      woredaId: formData.woredaId || null,
      address: formData.address.trim() || null,
      totalFloors: floorsList.length > 0 ? floorsList.length : parseInt(formData.totalFloors, 10),
      totalAreaValue: formData.totalAreaValue ? parseFloat(formData.totalAreaValue) : null,
      areaUnitId: formData.areaUnitId || null,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : null,
      floors: floorsList.map((f) => ({
        id: f.id || null,
        floorNumber: parseInt(f.floorNumber, 10),
        name: f.name.trim(),
        floorTypeId: f.floorTypeId,
        expectedUnitCount: parseInt(f.expectedUnitCount, 10) || 0,
        units: (f.units || []).map((u) => ({
          id: u.id || null,
          unitNumber: u.unitNumber.trim(),
          unitUseType: u.unitUseType || 'Commercial',
          areaValue: u.areaValue ? parseFloat(u.areaValue) : null,
          areaUnitId: formData.areaUnitId || null,
          isRented: u.isRented !== undefined ? Boolean(u.isRented) : false,
          isForRent: u.isForRent !== undefined ? Boolean(u.isForRent) : true,
          isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
        })),
      })),
    };

    setSaving(true);
    try {
      await buildingsService.updateBuilding(id, payload);
      enqueueSnackbar('Building and floor structure updated successfully', { variant: 'success' });
      navigate(`/buildings/${id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update building.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} sx={{ color: '#4f46e5', mb: 2 }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          Loading building details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/buildings" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Buildings
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Edit Building
            </Typography>
          </Breadcrumbs>

          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Edit: {formData.name || 'Building'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/buildings/${id}`)}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Back to Details
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Main 3-Column Paper Grid */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4, md: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 4,
              alignItems: 'start',
            }}
          >
            {/* Column 1: Basic Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Basic Information
              </Typography>
              <Divider />

              <TextField
                required
                fullWidth
                label="Building Name"
                placeholder="e.g. Commercial Center Tower A"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Amharic Name"
                placeholder="e.g. የንግድ ማዕከል ህንፃ ሀ"
                value={formData.nameAmharic}
                onChange={handleChange('nameAmharic')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Afaan Oromo Name"
                placeholder="e.g. Gamoo Daldalaa A"
                value={formData.nameAfaanOromo}
                onChange={handleChange('nameAfaanOromo')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                select
                fullWidth
                label="Building Type"
                value={formData.buildingTypeId}
                onChange={handleChange('buildingTypeId')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Building Type</MenuItem>
                {buildingTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description & Notes"
                placeholder="Describe key architectural features, structural notes, or operational purpose..."
                value={formData.description}
                onChange={handleChange('description')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Column 2: Structure & Measurements */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Structure & Measurements
              </Typography>
              <Divider />

              {buildingMeta && (
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Current Records:</Typography>
                  <Chip
                    icon={<FloorIcon sx={{ fontSize: '13px !important' }} />}
                    label={`${buildingMeta.floorsCount} Floors`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#eef2ff', color: '#4f46e5' }}
                  />
                  <Chip
                    icon={<UnitIcon sx={{ fontSize: '13px !important' }} />}
                    label={`${buildingMeta.unitsCount} Units`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#f0fdf4', color: '#16a34a' }}
                  />
                </Box>
              )}

              <TextField
                required
                fullWidth
                type="number"
                label="Total Floors"
                placeholder="e.g. 8"
                value={formData.totalFloors}
                onChange={handleChange('totalFloors')}
                onKeyDown={(e) => {
                  if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                size="small"
                disabled={saving}
                inputProps={{ min: 1, max: 200, step: 1 }}
                helperText="Enter whole number > 0 to configure floor line items below"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                type="number"
                label="Total Area Value"
                placeholder="e.g. 4500.50"
                value={formData.totalAreaValue}
                onChange={handleChange('totalAreaValue')}
                size="small"
                disabled={saving}
                inputProps={{ min: 0, step: 'any' }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                select
                fullWidth
                label="Area Measurement Unit"
                value={formData.areaUnitId}
                onChange={handleChange('areaUnitId')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">None / Not Specified</MenuItem>
                {areaUnits.map((au) => (
                  <MenuItem key={au.id} value={au.id}>
                    {au.name} {au.code ? `(${au.code})` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                type="number"
                label="Year Built / Commissioned"
                placeholder="e.g. 2022"
                value={formData.yearBuilt}
                onChange={handleChange('yearBuilt')}
                size="small"
                disabled={saving}
                inputProps={{ min: 1900, max: 2100 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Column 3: Location & Address */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Location & Address
              </Typography>
              <Divider />

              <TextField
                select
                fullWidth
                label="Region"
                value={formData.regionId}
                onChange={handleRegionChange}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">Select Region</MenuItem>
                {regions.map((reg) => (
                  <MenuItem key={reg.id} value={reg.id}>{reg.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Zone / Sub-city"
                value={formData.zoneId}
                onChange={handleZoneChange}
                size="small"
                disabled={saving || !formData.regionId}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">Select Zone / Sub-city</MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Woreda"
                value={formData.woredaId}
                onChange={handleChange('woredaId')}
                size="small"
                disabled={saving || !formData.zoneId}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">Select Woreda</MenuItem>
                {woredas.map((woreda) => (
                  <MenuItem key={woreda.id} value={woreda.id}>{woreda.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Street Address / Specific Location"
                placeholder="e.g. Bole Road, Next to Commercial Plaza, Kebele 03"
                value={formData.address}
                onChange={handleChange('address')}
                size="small"
                disabled={saving}
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* DYNAMIC FLOORS & UNITS LINE ITEMS SECTION */}
          {floorsList.length > 0 && (
            <Box sx={{ mt: 5, pt: 3, borderTop: '2px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FloorIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
                    Building Floor & Unit Structure
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Review and update floor names, floor types, and unit records for this building.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Chip
                    icon={<FloorIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${floorsList.length} Floors`}
                    size="small"
                    sx={{ backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: 700 }}
                  />
                  <Chip
                    icon={<UnitIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${totalCalculatedUnits} Units Configured`}
                    size="small"
                    sx={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700 }}
                  />
                </Box>
              </Box>

              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', width: 100 }}>FLOOR #</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', minWidth: 200 }}>FLOOR NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', minWidth: 200 }}>FLOOR TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', width: 160, textAlign: 'center' }}>EXPECTED UNITS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', width: 140, textAlign: 'center' }}>UNITS LIST</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {floorsList.map((floor, floorIndex) => {
                      const isExpanded = expandedFloorIndex === floorIndex;
                      const unitsCount = floor.units?.length || 0;

                      return (
                        <React.Fragment key={floor.id || floor.floorNumber}>
                          <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => setExpandedFloorIndex(isExpanded ? null : floorIndex)}
                                sx={{ color: '#4f46e5' }}
                              >
                                {isExpanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </TableCell>

                            <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                              <Chip
                                label={`Level ${floor.floorNumber}`}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#334155' }}
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={floor.name}
                                onChange={(e) => handleFloorFieldChange(floorIndex, 'name', e.target.value)}
                                placeholder="e.g. Ground Floor, Floor 1"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                            </TableCell>

                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                value={floor.floorTypeId}
                                onChange={(e) => handleFloorFieldChange(floorIndex, 'floorTypeId', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              >
                                <MenuItem value="" disabled>Select Floor Type</MenuItem>
                                {floorTypes.map((ft) => (
                                  <MenuItem key={ft.id} value={ft.id}>
                                    {ft.name} {ft.code ? `(${ft.code})` : ''}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center' }}>
                              <TextField
                                type="number"
                                size="small"
                                value={floor.expectedUnitCount}
                                onChange={(e) => handleFloorFieldChange(floorIndex, 'expectedUnitCount', e.target.value)}
                                inputProps={{ min: 0, max: 100, step: 1, style: { textAlign: 'center' } }}
                                sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center' }}>
                              <Button
                                size="small"
                                variant={isExpanded ? 'contained' : 'outlined'}
                                onClick={() => setExpandedFloorIndex(isExpanded ? null : floorIndex)}
                                startIcon={<UnitIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: isExpanded ? '#4f46e5' : 'transparent',
                                  color: isExpanded ? 'white' : '#4f46e5',
                                  borderColor: '#c7d2fe',
                                }}
                              >
                                {unitsCount} Units
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Nested Unit Line Items for this Floor */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2.5, my: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #cbd5e1' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Units for {floor.name} (Level {floor.floorNumber}) — {unitsCount} Unit Line Items
                                    </Typography>
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                      onClick={() => handleAddUnitToFloor(floorIndex)}
                                      sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', color: '#4f46e5' }}
                                    >
                                      + Add Unit Row
                                    </Button>
                                  </Box>

                                  {unitsCount === 0 ? (
                                    <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 1.5, border: '1px dashed #cbd5e1' }}>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        No units configured for this floor. Enter an Expected Units count above or click "+ Add Unit Row".
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, backgroundColor: '#ffffff' }}>
                                      <Table size="small">
                                        <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                          <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 45 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', minWidth: 130 }}>UNIT NUMBER</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', minWidth: 150 }}>USE / SPACE TYPE</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 110 }}>AREA VALUE</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 100 }}>FOR RENT?</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 100 }}>RENTED?</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 100 }}>STATUS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', width: 60, textAlign: 'center' }}>ACTION</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {floor.units.map((unit, unitIndex) => (
                                            <TableRow key={unit.id || unitIndex}>
                                              <TableCell sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                                                {unitIndex + 1}
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  size="small"
                                                  fullWidth
                                                  value={unit.unitNumber}
                                                  onChange={(e) => handleUnitFieldChange(floorIndex, unitIndex, 'unitNumber', e.target.value)}
                                                  placeholder="e.g. 1-01"
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                />
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  select
                                                  size="small"
                                                  fullWidth
                                                  value={unit.unitUseType}
                                                  onChange={(e) => handleUnitFieldChange(floorIndex, unitIndex, 'unitUseType', e.target.value)}
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                >
                                                  <MenuItem value="Commercial">Commercial</MenuItem>
                                                  <MenuItem value="Office">Office</MenuItem>
                                                  <MenuItem value="Retail">Retail / Shop</MenuItem>
                                                  <MenuItem value="Residential">Residential</MenuItem>
                                                  <MenuItem value="Storage">Storage / Warehouse</MenuItem>
                                                  <MenuItem value="Clinic">Clinic / Health</MenuItem>
                                                  <MenuItem value="Restaurant">Restaurant / Cafe</MenuItem>
                                                  <MenuItem value="Utility">Utility / Common Area</MenuItem>
                                                  <MenuItem value="Other">Other</MenuItem>
                                                </TextField>
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  type="number"
                                                  size="small"
                                                  fullWidth
                                                  value={unit.areaValue}
                                                  onChange={(e) => handleUnitFieldChange(floorIndex, unitIndex, 'areaValue', e.target.value)}
                                                  placeholder="e.g. 50"
                                                  inputProps={{ min: 0, step: 'any' }}
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                />
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  select
                                                  size="small"
                                                  fullWidth
                                                  value={unit.isForRent !== false ? 'true' : 'false'}
                                                  onChange={(e) => {
                                                    const isForRent = e.target.value === 'true';
                                                    handleUnitFieldChange(floorIndex, unitIndex, 'isForRent', isForRent);
                                                    if (!isForRent) {
                                                      handleUnitFieldChange(floorIndex, unitIndex, 'isRented', false);
                                                    }
                                                  }}
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                >
                                                  <MenuItem value="true">Yes</MenuItem>
                                                  <MenuItem value="false">No</MenuItem>
                                                </TextField>
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  select
                                                  size="small"
                                                  fullWidth
                                                  disabled={unit.isForRent === false}
                                                  value={unit.isRented ? 'true' : 'false'}
                                                  onChange={(e) => handleUnitFieldChange(floorIndex, unitIndex, 'isRented', e.target.value === 'true')}
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                >
                                                  <MenuItem value="false">Vacant</MenuItem>
                                                  <MenuItem value="true">Rented</MenuItem>
                                                </TextField>
                                              </TableCell>

                                              <TableCell>
                                                <TextField
                                                  select
                                                  size="small"
                                                  fullWidth
                                                  value={unit.isActive !== false ? 'true' : 'false'}
                                                  onChange={(e) => handleUnitFieldChange(floorIndex, unitIndex, 'isActive', e.target.value === 'true')}
                                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem' } }}
                                                >
                                                  <MenuItem value="true">Active</MenuItem>
                                                  <MenuItem value="false">Inactive</MenuItem>
                                                </TextField>
                                              </TableCell>

                                              <TableCell sx={{ textAlign: 'center' }}>
                                                <Tooltip title="Remove unit">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveUnitFromFloor(floorIndex, unitIndex)}
                                                    sx={{ color: '#ef4444' }}
                                                  >
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                  </IconButton>
                                                </Tooltip>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Submit Actions Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate(`/buildings/${id}`)}
              disabled={saving}
              sx={{ borderRadius: 2, px: 3, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default BuildingEditPage;
