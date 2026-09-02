import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  Divider,
  Breadcrumbs,
  Link,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Apartment as BuildingIcon,
  LocationOn as LocationIcon,
  Layers as FloorIcon,
  SquareFoot as AreaIcon,
  MeetingRoom as UnitIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Info as InfoIcon,
  VpnKey as KeyIcon,
  HomeWork as RentalIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
import { floorTypesService } from '../../services/foundationService/floorTypesService';
import { areaUnitsService } from '../../services/foundationService/areaUnitsService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const BuildingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [floorTypes, setFloorTypes] = useState([]);
  const [areaUnits, setAreaUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFloorId, setExpandedFloorId] = useState(null);

  // Status Toggle Dialog
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Floor Dialog State
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorFormData, setFloorFormData] = useState({
    floorNumber: '',
    name: '',
    floorTypeId: '',
    expectedUnitCount: '4',
  });
  const [floorModalSaving, setFloorModalSaving] = useState(false);
  const [floorModalError, setFloorModalError] = useState('');

  // Unit Dialog State
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedFloorForUnit, setSelectedFloorForUnit] = useState(null);
  const [unitFormData, setUnitFormData] = useState({
    unitNumber: '',
    areaValue: '',
    areaUnitId: '',
    unitUseType: 'Commercial',
    isRented: false,
    isForRent: true,
  });
  const [unitModalSaving, setUnitModalSaving] = useState(false);
  const [unitModalError, setUnitModalError] = useState('');

  // Generic Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null); // { type: 'floor' | 'unit', data: object }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBuildingData = async () => {
    setLoading(true);
    try {
      const [buildingRes, floorsRes, unitsRes, ftRes, auRes] = await Promise.all([
        buildingsService.getBuildingById(id),
        buildingFloorsService.getFloors({ buildingId: id, limit: 100 }),
        buildingUnitsService.getUnits({ buildingId: id, limit: 200 }),
        floorTypesService.getFloorTypes({ limit: 100, status: 'active' }),
        areaUnitsService.getAreaUnits({ limit: 100, status: 'active' }),
      ]);

      setBuilding(buildingRes?.building || buildingRes);
      setFloors(floorsRes?.floors || floorsRes?.rows || (Array.isArray(floorsRes) ? floorsRes : []));
      setUnits(unitsRes?.units || unitsRes?.rows || (Array.isArray(unitsRes) ? unitsRes : []));
      setFloorTypes(ftRes?.floorTypes || ftRes?.rows || (Array.isArray(ftRes) ? ftRes : []));
      setAreaUnits(auRes?.areaUnits || auRes?.rows || (Array.isArray(auRes) ? auRes : []));
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load building data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBuildingData();
    }
  }, [id]);

  const handleToggleConfirm = async () => {
    if (!building) return;
    setToggleLoading(true);
    try {
      const result = await buildingsService.toggleBuildingStatus(building.id);
      enqueueSnackbar(result?.message || 'Building status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchBuildingData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  const getUnitsForFloor = (floorId) => {
    return units.filter((u) => u.floor_id === floorId);
  };

  // --- Floor Modal Handlers ---
  const handleOpenAddFloor = () => {
    setEditingFloor(null);
    setFloorModalError('');
    // Auto-suggest next floor number
    const existingFloorNumbers = floors.map((f) => Number(f.floor_number)).filter((n) => !isNaN(n));
    const nextFloorNum = existingFloorNumbers.length > 0 ? Math.max(...existingFloorNumbers) + 1 : 1;
    setFloorFormData({
      floorNumber: nextFloorNum.toString(),
      name: `Floor ${nextFloorNum}`,
      floorTypeId: floorTypes.length > 0 ? floorTypes[0].id : '',
      expectedUnitCount: '4',
    });
    setFloorModalOpen(true);
  };

  const handleOpenEditFloor = (floor, e) => {
    e?.stopPropagation();
    setEditingFloor(floor);
    setFloorModalError('');
    setFloorFormData({
      floorNumber: floor.floor_number !== undefined && floor.floor_number !== null ? floor.floor_number.toString() : '',
      name: floor.name || '',
      floorTypeId: floor.floor_type_id || '',
      expectedUnitCount: floor.expected_unit_count !== undefined && floor.expected_unit_count !== null ? floor.expected_unit_count.toString() : '0',
    });
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e) => {
    e?.preventDefault();
    setFloorModalError('');

    const floorNum = Number(floorFormData.floorNumber);
    if (!floorFormData.floorNumber || isNaN(floorNum) || floorNum < 1 || !Number.isInteger(floorNum)) {
      setFloorModalError('Floor number must be a whole number greater than 0.');
      return;
    }
    if (!floorFormData.name.trim()) {
      setFloorModalError('Floor name is required.');
      return;
    }
    if (!floorFormData.floorTypeId) {
      setFloorModalError('Floor type is required.');
      return;
    }
    const expectedUnits = Number(floorFormData.expectedUnitCount);
    if (floorFormData.expectedUnitCount === '' || isNaN(expectedUnits) || expectedUnits < 0 || !Number.isInteger(expectedUnits)) {
      setFloorModalError('Expected units per floor must be a whole number 0 or greater.');
      return;
    }

    setFloorModalSaving(true);
    try {
      if (editingFloor) {
        await buildingFloorsService.updateFloor(editingFloor.id, {
          floorNumber: floorNum,
          name: floorFormData.name.trim(),
          floorTypeId: floorFormData.floorTypeId,
          expectedUnitCount: expectedUnits,
        });
        enqueueSnackbar('Floor updated successfully', { variant: 'success' });
      } else {
        await buildingFloorsService.createFloor({
          buildingId: building.id,
          floorNumber: floorNum,
          name: floorFormData.name.trim(),
          floorTypeId: floorFormData.floorTypeId,
          expectedUnitCount: expectedUnits,
        });
        enqueueSnackbar('Floor created successfully', { variant: 'success' });
      }
      setFloorModalOpen(false);
      fetchBuildingData();
    } catch (err) {
      setFloorModalError(err.message || 'Failed to save floor');
    } finally {
      setFloorModalSaving(false);
    }
  };

  // --- Unit Modal Handlers ---
  const handleOpenAddUnit = (floor, e) => {
    e?.stopPropagation();
    setSelectedFloorForUnit(floor);
    setEditingUnit(null);
    setUnitModalError('');

    const floorUnits = getUnitsForFloor(floor.id);
    const nextUnitIdx = floorUnits.length + 1;
    const suggestedUnitNumber = `${floor.floor_number}-${String(nextUnitIdx).padStart(2, '0')}`;

    setUnitFormData({
      unitNumber: suggestedUnitNumber,
      areaValue: '',
      areaUnitId: building.area_unit_id || (areaUnits.length > 0 ? areaUnits[0].id : ''),
      unitUseType: 'Commercial',
      isRented: false,
      isForRent: true,
    });
    setUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit, floor, e) => {
    e?.stopPropagation();
    setSelectedFloorForUnit(floor);
    setEditingUnit(unit);
    setUnitModalError('');
    setUnitFormData({
      unitNumber: unit.unit_number || '',
      areaValue: unit.area_value !== null && unit.area_value !== undefined ? unit.area_value.toString() : '',
      areaUnitId: unit.area_unit_id || '',
      unitUseType: unit.unit_use_type || 'Commercial',
      isRented: Boolean(unit.is_rented),
      isForRent: unit.is_for_rent !== undefined ? Boolean(unit.is_for_rent) : true,
    });
    setUnitModalOpen(true);
  };

  const handleSaveUnit = async (e) => {
    e?.preventDefault();
    setUnitModalError('');

    if (!unitFormData.unitNumber.trim()) {
      setUnitModalError('Unit number is required.');
      return;
    }

    setUnitModalSaving(true);
    try {
      if (editingUnit) {
        await buildingUnitsService.updateUnit(editingUnit.id, {
          unitNumber: unitFormData.unitNumber.trim(),
          areaValue: unitFormData.areaValue ? parseFloat(unitFormData.areaValue) : null,
          areaUnitId: unitFormData.areaUnitId || null,
          unitUseType: unitFormData.unitUseType || null,
          isRented: unitFormData.isRented,
          isForRent: unitFormData.isForRent,
        });
        enqueueSnackbar('Unit updated successfully', { variant: 'success' });
      } else {
        await buildingUnitsService.createUnit({
          buildingId: building.id,
          floorId: selectedFloorForUnit.id,
          floorNumber: selectedFloorForUnit.floor_number,
          unitNumber: unitFormData.unitNumber.trim(),
          areaValue: unitFormData.areaValue ? parseFloat(unitFormData.areaValue) : null,
          areaUnitId: unitFormData.areaUnitId || null,
          unitUseType: unitFormData.unitUseType || null,
          isRented: unitFormData.isRented,
          isForRent: unitFormData.isForRent,
        });
        enqueueSnackbar('Unit created successfully', { variant: 'success' });
      }
      setUnitModalOpen(false);
      fetchBuildingData();
    } catch (err) {
      setUnitModalError(err.message || 'Failed to save unit');
    } finally {
      setUnitModalSaving(false);
    }
  };

  const handleToggleUnitRented = async (unit, e) => {
    e?.stopPropagation();
    try {
      const res = await buildingUnitsService.toggleUnitRented(unit.id);
      enqueueSnackbar(res?.message || 'Rental status updated', { variant: 'success' });
      fetchBuildingData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update rental status', { variant: 'error' });
    }
  };

  const handleToggleUnitForRent = async (unit, e) => {
    e?.stopPropagation();
    try {
      const res = await buildingUnitsService.toggleUnitForRent(unit.id);
      enqueueSnackbar(res?.message || 'For-rent status updated', { variant: 'success' });
      fetchBuildingData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update for-rent status', { variant: 'error' });
    }
  };

  // --- Delete Handler ---
  const handleOpenDelete = (type, data, e) => {
    e?.stopPropagation();
    setDeleteItem({ type, data });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      if (deleteItem.type === 'floor') {
        await buildingFloorsService.deleteFloor(deleteItem.data.id);
        enqueueSnackbar('Floor deleted successfully', { variant: 'success' });
      } else if (deleteItem.type === 'unit') {
        await buildingUnitsService.deleteUnit(deleteItem.data.id);
        enqueueSnackbar('Unit deleted successfully', { variant: 'success' });
      }
      setDeleteModalOpen(false);
      setDeleteItem(null);
      fetchBuildingData();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to delete item', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
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

  if (!building) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <BuildingIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
        <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>
          Building Not Found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/buildings')}
          sx={{ mt: 2, borderRadius: 2, textTransform: 'none', backgroundColor: '#4f46e5' }}
        >
          Back to Buildings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Top Header & Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem', mb: 0.5 }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/buildings" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Buildings
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {building.name}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.35rem' }}>
            Building Overview
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/buildings')}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#cbd5e1',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
            }}
          >
            Back to List
          </Button>

          <Button
            variant="outlined"
            startIcon={building.is_active ? <DeactivateIcon sx={{ fontSize: 16 }} /> : <ActivateIcon sx={{ fontSize: 16 }} />}
            onClick={() => setToggleDialogOpen(true)}
            color={building.is_active ? 'warning' : 'success'}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
            }}
          >
            {building.is_active ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate(`/buildings/${building.id}/edit`)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            }}
          >
            Edit Building
          </Button>
        </Box>
      </Box>

      {/* Banner Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
            }}
          >
            <BuildingIcon sx={{ fontSize: 36 }} />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '1.35rem', sm: '1.65rem' } }}>
                {building.name}
              </Typography>
              <Chip
                label={building.is_active ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: building.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              {building.building_type_name && (
                <Chip
                  label={building.building_type_name}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>
              {building.name_amharic && (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  🇪🇹 {building.name_amharic}
                </Typography>
              )}
              {building.name_afaan_oromo && (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  🌐 {building.name_afaan_oromo}
                </Typography>
              )}
              {building.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                    {building.address}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* KPI Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Planned Floors
              </Typography>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                <FloorIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {building.total_floors || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Configured floor levels
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Floors
              </Typography>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <FloorIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {floors.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Created in database
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Units
              </Typography>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: '#fef3c7', color: '#d97706' }}>
                <UnitIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {units.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
              <Box component="span" sx={{ color: '#16a34a' }}>
                {units.filter((u) => u.is_for_rent && !u.is_rented).length} Available
              </Box>
              {' • '}
              <Box component="span" sx={{ color: '#4f46e5' }}>
                {units.filter((u) => u.is_rented).length} Rented
              </Box>
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Floor Area
              </Typography>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                <AreaIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {building.total_area_value || '—'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {building.area_unit_name || building.area_unit_code || 'Units unspecified'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            px: 2,
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 1.5,
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<InfoIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="General Information" />
          <Tab icon={<FloorIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Floors & Units (${floors.length} Floors / ${units.length} Units)`} />
        </Tabs>

        {/* TAB 0: General Overview */}
        {activeTab === 0 && (
          <Box sx={{ p: 3, width: '100%' }}>
            {/* Architectural & Structural Details */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', mb: 1.5, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                Architectural & Structural Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Building Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.building_type_name || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Year Built / Commissioned
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.year_built || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Total Floors
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.total_floors ? `${building.total_floors} Floor Levels` : '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Total Construction Area
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.total_area_value ? `${building.total_area_value} ${building.area_unit_name || building.area_unit_code || ''}` : '—'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Description & Notes
                  </Typography>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', minHeight: 60 }}>
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {building.description || 'No description or remarks provided for this building.'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Location & Jurisdiction */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', mb: 1.5, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                Location & Jurisdiction
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Region
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.region_name || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Zone / Sub-city
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.zone_name || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Woreda
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    {building.woreda_name || '—'}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Specific Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                    {building.address || '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Audit & Record History */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', mb: 1.5, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                Audit & Record History
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Created By
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      {building.created_by_name || 'System Admin'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Created At
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      {formatDate(building.created_at)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Last Updated By
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      {building.updated_by_name || 'System Admin'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', height: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Last Updated At
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      {formatDate(building.updated_at)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* TAB 1: Floors & Units Detailed Breakdown */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Floor & Unit Structure
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Floors and units created manually. Click on any floor row to view its assigned units.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${floors.length} Floors • ${units.length} Units`}
                  size="small"
                  sx={{ backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: 700, fontSize: '0.75rem' }}
                />
                <Chip
                  label={`${units.filter((u) => u.is_for_rent && !u.is_rented).length} Available for Rent`}
                  size="small"
                  sx={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #bbf7d0' }}
                />
                <Chip
                  label={`${units.filter((u) => u.is_rented).length} Currently Rented`}
                  size="small"
                  sx={{ backgroundColor: '#ede9fe', color: '#6d28d9', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #ddd6fe' }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddFloor}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' },
                  }}
                >
                  Add Floor
                </Button>
              </Box>
            </Box>

            {floors.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                <FloorIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                  No Floors Created Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5, maxWidth: 450, mx: 'auto', fontSize: '0.85rem' }}>
                  This building is configured for {building.total_floors || 0} floors. Click below to add the first floor manually.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddFloor}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' },
                  }}
                >
                  Add Floor
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem' }}>FLOOR #</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem' }}>FLOOR NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem' }}>FLOOR TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', textAlign: 'center' }}>EXPECTED UNITS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', textAlign: 'center' }}>ACTUAL UNITS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', textAlign: 'center' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', textAlign: 'right' }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {floors.map((floor) => {
                      const floorUnits = getUnitsForFloor(floor.id);
                      const isExpanded = expandedFloorId === floor.id;
                      const expectedCount = floor.expected_unit_count || 0;
                      const currentCount = floorUnits.length;
                      const isFull = expectedCount > 0 && currentCount >= expectedCount;

                      return (
                        <React.Fragment key={floor.id}>
                          <TableRow
                            hover
                            onClick={() => setExpandedFloorId(isExpanded ? null : floor.id)}
                            sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                          >
                            <TableCell>
                              <IconButton size="small">
                                {isExpanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                              Level {floor.floor_number}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                              {floor.name}
                            </TableCell>
                            <TableCell>
                              {floor.floor_type_name ? (
                                <Chip label={floor.floor_type_name} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Standard</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#4f46e5' }}>
                              {expectedCount}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip
                                label={`${currentCount} / ${expectedCount} Units`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: isFull ? '#fef3c7' : '#f0fdf4',
                                  color: isFull ? '#d97706' : '#16a34a',
                                  border: isFull ? '1px solid #fde68a' : '1px solid #bbf7d0',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip
                                label={floor.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: floor.is_active ? '#dcfce7' : '#fee2e2',
                                  color: floor.is_active ? '#15803d' : '#b91c1c',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                <Tooltip title={isFull ? `Capacity reached (${expectedCount} units max)` : 'Add unit to this floor'}>
                                  <span>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                      onClick={(e) => handleOpenAddUnit(floor, e)}
                                      disabled={isFull}
                                      sx={{
                                        py: 0.25,
                                        px: 1,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: 1.5,
                                        color: '#4f46e5',
                                        borderColor: '#c7d2fe',
                                        '&:hover': { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
                                      }}
                                    >
                                      Add Unit
                                    </Button>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Edit Floor">
                                  <IconButton size="small" onClick={(e) => handleOpenEditFloor(floor, e)} sx={{ color: '#64748b' }}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={currentCount > 0 ? 'Cannot delete floor with units' : 'Delete Floor'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleOpenDelete('floor', floor, e)}
                                      disabled={currentCount > 0}
                                      sx={{ color: '#ef4444' }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Units Row */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2.5, my: 1, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Units on {floor.name} (Floor #{floor.floor_number}) — {floorUnits.length} of {expectedCount} Expected Units
                                    </Typography>
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                      onClick={(e) => handleOpenAddUnit(floor, e)}
                                      disabled={isFull}
                                      sx={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        color: '#4f46e5',
                                      }}
                                    >
                                      + Add Unit
                                    </Button>
                                  </Box>

                                  {floorUnits.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 1.5, border: '1px dashed #cbd5e1' }}>
                                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                                        No units created yet on {floor.name}. Expected capacity is {expectedCount} units.
                                      </Typography>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                        onClick={(e) => handleOpenAddUnit(floor, e)}
                                        sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: 1.5 }}
                                      >
                                        Create Unit
                                      </Button>
                                    </Box>
                                  ) : (
                                    <Grid container spacing={1.5}>
                                      {floorUnits.map((unit) => (
                                        <Grid item xs={12} sm={6} md={4} key={unit.id}>
                                          <Paper
                                            elevation={0}
                                            sx={{
                                              p: 1.5,
                                              borderRadius: 2,
                                              border: '1px solid #e2e8f0',
                                              backgroundColor: '#ffffff',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                                                <UnitIcon sx={{ fontSize: 16 }} />
                                              </Box>
                                              <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.2 }}>
                                                  Unit {unit.unit_number}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                  Floor {unit.floor_number} • {unit.unit_use_type || 'General'}
                                                  {unit.area_value ? ` • ${unit.area_value} ${unit.area_unit_name || unit.area_unit_code || ''}` : ''}
                                                </Typography>
                                              </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              {/* Rental Status Chip */}
                                              {unit.is_rented ? (
                                                <Tooltip title="Unit is currently occupied / rented out. Click to mark vacant.">
                                                  <Chip
                                                    label="Rented"
                                                    size="small"
                                                    onClick={(e) => handleToggleUnitRented(unit, e)}
                                                    sx={{
                                                      height: 18,
                                                      fontSize: '0.62rem',
                                                      fontWeight: 700,
                                                      backgroundColor: '#ede9fe',
                                                      color: '#6d28d9',
                                                      border: '1px solid #ddd6fe',
                                                      cursor: 'pointer',
                                                    }}
                                                  />
                                                </Tooltip>
                                              ) : !unit.is_for_rent ? (
                                                <Tooltip title="Unit is not available for rental. Click to enable for rent.">
                                                  <Chip
                                                    label="Not For Rent"
                                                    size="small"
                                                    onClick={(e) => handleToggleUnitForRent(unit, e)}
                                                    sx={{
                                                      height: 18,
                                                      fontSize: '0.62rem',
                                                      fontWeight: 700,
                                                      backgroundColor: '#f1f5f9',
                                                      color: '#64748b',
                                                      border: '1px solid #cbd5e1',
                                                      cursor: 'pointer',
                                                    }}
                                                  />
                                                </Tooltip>
                                              ) : (
                                                <Tooltip title="Unit is available for rent. Click to mark rented.">
                                                  <Chip
                                                    label="Available"
                                                    size="small"
                                                    onClick={(e) => handleToggleUnitRented(unit, e)}
                                                    sx={{
                                                      height: 18,
                                                      fontSize: '0.62rem',
                                                      fontWeight: 700,
                                                      backgroundColor: '#f0fdf4',
                                                      color: '#16a34a',
                                                      border: '1px solid #bbf7d0',
                                                      cursor: 'pointer',
                                                    }}
                                                  />
                                                </Tooltip>
                                              )}

                                              <Chip
                                                label={unit.is_active ? 'Active' : 'Inactive'}
                                                size="small"
                                                sx={{
                                                  height: 18,
                                                  fontSize: '0.62rem',
                                                  fontWeight: 700,
                                                  backgroundColor: unit.is_active ? '#dcfce7' : '#fee2e2',
                                                  color: unit.is_active ? '#15803d' : '#b91c1c',
                                                }}
                                              />
                                              <Tooltip title={unit.is_rented ? 'Mark as Vacant' : 'Mark as Rented'}>
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => handleToggleUnitRented(unit, e)}
                                                  sx={{ color: unit.is_rented ? '#6d28d9' : '#94a3b8', p: 0.5 }}
                                                >
                                                  <KeyIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Edit Unit">
                                                <IconButton size="small" onClick={(e) => handleOpenEditUnit(unit, floor, e)} sx={{ color: '#64748b', p: 0.5 }}>
                                                  <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Delete Unit">
                                                <IconButton size="small" onClick={(e) => handleOpenDelete('unit', unit, e)} sx={{ color: '#ef4444', p: 0.5 }}>
                                                  <DeleteIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </Paper>
                                        </Grid>
                                      ))}
                                    </Grid>
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
            )}
          </Box>
        )}
      </Paper>

      {/* --- ADD / EDIT FLOOR MODAL --- */}
      <Dialog open={floorModalOpen} onClose={() => setFloorModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveFloor} noValidate>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700 }}>
            {editingFloor ? 'Edit Floor' : 'Add New Floor'}
            <IconButton size="small" onClick={() => setFloorModalOpen(false)}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
            {floorModalError && (
              <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>
                {floorModalError}
              </Typography>
            )}

            <TextField
              required
              fullWidth
              type="number"
              label="Floor Number (Level)"
              placeholder="e.g. 1"
              value={floorFormData.floorNumber}
              onChange={(e) => setFloorFormData((p) => ({ ...p, floorNumber: e.target.value.replace(/[^0-9]/g, '') }))}
              onKeyDown={(e) => {
                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
              size="small"
              inputProps={{ min: 1, max: 200, step: 1 }}
              helperText="Must be a whole number greater than 0"
            />

            <TextField
              required
              fullWidth
              label="Floor Name"
              placeholder="e.g. Ground Floor, Floor 1, Mezzanine"
              value={floorFormData.name}
              onChange={(e) => setFloorFormData((p) => ({ ...p, name: e.target.value }))}
              size="small"
            />

            <TextField
              required
              select
              fullWidth
              label="Floor Type"
              value={floorFormData.floorTypeId}
              onChange={(e) => setFloorFormData((p) => ({ ...p, floorTypeId: e.target.value }))}
              size="small"
            >
              <MenuItem value="" disabled>Select Floor Type</MenuItem>
              {floorTypes.map((ft) => (
                <MenuItem key={ft.id} value={ft.id}>
                  {ft.name} {ft.code ? `(${ft.code})` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              type="number"
              label="Expected Units per Floor"
              placeholder="e.g. 4"
              value={floorFormData.expectedUnitCount}
              onChange={(e) => setFloorFormData((p) => ({ ...p, expectedUnitCount: e.target.value.replace(/[^0-9]/g, '') }))}
              onKeyDown={(e) => {
                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
              size="small"
              inputProps={{ min: 0, max: 100, step: 1 }}
              helperText="Capacity of units that can be created on this floor"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setFloorModalOpen(false)} disabled={floorModalSaving} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={floorModalSaving}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
              }}
            >
              {floorModalSaving ? 'Saving...' : editingFloor ? 'Update Floor' : 'Create Floor'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- ADD / EDIT UNIT MODAL --- */}
      <Dialog open={unitModalOpen} onClose={() => setUnitModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveUnit} noValidate>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontWeight: 700 }}>
            {editingUnit ? `Edit Unit ${editingUnit.unit_number}` : `Add Unit to ${selectedFloorForUnit?.name || 'Floor'}`}
            <IconButton size="small" onClick={() => setUnitModalOpen(false)}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
            {unitModalError && (
              <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>
                {unitModalError}
              </Typography>
            )}

            {selectedFloorForUnit && (
              <Box sx={{ p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', display: 'block' }}>
                  Target Floor: <strong>{selectedFloorForUnit.name}</strong> (Floor #{selectedFloorForUnit.floor_number})
                </Typography>
                <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 700 }}>
                  Floor Capacity: {getUnitsForFloor(selectedFloorForUnit.id).length} of {selectedFloorForUnit.expected_unit_count || 0} Expected Units
                </Typography>
              </Box>
            )}

            <TextField
              required
              fullWidth
              label="Unit Number"
              placeholder="e.g. 1-01, 101, Shop A"
              value={unitFormData.unitNumber}
              onChange={(e) => setUnitFormData((p) => ({ ...p, unitNumber: e.target.value }))}
              size="small"
              helperText="Unique identifier for this unit"
            />

            <TextField
              select
              fullWidth
              label="Unit Use / Space Type"
              value={unitFormData.unitUseType}
              onChange={(e) => setUnitFormData((p) => ({ ...p, unitUseType: e.target.value }))}
              size="small"
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

            <Grid container spacing={2}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  type="number"
                  label="Area Value"
                  placeholder="e.g. 75.50"
                  value={unitFormData.areaValue}
                  onChange={(e) => setUnitFormData((p) => ({ ...p, areaValue: e.target.value }))}
                  size="small"
                  inputProps={{ min: 0, step: 'any' }}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  select
                  fullWidth
                  label="Area Unit"
                  value={unitFormData.areaUnitId}
                  onChange={(e) => setUnitFormData((p) => ({ ...p, areaUnitId: e.target.value }))}
                  size="small"
                >
                  <MenuItem value="">Not Specified</MenuItem>
                  {areaUnits.map((au) => (
                    <MenuItem key={au.id} value={au.id}>
                      {au.name} {au.code ? `(${au.code})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Rental & Leasing Status Options */}
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Leasing & Availability Configuration
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={unitFormData.isForRent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUnitFormData((p) => ({
                        ...p,
                        isForRent: checked,
                        isRented: checked ? p.isRented : false,
                      }));
                    }}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
                      Available for Rent
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                      Designates whether this unit is open to be leased or rented out.
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                disabled={!unitFormData.isForRent}
                control={
                  <Switch
                    checked={unitFormData.isRented}
                    onChange={(e) => setUnitFormData((p) => ({ ...p, isRented: e.target.checked }))}
                    color="secondary"
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: !unitFormData.isForRent ? '#94a3b8' : '#1e293b' }}>
                      Currently Rented
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
                      Indicates that this unit is currently occupied by an active tenant.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setUnitModalOpen(false)} disabled={unitModalSaving} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={unitModalSaving}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
              }}
            >
              {unitModalSaving ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <ConfirmationModal
        open={deleteModalOpen}
        title={deleteItem?.type === 'floor' ? 'Delete Floor' : 'Delete Unit'}
        message={
          deleteItem?.type === 'floor'
            ? `Are you sure you want to delete "${deleteItem?.data?.name}"?`
            : `Are you sure you want to delete Unit "${deleteItem?.data?.unit_number}"?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* --- STATUS TOGGLE CONFIRMATION MODAL --- */}
      <ConfirmationModal
        open={toggleDialogOpen}
        title={building.is_active ? 'Deactivate Building' : 'Activate Building'}
        message={
          building.is_active
            ? `Are you sure you want to deactivate "${building.name}"? Its floors and units will be marked inactive for new leasing activities.`
            : `Are you sure you want to activate "${building.name}"?`
        }
        confirmText={building.is_active ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        confirmColor={building.is_active ? 'warning' : 'primary'}
        loading={toggleLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleDialogOpen(false)}
      />
    </Box>
  );
};

export default BuildingDetailPage;
