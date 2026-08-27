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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Layers as FloorIcon,
  MeetingRoom as UnitIcon,
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

  const [buildingMeta, setBuildingMeta] = useState(null);
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
          setBuildingMeta({
            floorsCount: b.floors_count ?? b.total_floors ?? 0,
            unitsCount: b.units_count ?? 0,
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

          if (b.region_id) {
            const zRes = await zonesService.getZones({ regionId: b.region_id, limit: 100 });
            setZones(zRes?.zones || zRes?.rows || (Array.isArray(zRes) ? zRes : []));
          }
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
        setZones(res?.zones || res?.rows || (Array.isArray(res) ? res : []));
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
        setWoredas(res?.woredas || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error('Failed to load woredas:', err);
      }
    }
  };

  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === 'totalFloors') {
      val = val.replace(/[^0-9]/g, '');
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMsg) setErrorMsg('');
  };

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
              {buildingMeta && (
                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>Current:</Typography>
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
                helperText="Total number of physical floor levels (Floors are created manually)"
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default BuildingEditPage;
