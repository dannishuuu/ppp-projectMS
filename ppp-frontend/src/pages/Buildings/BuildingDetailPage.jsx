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
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingFloorsService } from '../../services/buildingServices/buildingFloorsService';
import { buildingUnitsService } from '../../services/buildingServices/buildingUnitsService';
import { floorTypesService } from '../../services/foundationService/floorTypesService';
import { areaUnitsService } from '../../services/foundationService/areaUnitsService';
import { formatDate } from '../../utils/formatters';

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
              </Box>
            </Box>

            {floors.length === 0 ? (
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
                          </TableRow>

                          {/* Expanded Units Row */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2.5, my: 1, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Units on {floor.name} (Floor #{floor.floor_number}) — {floorUnits.length} of {expectedCount} Expected Units
                                    </Typography>
                                  </Box>

                                  {floorUnits.length === 0 ? (
                                    <Box sx={{ py: 2, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 1.5, border: '1px dashed #cbd5e1' }}>
                                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                        No units created yet on {floor.name}. Expected capacity is {expectedCount} units.
                                      </Typography>
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

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                              {/* Rental Status Chip */}
                                              {unit.is_rented ? (
                                                <Chip
                                                  label="Rented"
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    backgroundColor: '#ede9fe',
                                                    color: '#6d28d9',
                                                    border: '1px solid #ddd6fe',
                                                  }}
                                                />
                                              ) : !unit.is_for_rent ? (
                                                <Chip
                                                  label="Not For Rent"
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#64748b',
                                                    border: '1px solid #cbd5e1',
                                                  }}
                                                />
                                              ) : (
                                                <Chip
                                                  label="Available"
                                                  size="small"
                                                  sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    backgroundColor: '#f0fdf4',
                                                    color: '#16a34a',
                                                    border: '1px solid #bbf7d0',
                                                  }}
                                                />
                                              )}

                                              {/* Active Status Chip */}
                                              <Chip
                                                label={unit.is_active ? 'Active' : 'Inactive'}
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: '0.65rem',
                                                  fontWeight: 700,
                                                  backgroundColor: unit.is_active ? '#dcfce7' : '#fee2e2',
                                                  color: unit.is_active ? '#15803d' : '#b91c1c',
                                                }}
                                              />
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




    </Box>
  );
};

export default BuildingDetailPage;
