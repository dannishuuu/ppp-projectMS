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

export const OrganizationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(id);

  const [orgTypes, setOrgTypes] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    // Core Organization
    name: '',
    organizationTypeId: '',
    phone: '',
    email: '',
    address: '',
    profileExperience: '',

    // Organization Profile
    businessSector: '',
    yearsOfExperience: '',
    registrationDate: '',
    licenseNumber: '',
    bio: '',
    pastProjectsSummary: '',
  });

  // Load Organization Types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await organizationTypeService.getOrganizationTypes({ limit: 100, status: 'active' });
        setOrgTypes(res.organizationTypes || res.rows || []);
      } catch (err) {
        console.error('Failed to load organization types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Fetch org data if in Edit mode
  useEffect(() => {
    if (!id) return;
    const fetchOrgDetails = async () => {
      setLoading(true);
      try {
        const org = await organizationService.getOrganizationById(id);
        setFormData({
          name: org.name || '',
          organizationTypeId: org.organization_type_id || '',
          phone: org.phone || '',
          email: org.email || '',
          address: org.address || '',
          profileExperience: org.profile_experience || '',
          businessSector: org.business_sector || '',
          yearsOfExperience: org.years_of_experience ?? '',
          registrationDate: org.registration_date ? org.registration_date.split('T')[0] : '',
          licenseNumber: org.license_number || '',
          bio: org.bio || '',
          pastProjectsSummary: org.past_projects_summary || '',
        });
      } catch (err) {
        enqueueSnackbar(err.message || 'Failed to load organization details', { variant: 'error' });
        navigate('/organizations');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgDetails();
  }, [id]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Organization name is required.');
      return;
    }
    if (!formData.organizationTypeId) {
      setErrorMsg('Please select an Organization Type.');
      return;
    }

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
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
            <Link underline="hover" color="inherit" component={RouterLink} to="/organizations" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Organizations
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {isEditMode ? 'Edit Organization' : 'Create Organization'}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            {isEditMode ? `Edit: ${formData.name || 'Organization'}` : 'Add New Organization'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organizations')}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Back to Directory
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
              alignItems: 'stretch',
            }}
          >
            {/* Column 1: Core Organization Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Core Organization Info
              </Typography>
              <Divider />

              <TextField
                required
                fullWidth
                label="Organization Name"
                placeholder="e.g. Addis Real Estate & Development Group"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                select
                fullWidth
                label="Organization Type"
                value={formData.organizationTypeId}
                onChange={handleChange('organizationTypeId')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Type</MenuItem>
                {orgTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="e.g. 0911517888 (HENOK)"
                value={formData.phone}
                onChange={handleChange('phone')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                type="email"
                label="Email Address"
                placeholder="e.g. info@company.com"
                value={formData.email}
                onChange={handleChange('email')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Office Address"
                placeholder="e.g. Kirkos Sub City, Woreda 03, House No. 441, Addis Ababa"
                value={formData.address}
                onChange={handleChange('address')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Column 2: Licensing & Profile */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Licensing & Profile Specs
              </Typography>
              <Divider />

              <TextField
                fullWidth
                label="Business Sector"
                placeholder="e.g. Real Estate, Construction, Pharma"
                value={formData.businessSector}
                onChange={handleChange('businessSector')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Trade License / Reg Number"
                placeholder="e.g. BL-99201"
                value={formData.licenseNumber}
                onChange={handleChange('licenseNumber')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                placeholder="e.g. 8"
                value={formData.yearsOfExperience}
                onChange={handleChange('yearsOfExperience')}
                size="small"
                inputProps={{ min: 0 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                type="date"
                label="Legal Registration Date"
                InputLabelProps={{ shrink: true }}
                value={formData.registrationDate}
                onChange={handleChange('registrationDate')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Column 3: Experience & EV Summary */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Experience & Track Record
              </Typography>
              <Divider />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Developer Profile & Experience (የአልሚው ፕሮፋይልና ልምድ)"
                placeholder="Enter raw developer experience text from EV document..."
                value={formData.profileExperience}
                onChange={handleChange('profileExperience')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* Submit Actions Footer */}
          <Box
            sx={{
              display: 'flex',
              justify: 'flex-end',
              gap: 2,
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/organizations')}
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
              {saving ? 'Saving...' : isEditMode ? 'Update Organization' : 'Create Organization'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default OrganizationForm;
