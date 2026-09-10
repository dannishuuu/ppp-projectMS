import React, { useState, useEffect, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
  Stack,
  Fade,
  FormHelperText,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Badge as LicenseIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationService, organizationTypeService } from '../../services/organizationService';
import { businessSectorService } from '../../services/foundationService/businessSectorService';
import { countriesService } from '../../services/foundationService/countriesService';
import { regionsService } from '../../services/foundationService/regionsService';
import { zonesService } from '../../services/foundationService/zonesService';
import { woredasService } from '../../services/foundationService/woredasService';

const inputSx = {
  borderRadius: 2,
  backgroundColor: '#f8fafc',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
};

const formFieldSx = { '& .MuiOutlinedInput-root': inputSx };

const SectionHeader = ({ icon, title, color = '#1e40af' }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 1.5,
        backgroundColor: `${color}12`,
        color,
        '& svg': { fontSize: 16 },
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        color,
        letterSpacing: '0.3px',
        fontSize: '0.78rem',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </Typography>
  </Stack>
);

export const OrganizationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(id);

  const [orgTypes, setOrgTypes] = useState([]);
  const [businessSectors, setBusinessSectors] = useState([]);
  const [selectedBusinessSector, setSelectedBusinessSector] = useState(null);
  const [businessSectorSearch, setBusinessSectorSearch] = useState('');
  const [businessSectorLoading, setBusinessSectorLoading] = useState(false);

  // Location cascading lookups (Country → Region → Zone/Sub-city → Woreda)
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    // Core Organization
    name: '',
    amharicOrgName: '',
    oromoOrgName: '',
    organizationTypeIds: [],
    phone: '',
    email: '',
    countryId: '',
    regionId: '',
    zoneId: '',
    woredaId: '',
    profileExperience: '',

    // Organization Profile
    businessSectorId: '',
    yearsOfExperience: '',
    registrationDate: '',
    licenseNumber: '',
    bio: '',
    pastProjectsSummary: '',
  });

  const filledCount = useMemo(() => {
    return Object.values(formData).filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== '' && v !== null && v !== undefined;
    }).length;
  }, [formData]);

  const totalFields = useMemo(() => Object.keys(formData).length, []);

  // Load Organization Types initially, Business Sectors loaded on search
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const orgTypesRes = await organizationTypeService.getOrganizationTypes({ limit: 100, status: 'active' });
        setOrgTypes(orgTypesRes.organizationTypes || orgTypesRes.rows || []);
      } catch (err) {
        console.error('Failed to load organization types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Load countries once (for the location cascade)
  useEffect(() => {
    countriesService.getCountries({ limit: 100, status: 'active' }).then((res) => {
      setCountries(res.countries || res.rows || []);
    }).catch(() => setCountries([]));
  }, []);

  // Load regions (options for the Region select)
  useEffect(() => {
    if (!formData.countryId) {
      setRegions([]);
      return;
    }
    regionsService.getRegions({ limit: 200, status: 'active' }).then((res) => {
      setRegions(res.regions || res.rows || []);
    }).catch(() => setRegions([]));
  }, [formData.countryId]);

  // Load zones for the selected region
  useEffect(() => {
    if (!formData.regionId) {
      setZones([]);
      return;
    }
    zonesService.getZones({ regionId: formData.regionId, limit: 200, status: 'active' }).then((res) => {
      setZones(res.zones || res.rows || []);
    }).catch(() => setZones([]));
  }, [formData.regionId]);

  // Load woredas for the selected zone
  useEffect(() => {
    if (!formData.zoneId) {
      setWoredas([]);
      return;
    }
    woredasService.getWoredas({ zoneId: formData.zoneId, limit: 200, status: 'active' }).then((res) => {
      setWoredas(res.woredas || res.rows || []);
    }).catch(() => setWoredas([]));
  }, [formData.zoneId]);

  // Location cascade handlers — changing a parent clears its children
  const handleCountryChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, countryId: value, regionId: '', zoneId: '', woredaId: '' }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors.countryId) setFieldErrors((prev) => ({ ...prev, countryId: undefined }));
  };

  const handleRegionChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, regionId: value, zoneId: '', woredaId: '' }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors.regionId) setFieldErrors((prev) => ({ ...prev, regionId: undefined }));
  };

  const handleZoneChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, zoneId: value, woredaId: '' }));
    if (errorMsg) setErrorMsg('');
  };

  // Debounced Business Sector search (min 3 characters)
  useEffect(() => {
    if (businessSectorSearch.length < 3) {
      setBusinessSectors([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusinessSectorLoading(true);
      try {
        const res = await businessSectorService.getBusinessSectors({ 
          limit: 50, 
          status: 'active',
          search: businessSectorSearch 
        });
        setBusinessSectors(res.businessSectors || res.rows || []);
      } catch (err) {
        console.error('Failed to load business sectors:', err);
      } finally {
        setBusinessSectorLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [businessSectorSearch]);

  // Fetch org data if in Edit mode
  useEffect(() => {
    if (!id) return;
    const fetchOrgDetails = async () => {
      setLoading(true);
      try {
        const org = await organizationService.getOrganizationById(id);

        let typeIds = [];
        if (Array.isArray(org.organization_type_ids)) {
          typeIds = org.organization_type_ids;
        } else if (org.organization_types && Array.isArray(org.organization_types)) {
          typeIds = org.organization_types.map((t) => t.id);
        } else if (org.organization_type_id) {
          typeIds = [org.organization_type_id];
        }

        setFormData({
          name: org.name || '',
          amharicOrgName: org.amharic_org_name || '',
          oromoOrgName: org.oromo_org_name || '',
          organizationTypeIds: typeIds,
          phone: org.phone || '',
          email: org.email || '',
          countryId: org.country_id || '',
          regionId: org.region_id || '',
          zoneId: org.zone_id || '',
          woredaId: org.woreda_id || '',
          profileExperience: org.profile_experience || '',
          businessSectorId: org.business_sector_id || '',
          yearsOfExperience: org.years_of_experience ?? '',
          registrationDate: org.registration_date ? org.registration_date.split('T')[0] : '',
          licenseNumber: org.license_number || '',
          bio: org.bio || '',
          pastProjectsSummary: org.past_projects_summary || '',
        });

        // Load selected business sector if exists - add it to the options
        if (org.business_sector_id && org.business_sector_name) {
          const sector = {
            id: org.business_sector_id,
            eng_name: org.business_sector_name,
            amh_name: org.business_sector_amh_name,
            oro_name: org.business_sector_oro_name,
          };
          setSelectedBusinessSector(sector);
          setBusinessSectors([sector]);
        }
      } catch (err) {
        enqueueSnackbar(err.message || 'Failed to load organization details', { variant: 'error' });
        navigate('/organizations');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgDetails();
  }, [id]);

  // Auto-calculate years of experience from registration date
  useEffect(() => {
    if (formData.registrationDate) {
      const regDate = new Date(formData.registrationDate);
      const today = new Date();
      const yearsDiff = today.getFullYear() - regDate.getFullYear();
      const monthsDiff = today.getMonth() - regDate.getMonth();
      
      // Adjust if birthday hasn't occurred this year
      const adjustedYears = monthsDiff < 0 || (monthsDiff === 0 && today.getDate() < regDate.getDate())
        ? yearsDiff - 1
        : yearsDiff;

      setFormData((prev) => ({ ...prev, yearsOfExperience: Math.max(0, adjustedYears) }));
    }
  }, [formData.registrationDate]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Organization name is required.';
    if (!formData.amharicOrgName?.trim()) errors.amharicOrgName = 'Organization name (Amharic) is required.';
    if (!formData.oromoOrgName?.trim()) errors.oromoOrgName = 'Organization name (Oromo) is required.';
    if (!formData.organizationTypeIds || formData.organizationTypeIds.length === 0) {
      errors.organizationTypeIds = 'Please select at least one Organization Type.';
    }
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required.';
    if (!formData.email?.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.countryId) errors.countryId = 'Country is required.';
    if (!formData.regionId) errors.regionId = 'Region is required.';
    if (!formData.businessSectorId) errors.businessSectorId = 'Business sector is required.';
    if (!formData.registrationDate) errors.registrationDate = 'Legal registration date is required.';
    if (!formData.licenseNumber?.trim()) errors.licenseNumber = 'Trade license / registration number is required.';

    setFieldErrors(errors);

    const firstError = Object.values(errors)[0];
    if (firstError) {
      setErrorMsg(firstError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        yearsOfExperience: formData.yearsOfExperience !== '' ? parseInt(formData.yearsOfExperience, 10) : null,
      };

      if (isEditMode) {
        await organizationService.updateOrganization(id, payload);
        enqueueSnackbar('Organization updated successfully', { variant: 'success' });
      } else {
        await organizationService.createOrganization(payload);
        enqueueSnackbar('Organization created successfully', { variant: 'success' });
      }
      navigate('/organizations');
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${isEditMode ? 'update' : 'create'} organization.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          Loading organization details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/organizations" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Organizations
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {isEditMode ? 'Edit Organization' : 'Create Organization'}
            </Typography>
          </Breadcrumbs>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            {isEditMode ? `Edit: ${formData.name || 'Organization'}` : 'Add New Organization'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organizations')}
          sx={{
            borderRadius: 2,
            borderColor: '#cbd5e1',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
          }}
        >
          Back to Directory
        </Button>
      </Box>

      {/* Completion Progress */}
      <Fade in>
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              Form Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {filledCount} / {totalFields} fields
            </Typography>
          </Box>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${(filledCount / totalFields) * 100}%`,
                borderRadius: 2,
                backgroundColor: filledCount === totalFields ? '#22c55e' : '#4f46e5',
                transition: 'width 0.4s ease, background-color 0.3s ease',
              }}
            />
          </Box>
        </Box>
      </Fade>

      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2, border: '1px solid #fecaca' }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Main Form */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
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
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            {/* Column 1: Core Organization Info */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<BusinessIcon />}
                title="Core Organization Info"
                color="#1e40af"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                required
                fullWidth
                label="Organization Name"
                placeholder="e.g. Addis Real Estate & Development Group"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Organization Name (Amharic)"
                placeholder="e.g. አዲስ ሪል እስቴት እና ልማት ድርጅት"
                value={formData.amharicOrgName}
                onChange={handleChange('amharicOrgName')}
                size="small"
                error={Boolean(fieldErrors.amharicOrgName)}
                helperText={fieldErrors.amharicOrgName || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Organization Name (Oromo)"
                placeholder="e.g. Garee Qabeenya Dhalataa fi Guddinaa Addis"
                value={formData.oromoOrgName}
                onChange={handleChange('oromoOrgName')}
                size="small"
                error={Boolean(fieldErrors.oromoOrgName)}
                helperText={fieldErrors.oromoOrgName || ''}
                sx={formFieldSx}
              />

              <FormControl
                required
                fullWidth
                size="small"
                error={Boolean(fieldErrors.organizationTypeIds)}
                sx={formFieldSx}
              >
                <InputLabel id="org-types-label">Organization Types</InputLabel>
                <Select
                  labelId="org-types-label"
                  id="organizationTypeIds"
                  multiple
                  value={formData.organizationTypeIds}
                  onChange={(e) => {
                    const { target: { value } } = e;
                    setFormData((prev) => ({
                      ...prev,
                      organizationTypeIds: typeof value === 'string' ? value.split(',') : value,
                    }));
                    if (errorMsg) setErrorMsg('');
                    if (fieldErrors.organizationTypeIds) setFieldErrors((prev) => ({ ...prev, organizationTypeIds: undefined }));
                  }}
                  input={<OutlinedInput label="Organization Types" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const typeObj = orgTypes.find((t) => t.id === value);
                        return (
                          <Chip
                            key={value}
                            label={typeObj ? typeObj.name : value}
                            size="small"
                            sx={{
                              borderRadius: 1.5,
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {orgTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id} sx={{ py: 0.75 }}>
                      <Checkbox checked={formData.organizationTypeIds.indexOf(type.id) > -1} size="small" />
                      <ListItemText primary={type.name} />
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.organizationTypeIds && (
                  <FormHelperText>{fieldErrors.organizationTypeIds}</FormHelperText>
                )}
              </FormControl>

              <TextField
                required
                fullWidth
                label="Phone Number"
                placeholder="e.g. 0911517888"
                value={formData.phone}
                onChange={handleChange('phone')}
                size="small"
                error={Boolean(fieldErrors.phone)}
                helperText={fieldErrors.phone || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                type="email"
                label="Email Address"
                placeholder="e.g. info@company.com"
                value={formData.email}
                onChange={handleChange('email')}
                size="small"
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || ''}
                sx={formFieldSx}
              />

              {/* Location — Country → Region → Zone/Sub-city → Woreda cascade */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Country"
                  value={formData.countryId}
                  onChange={handleCountryChange}
                  size="small"
                  error={Boolean(fieldErrors.countryId)}
                  helperText={fieldErrors.countryId || ''}
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Country...</MenuItem>
                  {countries.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}{c.code ? ` (${c.code})` : ''}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  fullWidth
                  label="Region"
                  value={formData.regionId}
                  onChange={handleRegionChange}
                  disabled={!formData.countryId}
                  size="small"
                  error={Boolean(fieldErrors.regionId)}
                  helperText={fieldErrors.regionId || ''}
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Region...</MenuItem>
                  {regions.map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Zone / Sub-city"
                  value={formData.zoneId}
                  onChange={handleZoneChange}
                  disabled={!formData.regionId}
                  size="small"
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Zone / Sub-city...</MenuItem>
                  {zones.map((z) => (
                    <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Woreda"
                  value={formData.woredaId}
                  onChange={handleChange('woredaId')}
                  disabled={!formData.zoneId}
                  size="small"
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Woreda...</MenuItem>
                  {woredas.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Stack>

            {/* Column 2: Licensing & Profile */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<LicenseIcon />}
                title="Licensing & Profile Specs"
                color="#047857"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <Autocomplete
                fullWidth
                options={selectedBusinessSector && !businessSectors.find(s => s.id === selectedBusinessSector.id) 
                  ? [selectedBusinessSector, ...businessSectors]
                  : businessSectors
                }
                value={selectedBusinessSector}
                onChange={(event, newValue) => {
                  setSelectedBusinessSector(newValue);
                  setFormData((prev) => ({ ...prev, businessSectorId: newValue ? newValue.id : '' }));
                  if (errorMsg) setErrorMsg('');
                  if (fieldErrors.businessSectorId) setFieldErrors((prev) => ({ ...prev, businessSectorId: undefined }));
                }}
                onInputChange={(event, newInputValue) => {
                  setBusinessSectorSearch(newInputValue);
                }}
                getOptionLabel={(option) => {
                  if (option.amh_name) {
                    return `${option.eng_name} (${option.amh_name})`;
                  }
                  return option.eng_name;
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={businessSectorLoading}
                noOptionsText={businessSectorSearch.length < 3 ? "Type 3+ characters to search" : "No sectors found"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Business Sector"
                    placeholder="Type to search..."
                    size="small"
                    error={Boolean(fieldErrors.businessSectorId)}
                    helperText={fieldErrors.businessSectorId || ''}
                    sx={formFieldSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {businessSectorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                required
                fullWidth
                type="date"
                label="Legal Registration Date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.registrationDate}
                onChange={handleChange('registrationDate')}
                size="small"
                error={Boolean(fieldErrors.registrationDate)}
                helperText={fieldErrors.registrationDate || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Trade License / Reg Number"
                placeholder="e.g. BL-99201"
                value={formData.licenseNumber}
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, licenseNumber: upperValue }));
                  if (errorMsg) setErrorMsg('');
                  if (fieldErrors.licenseNumber) setFieldErrors((prev) => ({ ...prev, licenseNumber: undefined }));
                }}
                size="small"
                error={Boolean(fieldErrors.licenseNumber)}
                helperText={fieldErrors.licenseNumber || ''}
                sx={formFieldSx}
                inputProps={{
                  style: { textTransform: 'uppercase' }
                }}
              />

              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                placeholder="Auto-calculated from registration date"
                value={formData.yearsOfExperience}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                helperText="Automatically calculated from registration date"
                sx={{
                  ...formFieldSx,
                  '& .MuiInputBase-input': {
                    backgroundColor: '#f1f5f9',
                    cursor: 'not-allowed',
                  }
                }}
              />
            </Stack>

            {/* Column 3: Experience & Track Record */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<DescriptionIcon />}
                title="Experience & Track Record"
                color="#7c3aed"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Developer Profile & Experience (የአልሚው ፕሮፋይልና ልምድ)"
                placeholder="Enter raw developer experience text from EV document..."
                value={formData.profileExperience}
                onChange={handleChange('profileExperience')}
                size="small"
                sx={formFieldSx}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Executive Bio & Overview"
                placeholder="Professional background, key qualifications..."
                value={formData.bio}
                onChange={handleChange('bio')}
                size="small"
                sx={formFieldSx}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Past Projects Summary"
                placeholder="Summary of previous projects completed..."
                value={formData.pastProjectsSummary}
                onChange={handleChange('pastProjectsSummary')}
                size="small"
                sx={formFieldSx}
              />
            </Stack>
          </Box>

          {/* Submit Actions Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
              {isEditMode ? 'Changes will be saved immediately' : 'All required fields must be completed'}
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/organizations')}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
                }}
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
                  textTransform: 'none',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' },
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                }}
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Organization' : 'Create Organization'}
              </Button>
            </Stack>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default OrganizationForm;
