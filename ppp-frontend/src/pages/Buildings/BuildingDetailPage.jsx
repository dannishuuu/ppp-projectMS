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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Apartment as BuildingIcon,
  LocationOn as LocationIcon,
  Layers as FloorIcon,
  SquareFoot as AreaIcon,
  CalendarToday as YearIcon,
  MeetingRoom as UnitIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const BuildingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Toggle Dialog
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchBuilding = async () => {
    setLoading(true);
    try {
      const res = await buildingsService.getBuildingById(id);
      setBuilding(res?.building || res);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load building details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBuilding();
    }
  }, [id]);

  const handleToggleConfirm = async () => {
    if (!building) return;
    setToggleLoading(true);
    try {
      const result = await buildingsService.toggleBuildingStatus(building.id);
      enqueueSnackbar(result?.message || 'Building status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchBuilding();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
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
              Total configured levels
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
              {building.floors_count || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Registered in system
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
              {building.units_count || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Rentable / space units
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

      {/* Main Details Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Specifications & Location */}
        <Grid item xs={12} md={7}>
          {/* General Specifications */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Architectural & Structural Details
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Building Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.building_type_name || '—'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Year Built / Commissioned
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.year_built || '—'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Total Floors
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.total_floors ? `${building.total_floors} Floor Levels` : '—'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
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
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', minHeight: 60 }}>
                  <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {building.description || 'No description or remarks provided for this building.'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Location & Geography */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Location & Jurisdiction
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Region
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.region_name || '—'}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Zone / Sub-city
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.zone_name || '—'}
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Woreda
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.woreda_name || '—'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Specific Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                  {building.address || '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column: Audit & Metadata */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Audit & Record History
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Created By
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.created_by_name || 'System Admin'}
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Created At
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {formatDate(building.created_at)}
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Last Updated By
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {building.updated_by_name || 'System Admin'}
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Last Updated At
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {formatDate(building.updated_at)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Modal (Status Toggle) */}
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
