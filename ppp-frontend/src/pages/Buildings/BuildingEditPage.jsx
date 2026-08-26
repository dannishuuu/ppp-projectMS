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
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Apartment as BuildingIcon,
  LocationOn as LocationIcon,
  Layers as SpecsIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingTypesService } from '../../services/foundationService/buildingTypesService';
import { regionsService } from '../../services/foundationService/regionsService';
import { zonesService } from '../../services/foundationService/zonesService';
import { woredasService } from '../../services/foundationService/woredasService';
import { areaUnitsService } from '../../services/foundationService/areaUnitsService';

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

  // Lookups
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [areaUnits, setAreaUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Lookups and Building Details
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [btRes, regRes, auRes, buildingRes] = await Promise.all([
          buildingTypesService.getBuildingTypes({ limit: 100 }),
          regionsService.getRegions({ limit: 100 }),
          areaUnitsService.getAreaUnits({ limit: 100 }),
          buildingsService.getBuildingById(id),
        ]);

        setBuildingTypes(btRes?.buildingTypes || btRes?.rows || (Array.isArray(btRes) ? btRes : []));
        setRegions(regRes?.regions || regRes?.rows || (Array.isArray(regRes) ? regRes : []));
        setAreaUnits(auRes?.areaUnits || auRes?.rows || (Array.isArray(auRes) ? auRes : []));

        const b = buildingRes?.building || buildingRes;
        if (b) {
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

          // Preload zones if region exists
          if (b.region_id) {
            const zRes = await zonesService.getZones({ regionId: b.region_id, limit: 100 });
            setZones(zRes?.zones || zRes?.rows || (Array.isArray(zRes) ? zRes : []));
          }

          // Preload woredas if zone exists
          if (b.zone_id) {
            const wRes = await woredasService.getWoredas({ zoneId: b.zone_id, limit: 100 });
            setWoredas(wRes?.woredas || wRes?.rows || (Array.isArray(wRes) ? wRes : []));
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load building details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadInitialData();
    }
  }, [id]);

  // Handle Region Change
  const handleRegionChange = async (e) => {
    const regionId = e.target.value;
    setFormData((prev) => ({ ...prev, regionId, zoneId: '', woredaId: '' }));
    setZones([]);
    setWoredas([]);

    if (regionId) {
      try {
        const res = await zonesService.getZones({ regionId, limit: 100 });
        setZones(res?.zones || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error('Failed to load zones:', err);
      }
    }
  };

  // Handle Zone Change
  const handleZoneChange = async (e) => {
    const zoneId = e.target.value;
    setFormData((prev) => ({ ...prev, zoneId, woredaId: '' }));
    setWoredas([]);

    if (zoneId) {
      try {
        const res = await woredasService.getWoredas({ zoneId, limit: 100 });
        setWoredas(res?.woredas || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error('Failed to load woredas:', err);
      }
    }
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Building name is required.');
      return;
    }
    if (!formData.buildingTypeId) {
      setErrorMsg('Building Type is required.');
      return;
    }
    if (formData.totalFloors === '' || Number(formData.totalFloors) < 1) {
      setErrorMsg('Total floors must be at least 1.');
      return;
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
      totalFloors: parseInt(formData.totalFloors, 10),
      totalAreaValue: formData.totalAreaValue ? parseFloat(formData.totalAreaValue) : null,
      areaUnitId: formData.areaUnitId || null,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt, 10) : null,
    };

    setSaving(true);
    try {
      await buildingsService.updateBuilding(id, payload);
      enqueueSnackbar('Building updated successfully', { variant: 'success' });
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
      {/* Header Bar */}
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
              Edit Building
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem' }}>
            Edit Building: {formData.name || 'Building'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate(`/buildings/${id}`)}
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
          Back to Details
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Section 1: Basic & General Info */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
              <BuildingIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Basic Information
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Primary identification and architectural categorization
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
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
            </Grid>

            <Grid item xs={12} sm={6}>
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
                    {type.name} {type.type_code ? `(${type.type_code})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
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
            </Grid>

            <Grid item xs={12} sm={6}>
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
            </Grid>

            <Grid item xs={12} sm={6}>
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
            </Grid>

            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Structure & Specifications */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center' }}>
              <SpecsIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Structure & Measurements
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Floor count and total construction floor area
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                type="number"
                label="Total Floors"
                placeholder="e.g. 8"
                value={formData.totalFloors}
                onChange={handleChange('totalFloors')}
                size="small"
                disabled={saving}
                inputProps={{ min: 1, max: 200 }}
                helperText="Total number of physical floor levels"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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
            </Grid>

            <Grid item xs={12} sm={4}>
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
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Location & Address */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center' }}>
              <LocationIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Geographical Location & Address
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Administrative jurisdiction and precise site address
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
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
            </Grid>

            <Grid item xs={12} sm={4}>
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
            </Grid>

            <Grid item xs={12} sm={4}>
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address / Specific Location"
                placeholder="e.g. Bole Road, Next to Commercial Plaza, Kebele 03"
                value={formData.address}
                onChange={handleChange('address')}
                size="small"
                disabled={saving}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, pb: 4 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/buildings/${id}`)}
            disabled={saving}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              color: '#64748b',
              borderColor: '#cbd5e1',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              px: 2.5,
              py: 1,
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <SaveIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              px: 3,
              py: 1,
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BuildingEditPage;
