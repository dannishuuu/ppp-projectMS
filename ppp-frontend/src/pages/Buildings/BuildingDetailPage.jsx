import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Apartment as BuildingIcon,
  LocationOn as LocationIcon,
  Layers as FloorIcon,
  SquareFoot as AreaIcon,
  MeetingRoom as UnitIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Info as InfoIcon,
  HomeWork as RentalIcon,
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
import { floorTypesService } from '../../services/foundationService/floorTypesService';
import { areaUnitsService } from '../../services/foundationService/areaUnitsService';
import { formatDate } from '../../utils/formatters';

// --- Redesigned Unit Card Component ---
const UnitCard = ({ unit }) => {
  const isRented = Boolean(unit.is_rented);
  const isForRent = unit.is_for_rent !== false;
  const isActive = unit.is_active !== false;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'all 0.22s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
          borderColor: isRented ? '#c4b5fd' : isForRent ? '#a7f3d0' : '#cbd5e1',
        },
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: isRented ? '#8b5cf6' : isForRent ? '#10b981' : '#94a3b8',
        }}
      />

      {/* Header: Unit badge & Status chip */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, pt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: isRented ? '#f5f3ff' : isForRent ? '#ecfdf5' : '#f1f5f9',
              color: isRented ? '#7c3aed' : isForRent ? '#059669' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isRented ? '#ddd6fe' : isForRent ? '#a7f3d0' : '#e2e8f0'}`,
              flexShrink: 0,
            }}
          >
            <UnitIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', lineHeight: 1.2 }}>
              Unit {unit.unit_number}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>
              Level {unit.floor_number}
            </Typography>
          </Box>
        </Box>

        {/* Status Badge */}
        {isRented ? (
          <Chip
            size="small"
            label="Rented"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: '#f5f3ff',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        ) : !isForRent ? (
          <Chip
            size="small"
            label="Reserved"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: '#f8fafc',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        ) : (
          <Chip
            size="small"
            label="Available"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
      </Box>

      {/* Attributes Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Box sx={{ p: 1, borderRadius: 1.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
            Space Type
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {unit.unit_use_type || 'Commercial'}
          </Typography>
        </Box>

        <Box sx={{ p: 1, borderRadius: 1.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
            Floor Area
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem', mt: 0.25 }}>
            {unit.area_value ? `${unit.area_value} ${unit.area_unit_name || unit.area_unit_code || 'm²'}` : '—'}
          </Typography>
        </Box>
      </Box>

      {/* Footer / Operational status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.75, borderTop: '1px solid #f1f5f9', fontSize: '0.7rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: isActive ? '#10b981' : '#ef4444',
            }}
          />
          <Typography variant="caption" sx={{ color: isActive ? '#15803d' : '#b91c1c', fontWeight: 600, fontSize: '0.7rem' }}>
            {isActive ? 'Active Space' : 'Inactive'}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
          {isRented ? 'Occupied' : isForRent ? 'Ready for Lease' : 'Off-market'}
        </Typography>
      </Box>
    </Paper>
  );
};

// --- Redesigned Units Table List Component ---
const UnitsTable = ({ unitsList }) => {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, backgroundColor: '#ffffff' }}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>UNIT #</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>LEVEL</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>SPACE TYPE</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'right' }}>AREA</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>LEASING STATUS</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textAlign: 'center' }}>OPERATIONAL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {unitsList.map((unit) => (
            <TableRow key={unit.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: 1, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UnitIcon sx={{ fontSize: 14 }} />
                  </Box>
                  Unit {unit.unit_number}
                </Box>
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                Floor {unit.floor_number}
              </TableCell>
              <TableCell>
                <Chip label={unit.unit_use_type || 'Commercial'} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }} />
              </TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                {unit.area_value ? `${unit.area_value} ${unit.area_unit_name || unit.area_unit_code || 'm²'}` : '—'}
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                {unit.is_rented ? (
                  <Chip label="Rented" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }} />
                ) : !unit.is_for_rent ? (
                  <Chip label="Reserved" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' }} />
                ) : (
                  <Chip label="Available" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }} />
                )}
              </TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <Chip
                  label={unit.is_active !== false ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: unit.is_active !== false ? '#dcfce7' : '#fee2e2',
                    color: unit.is_active !== false ? '#15803d' : '#b91c1c',
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

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
  const [unitViewMode, setUnitViewMode] = useState('cards'); // 'cards' | 'table'
  const [tab1DisplayMode, setTab1DisplayMode] = useState('floors'); // 'floors' | 'all_units'
  const [floorStatusFilter, setFloorStatusFilter] = useState({}); // { [floorId]: 'all' | 'available' | 'rented' | 'not_for_rent' }
  const [allUnitsSearch, setAllUnitsSearch] = useState('');
  const [allUnitsStatusFilter, setAllUnitsStatusFilter] = useState('all');
  const [allUnitsFloorFilter, setAllUnitsFloorFilter] = useState('all');

  const filteredAllUnits = useMemo(() => {
    return units.filter((u) => {
      if (allUnitsFloorFilter !== 'all' && String(u.floor_number) !== String(allUnitsFloorFilter) && u.floor_id !== allUnitsFloorFilter) {
        return false;
      }
      if (allUnitsStatusFilter === 'rented' && !u.is_rented) return false;
      if (allUnitsStatusFilter === 'available' && (!u.is_for_rent || u.is_rented)) return false;
      if (allUnitsStatusFilter === 'not_for_rent' && u.is_for_rent) return false;
      if (allUnitsSearch.trim()) {
        const q = allUnitsSearch.toLowerCase().trim();
        const matchesUnit = u.unit_number?.toLowerCase().includes(q);
        const matchesType = u.unit_use_type?.toLowerCase().includes(q);
        const matchesFloor = String(u.floor_number).includes(q);
        if (!matchesUnit && !matchesType && !matchesFloor) return false;
      }
      return true;
    });
  }, [units, allUnitsFloorFilter, allUnitsStatusFilter, allUnitsSearch]);

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

  const getUnitsForFloor = (floorId) => {
    return units.filter((u) => u.floor_id === floorId);
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
            {/* Top Toolbar & Mode Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  Floor & Unit Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Detailed architectural structure and space occupancy across {floors.length} floors and {units.length} units.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  size="small"
                  value={tab1DisplayMode}
                  exclusive
                  onChange={(e, val) => val && setTab1DisplayMode(val)}
                  sx={{
                    backgroundColor: '#f8fafc',
                    p: 0.5,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    '& .MuiToggleButton-root': {
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      py: 0.5,
                      px: 1.5,
                      borderRadius: 1.5,
                      border: 0,
                      color: '#64748b',
                      '&.Mui-selected': {
                        backgroundColor: '#ffffff',
                        color: '#1a237e',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="floors">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <FloorIcon sx={{ fontSize: 16 }} />
                      Floor-by-Floor Hierarchy
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="all_units">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <UnitIcon sx={{ fontSize: 16 }} />
                      All Units Gallery ({units.length})
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem sx={{ height: 28, my: 'auto', display: { xs: 'none', sm: 'block' } }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${units.filter((u) => u.is_for_rent && !u.is_rented).length} Available`}
                    size="small"
                    sx={{ backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #a7f3d0' }}
                  />
                  <Chip
                    label={`${units.filter((u) => u.is_rented).length} Rented`}
                    size="small"
                    sx={{ backgroundColor: '#f5f3ff', color: '#6d28d9', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #ddd6fe' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* MODE 1: Floor-by-Floor Hierarchy */}
            {tab1DisplayMode === 'floors' && (
              floors.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                  <FloorIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                    No Floors Created Yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', fontSize: '0.85rem' }}>
                    This building is configured for {building.total_floors || 0} floors. Floors and units can be configured using the Edit Building page.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, backgroundColor: '#ffffff' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ width: 44 }} />
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em' }}>FLOOR LEVEL</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em' }}>FLOOR NAME</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em' }}>CLASSIFICATION</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em', textAlign: 'center' }}>EXPECTED UNITS</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em', textAlign: 'center' }}>OCCUPANCY STATUS</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.03em', textAlign: 'center' }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {floors.map((floor) => {
                        const floorUnits = getUnitsForFloor(floor.id);
                        const isExpanded = expandedFloorId === floor.id;
                        const expectedCount = floor.expected_unit_count || 0;
                        const currentCount = floorUnits.length;
                        const isFull = expectedCount > 0 && currentCount >= expectedCount;

                        const floorFilter = floorStatusFilter[floor.id] || 'all';
                        const displayFloorUnits = floorUnits.filter((u) => {
                          if (floorFilter === 'rented') return Boolean(u.is_rented);
                          if (floorFilter === 'available') return Boolean(u.is_for_rent && !u.is_rented);
                          if (floorFilter === 'not_for_rent') return !u.is_for_rent;
                          return true;
                        });

                        return (
                          <React.Fragment key={floor.id}>
                            <TableRow
                              hover
                              onClick={() => setExpandedFloorId(isExpanded ? null : floor.id)}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: isExpanded ? 'rgba(79, 70, 229, 0.03)' : 'inherit',
                                '& > *': { borderBottom: isExpanded ? 'none' : undefined },
                              }}
                            >
                              <TableCell>
                                <IconButton size="small" sx={{ color: isExpanded ? '#4f46e5' : '#64748b' }}>
                                  {isExpanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                Level {floor.floor_number}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                                {floor.name}
                              </TableCell>
                              <TableCell>
                                {floor.floor_type_name ? (
                                  <Chip label={floor.floor_type_name} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }} />
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
                                    height: 22,
                                    fontSize: '0.72rem',
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
                                    height: 22,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: floor.is_active ? '#dcfce7' : '#fee2e2',
                                    color: floor.is_active ? '#15803d' : '#b91c1c',
                                  }}
                                />
                              </TableCell>
                            </TableRow>

                            {/* Expanded Units Row */}
                            <TableRow>
                              <TableCell style={{ paddingBottom: 18, paddingTop: 4, backgroundColor: 'rgba(79, 70, 229, 0.02)' }} colSpan={7}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ p: 2.5, borderRadius: 2.5, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                    {/* Floor Units Header Toolbar */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5, pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                                          Units on {floor.name} (Level {floor.floor_number})
                                        </Typography>
                                        <Chip
                                          label={`${floorUnits.length} of ${expectedCount} Expected Units`}
                                          size="small"
                                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4f46e5' }}
                                        />
                                        <Chip
                                          label={`${floorUnits.filter((u) => u.is_rented).length} Rented`}
                                          size="small"
                                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}
                                        />
                                        <Chip
                                          label={`${floorUnits.filter((u) => u.is_for_rent && !u.is_rented).length} Available`}
                                          size="small"
                                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                        />
                                      </Box>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {/* Filter chips */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          {[
                                            { key: 'all', label: 'All' },
                                            { key: 'available', label: 'Available' },
                                            { key: 'rented', label: 'Rented' },
                                          ].map((item) => (
                                            <Chip
                                              key={item.key}
                                              label={item.label}
                                              size="small"
                                              clickable
                                              onClick={() => setFloorStatusFilter((prev) => ({ ...prev, [floor.id]: item.key }))}
                                              sx={{
                                                height: 24,
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                backgroundColor: floorFilter === item.key ? '#1a237e' : '#f1f5f9',
                                                color: floorFilter === item.key ? '#ffffff' : '#64748b',
                                                '&:hover': {
                                                  backgroundColor: floorFilter === item.key ? '#0f172a' : '#e2e8f0',
                                                },
                                              }}
                                            />
                                          ))}
                                        </Box>

                                        {/* View Mode Switcher */}
                                        <ToggleButtonGroup
                                          size="small"
                                          value={unitViewMode}
                                          exclusive
                                          onChange={(e, val) => val && setUnitViewMode(val)}
                                          sx={{ height: 26 }}
                                        >
                                          <ToggleButton value="cards" sx={{ px: 1, py: 0 }}>
                                            <Tooltip title="Card Grid View">
                                              <GridViewIcon sx={{ fontSize: 16 }} />
                                            </Tooltip>
                                          </ToggleButton>
                                          <ToggleButton value="table" sx={{ px: 1, py: 0 }}>
                                            <Tooltip title="Table View">
                                              <ListViewIcon sx={{ fontSize: 16 }} />
                                            </Tooltip>
                                          </ToggleButton>
                                        </ToggleButtonGroup>
                                      </Box>
                                    </Box>

                                    {/* Units Content */}
                                    {displayFloorUnits.length === 0 ? (
                                      <Box sx={{ py: 3.5, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                                        <UnitIcon sx={{ fontSize: 36, color: '#94a3b8', mb: 0.5 }} />
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                          {floorUnits.length === 0 ? `No units created yet on ${floor.name}.` : 'No units match the selected status filter.'}
                                        </Typography>
                                      </Box>
                                    ) : unitViewMode === 'cards' ? (
                                      <Grid container spacing={2}>
                                        {displayFloorUnits.map((unit) => (
                                          <Grid item xs={12} sm={6} md={4} lg={3} key={unit.id}>
                                            <UnitCard unit={unit} />
                                          </Grid>
                                        ))}
                                      </Grid>
                                    ) : (
                                      <UnitsTable unitsList={displayFloorUnits} />
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
              )
            )}

            {/* MODE 2: All Units Gallery across entire building */}
            {tab1DisplayMode === 'all_units' && (
              <Box>
                {/* Search and Filters Bar */}
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 260 }}>
                    <TextField
                      size="small"
                      placeholder="Search unit number, space type, or floor level..."
                      value={allUnitsSearch}
                      onChange={(e) => setAllUnitsSearch(e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        maxWidth: 380,
                        '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' },
                      }}
                    />

                    <TextField
                      select
                      size="small"
                      value={allUnitsFloorFilter}
                      onChange={(e) => setAllUnitsFloorFilter(e.target.value)}
                      sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
                    >
                      <MenuItem value="all">All Floor Levels</MenuItem>
                      {floors.map((f) => (
                        <MenuItem key={f.id} value={f.floor_number}>
                          Level {f.floor_number} ({f.name})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {/* Status filter pills */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {[
                        { key: 'all', label: `All (${units.length})` },
                        { key: 'available', label: `Available (${units.filter((u) => u.is_for_rent && !u.is_rented).length})` },
                        { key: 'rented', label: `Rented (${units.filter((u) => u.is_rented).length})` },
                        { key: 'not_for_rent', label: `Reserved (${units.filter((u) => !u.is_for_rent).length})` },
                      ].map((item) => (
                        <Chip
                          key={item.key}
                          label={item.label}
                          size="small"
                          clickable
                          onClick={() => setAllUnitsStatusFilter(item.key)}
                          sx={{
                            height: 26,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: allUnitsStatusFilter === item.key ? '#1a237e' : '#f1f5f9',
                            color: allUnitsStatusFilter === item.key ? '#ffffff' : '#64748b',
                            '&:hover': {
                              backgroundColor: allUnitsStatusFilter === item.key ? '#0f172a' : '#e2e8f0',
                            },
                          }}
                        />
                      ))}
                    </Box>

                    {/* View Mode Toggle */}
                    <ToggleButtonGroup
                      size="small"
                      value={unitViewMode}
                      exclusive
                      onChange={(e, val) => val && setUnitViewMode(val)}
                      sx={{ height: 28 }}
                    >
                      <ToggleButton value="cards" sx={{ px: 1, py: 0 }}>
                        <Tooltip title="Card Grid View">
                          <GridViewIcon sx={{ fontSize: 16 }} />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="table" sx={{ px: 1, py: 0 }}>
                        <Tooltip title="Table List View">
                          <ListViewIcon sx={{ fontSize: 16 }} />
                        </Tooltip>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Paper>

                {/* Display results */}
                {filteredAllUnits.length === 0 ? (
                  <Box sx={{ p: 5, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                    <UnitIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                      No Matching Units Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      Try adjusting your search keywords, selected floor, or status filter.
                    </Typography>
                  </Box>
                ) : unitViewMode === 'cards' ? (
                  <Grid container spacing={2}>
                    {filteredAllUnits.map((unit) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={unit.id}>
                        <UnitCard unit={unit} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <UnitsTable unitsList={filteredAllUnits} />
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>




    </Box>
  );
};

export default BuildingDetailPage;
