import React, { useState, useEffect } from 'react';

import {

  Box,

  Paper,

  Typography,

  TextField,

  Button,

  Alert,

  Divider,

  CircularProgress,

  FormControl,

  InputLabel,

  Select,

  MenuItem,

  FormControlLabel,

  Checkbox,

  Breadcrumbs,

  Link,

  useMediaQuery,

  useTheme,

  Stack,

} from '@mui/material';

import {

  BadgeOutlined as RoleIcon,

  ArrowBack as ArrowBackIcon,

  PersonAddAlt as AccountIcon,

  Security as SecurityIcon,

  Public as LocationIcon,

} from '@mui/icons-material';

import { useNavigate, Link as RouterLink } from 'react-router-dom';

import { userService } from '../../services/userServices/userServices';

import {

  countriesService,

  regionsService,

  zonesService,

  woredasService,

} from '../../services/foundationService';

const inputSx = {

  borderRadius: 2,

  backgroundColor: '#ffffff',

  fontSize: '0.84rem',

  '& fieldset': { borderColor: '#cbd5e1' },

  '&:hover fieldset': { borderColor: '#94a3b8' },

  '&.Mui-focused fieldset': { borderColor: '#4f46e5', borderWidth: '1.5px' },

};

const formFieldSx = {

  '& .MuiOutlinedInput-root': inputSx,

  '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },

};

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

export const CreateUser = () => {

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate();

  const [formData, setFormData] = useState({

    email: '',

    username: '',

    firstName: '',

    lastName: '',

    phone: '',

    role: 'User',

    department: '',

    countryId: '',

    regionId: '',

    zoneId: '',

    woredaId: '',

    password: '',

    confirmPassword: '',

    sendActivationEmail: true,

  });

  const [countries, setCountries] = useState([]);

  const [regions, setRegions] = useState([]);

  const [zones, setZones] = useState([]);

  const [woredas, setWoredas] = useState([]);

  const [loadingCountries, setLoadingCountries] = useState(false);

  const [loadingRegions, setLoadingRegions] = useState(false);

  const [loadingZones, setLoadingZones] = useState(false);

  const [loadingWoredas, setLoadingWoredas] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);

  const [touched, setTouched] = useState({});

  // Fetch countries on component mount

  useEffect(() => {

    const fetchCountries = async () => {

      setLoadingCountries(true);

      try {

        const res = await countriesService.getCountries({ limit: 1000, status: 'active' });

        setCountries(res.countries || []);

      } catch (err) {

        console.error('Failed to load countries:', err);

      } finally {

        setLoadingCountries(false);

      }

    };

    fetchCountries();

  }, []);

  // Fetch regions when country changes

  useEffect(() => {

    if (formData.countryId) {

      const fetchRegions = async () => {

        setLoadingRegions(true);

        try {

          const res = await regionsService.getRegions({ limit: 1000, status: 'active', countryId: formData.countryId });

          setRegions(res.regions || []);

        } catch (err) {

          console.error('Failed to load regions:', err);

        } finally {

          setLoadingRegions(false);

        }

      };

      fetchRegions();

    } else {

      setRegions([]);

      setZones([]);

      setWoredas([]);

    }

  }, [formData.countryId]);

  // Fetch zones when region changes

  useEffect(() => {

    if (formData.regionId) {

      const fetchZones = async () => {

        setLoadingZones(true);

        try {

          const res = await zonesService.getZones({ limit: 1000, status: 'active', regionId: formData.regionId });

          setZones(res.zones || []);

        } catch (err) {

          console.error('Failed to load zones:', err);

        } finally {

          setLoadingZones(false);

        }

      };

      fetchZones();

    } else {

      setZones([]);

      setWoredas([]);

    }

  }, [formData.regionId]);

  // Fetch woredas when zone changes

  useEffect(() => {

    if (formData.zoneId) {

      const fetchWoredas = async () => {

        setLoadingWoredas(true);

        try {

          const res = await woredasService.getWoredas({ limit: 1000, status: 'active', zoneId: formData.zoneId });

          setWoredas(res.woredas || []);

        } catch (err) {

          console.error('Failed to load woredas:', err);

        } finally {

          setLoadingWoredas(false);

        }

      };

      fetchWoredas();

    } else {

      setWoredas([]);

    }

  }, [formData.zoneId]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {

    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({

      ...prev,

      [name]: type === 'checkbox' ? checked : value,

    }));

  };

  const handleLocationChange = (field, value) => {

    setFormData((prev) => {

      const next = { ...prev, [field]: value };

      if (field === 'countryId') {

        next.regionId = '';

        next.zoneId = '';

        next.woredaId = '';

      } else if (field === 'regionId') {

        next.zoneId = '';

        next.woredaId = '';

      } else if (field === 'zoneId') {

        next.woredaId = '';

      }

      return next;

    });

  };

  const handleBlur = (field) => {

    setTouched((prev) => ({ ...prev, [field]: true }));

  };

  const isFormValid = () => {

    return (

      formData.email &&

      validateEmail(formData.email) &&

      formData.username &&

      formData.firstName &&

      formData.lastName &&

      formData.role &&

      formData.password &&

      formData.password === formData.confirmPassword &&

      formData.password.length >= 6

    );

  };

  const getError = (field) => {

    if (!touched[field]) return '';

    switch (field) {

      case 'email':

        if (!formData.email) return 'Email is required';

        if (!validateEmail(formData.email)) return 'Enter a valid email address';

        return '';

      case 'username':

        if (!formData.username) return 'Username is required';

        return '';

      case 'firstName':

        if (!formData.firstName) return 'First name is required';

        return '';

      case 'lastName':

        if (!formData.lastName) return 'Last name is required';

        return '';

      case 'password':

        if (!formData.password) return 'Password is required';

        if (formData.password.length < 6) return 'Password must be at least 6 characters';

        return '';

      case 'confirmPassword':

        if (!formData.confirmPassword) return 'Please confirm the password';

        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';

        return '';

      default:

        return '';

    }

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setTouched({

      email: true,

      username: true,

      firstName: true,

      lastName: true,

      password: true,

      confirmPassword: true,

    });

    if (!isFormValid()) return;

    setLoading(true);

    setError('');

    try {

      const payload = {

        email: formData.email,

        username: formData.username,

        firstName: formData.firstName,

        lastName: formData.lastName,

        phone: formData.phone || undefined,

        role: formData.role,

        department: formData.department || undefined,

        countryId: formData.countryId || undefined,

        regionId: formData.regionId || undefined,

        zoneId: formData.zoneId || undefined,

        woredaId: formData.woredaId || undefined,

        password: formData.password,

        sendActivationEmail: formData.sendActivationEmail,

      };

      await userService.createUser(payload);

      setSuccess(true);

      setTimeout(() => navigate('/users'), 1500);

    } catch (err) {

      setError(err.message || 'Failed to create user account. Please try again.');

    } finally {

      setLoading(false);

    }

  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        width: '100%',
        pb: { xs: 2, sm: 3, lg: 4 },
        backgroundColor: '#f5f7fb',
        color: '#172033',
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            mb: 2,
            '& .MuiBreadcrumbs-separator': { color: '#a0aabc' },
            '& a': { color: '#718096', fontSize: '0.8rem', fontWeight: 500 },
          }}
        >
          <Link underline="hover" component={RouterLink} to="/dashboard">Dashboard</Link>
          <Link underline="hover" component={RouterLink} to="/users">Users Management</Link>
          <Typography sx={{ color: '#344054', fontSize: '0.8rem', fontWeight: 700 }}>
            Create New User
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 3,
                color: '#fff',
                background: 'linear-gradient(145deg, #3157c8 0%, #243f9f 100%)',
                boxShadow: '0 8px 18px rgba(49,87,200,0.2)',
                '& svg': { fontSize: 27 },
              }}
            >
              <AccountIcon />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.45rem', md: '1.8rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.045em',
                  color: '#172033',
                  lineHeight: 1.25,
                }}
              >
                Create New Account
              </Typography>
              <Typography sx={{ color: '#667085', fontSize: '0.9rem', mt: 0.6 }}>
                Create a user profile and configure access, location, and security.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/users/list')}
            sx={{
              borderColor: '#d6dce7',
              color: '#344054',
              bgcolor: '#fff',
              borderRadius: 2.5,
              px: 2,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: '#9aa8bf', bgcolor: '#f9fafb' },
            }}
          >
            Back to Users
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5 }}>
            User account created successfully! Redirecting to user list...
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e4e9f2',
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: '#fff',
            boxShadow: '0 8px 30px rgba(23,32,51,0.035)',
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, md: 3 },
              py: 1.75,
              borderBottom: '1px solid #edf0f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#202b40' }}>
                Account details
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#7b8497', mt: 0.35 }}>
                Complete the required fields to create a new account.
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.25,
                py: 0.65,
                borderRadius: 2,
                bgcolor: '#f0f5ff',
                color: '#3157c8',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              * Required fields
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: { xs: 1.75, md: 2 },
                alignItems: 'stretch',
              }}
            >
              <Paper
                variant="outlined"
                sx={{ p: { xs: 1.75, sm: 2 }, borderColor: '#e6eaf1', borderRadius: 3, boxShadow: 'none' }}
              >
                <Stack spacing={1.6}>
                  <SectionHeader icon={<AccountIcon />} title="Basic Information" color="#3157c8" />
                  <Divider sx={{ borderColor: '#edf0f5' }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                    <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={() => handleBlur('firstName')} error={Boolean(getError('firstName'))} helperText={getError('firstName')} fullWidth required autoComplete="given-name" sx={formFieldSx} />
                    <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={() => handleBlur('lastName')} error={Boolean(getError('lastName'))} helperText={getError('lastName')} fullWidth required autoComplete="family-name" sx={formFieldSx} />
                    <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} error={Boolean(getError('email'))} helperText={getError('email')} fullWidth required autoComplete="email" sx={{ ...formFieldSx, gridColumn: { sm: '1 / -1' } }} />
                    <TextField label="Username" name="username" value={formData.username} onChange={handleChange} onBlur={() => handleBlur('username')} error={Boolean(getError('username'))} helperText={getError('username')} fullWidth required autoComplete="username" sx={formFieldSx} />
                    <TextField label="Phone Number (Optional)" name="phone" type="tel" value={formData.phone} onChange={handleChange} fullWidth autoComplete="tel" sx={formFieldSx} />
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: { xs: 1.75, sm: 2 }, borderColor: '#e6eaf1', borderRadius: 3, boxShadow: 'none' }}
              >
                <Stack spacing={1.6}>
                  <SectionHeader icon={<RoleIcon />} title="Role & Assignment" color="#07805d" />
                  <Divider sx={{ borderColor: '#edf0f5' }} />
                  <FormControl fullWidth required size="small" sx={formFieldSx}>
                    <InputLabel id="role-select-label">System Role</InputLabel>
                    <Select labelId="role-select-label" name="role" value={formData.role} label="System Role" onChange={handleChange}>
                      <MenuItem value="User">User</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="Admin">Administrator</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Department" name="department" value={formData.department} onChange={handleChange} fullWidth placeholder="e.g. Infrastructure, Finance" autoComplete="organization" sx={formFieldSx} />
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: '#f7f9fc',
                      border: '1px solid #edf0f5',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="sendActivationEmail"
                          checked={formData.sendActivationEmail}
                          onChange={handleChange}
                          color="primary"
                          sx={{ '&.Mui-checked': { color: '#3157c8' } }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#344054' }}>
                            Send activation email
                          </Typography>
                          <Typography sx={{ fontSize: '0.76rem', color: '#7b8497' }}>
                            Notify the user when their account is ready.
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0, alignItems: 'center' }}
                    />
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: { xs: 1.75, sm: 2 }, borderColor: '#e6eaf1', borderRadius: 3, boxShadow: 'none' }}
              >
                <Stack spacing={1.6}>
                  <SectionHeader icon={<LocationIcon />} title="Location Assignment" color="#087eae" />
                  <Divider sx={{ borderColor: '#edf0f5' }} />
                  <FormControl fullWidth size="small" sx={formFieldSx}>
                    <InputLabel id="country-select-label">Country</InputLabel>
                    <Select labelId="country-select-label" name="countryId" value={formData.countryId} label="Country" onChange={(e) => handleLocationChange('countryId', e.target.value)} disabled={loadingCountries}>
                      <MenuItem value=""><em>Select Country</em></MenuItem>
                      {countries.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={formFieldSx} disabled={!formData.countryId || loadingRegions}>
                    <InputLabel id="region-select-label">Region</InputLabel>
                    <Select labelId="region-select-label" name="regionId" value={formData.regionId} label="Region" onChange={(e) => handleLocationChange('regionId', e.target.value)}>
                      <MenuItem value=""><em>{loadingRegions ? 'Loading regions...' : 'Select Region'}</em></MenuItem>
                      {regions.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={formFieldSx} disabled={!formData.regionId || loadingZones}>
                    <InputLabel id="zone-select-label">Zone (Optional)</InputLabel>
                    <Select labelId="zone-select-label" name="zoneId" value={formData.zoneId} label="Zone (Optional)" onChange={(e) => handleLocationChange('zoneId', e.target.value)}>
                      <MenuItem value=""><em>{loadingZones ? 'Loading zones...' : 'None / Select Zone'}</em></MenuItem>
                      {zones.map((z) => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={formFieldSx} disabled={!formData.zoneId || loadingWoredas}>
                    <InputLabel id="woreda-select-label">Woreda (Optional)</InputLabel>
                    <Select labelId="woreda-select-label" name="woredaId" value={formData.woredaId} label="Woreda (Optional)" onChange={(e) => handleLocationChange('woredaId', e.target.value)}>
                      <MenuItem value=""><em>{loadingWoredas ? 'Loading woredas...' : 'None / Select Woreda'}</em></MenuItem>
                      {woredas.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: { xs: 1.75, sm: 2 }, borderColor: '#e6eaf1', borderRadius: 3, boxShadow: 'none' }}
              >
                <Stack spacing={1.6}>
                  <SectionHeader icon={<SecurityIcon />} title="Security Credentials" color="#7046bf" />
                  <Divider sx={{ borderColor: '#edf0f5' }} />
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'flex-start',
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: '#f7f5ff',
                      border: '1px solid #eee8ff',
                    }}
                  >
                    <SecurityIcon sx={{ color: '#7046bf', fontSize: 20, mt: 0.1 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#51349a' }}>
                        Set an initial password
                      </Typography>
                      <Typography sx={{ fontSize: '0.76rem', color: '#766a96', mt: 0.25 }}>
                        Use at least 6 characters. Confirm the password before creating the account.
                      </Typography>
                    </Box>
                  </Box>
                  <TextField label="Initial Password" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')} error={Boolean(getError('password'))} helperText={getError('password')} fullWidth required autoComplete="new-password" sx={formFieldSx} />
                  <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} onBlur={() => handleBlur('confirmPassword')} error={Boolean(getError('confirmPassword'))} helperText={getError('confirmPassword')} fullWidth required autoComplete="new-password" sx={formFieldSx} />
                </Stack>
              </Paper>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mt: 3,
                pt: 2.5,
                borderTop: '1px solid #edf0f5',
              }}
            >
              <Typography sx={{ color: '#8a94a6', fontSize: '0.78rem' }}>
                Fields marked * are required. Password must be at least 6 characters.
              </Typography>
              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/users')}
                  disabled={loading}
                  sx={{
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.15,
                    borderColor: '#d6dce7',
                    color: '#475467',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#aab4c4', bgcolor: '#f9fafb' },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || success}
                  sx={{
                    minWidth: 170,
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.15,
                    fontWeight: 750,
                    textTransform: 'none',
                    bgcolor: '#3157c8',
                    boxShadow: '0 5px 12px rgba(49,87,200,0.18)',
                    '&:hover': { bgcolor: '#2547ae', boxShadow: '0 7px 16px rgba(49,87,200,0.24)' },
                    '&:disabled': { bgcolor: '#e3e8f2', color: '#8a94a6', boxShadow: 'none' },
                  }}
                >
                  {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Create Account'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default CreateUser;
