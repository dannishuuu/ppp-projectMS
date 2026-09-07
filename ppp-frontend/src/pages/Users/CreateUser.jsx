import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
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
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  BadgeOutlined as RoleIcon,
  BusinessOutlined as DepartmentIcon,
  ArrowBack as ArrowBackIcon,
  PersonAddAlt as AccountIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { userService } from '../../services/userServices/userServices';

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
    password: '',
    confirmPassword: '',
    sendActivationEmail: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/users" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Users Management
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Create New User
            </Typography>
          </Breadcrumbs>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Create New Account
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{
            borderRadius: 2,
            borderColor: '#cbd5e1',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
          }}
        >
          Back to Users
        </Button>
      </Box>

      {/* Subtitle */}
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
        Add a new user account to the system and configure their authorization levels.
      </Typography>

      {/* Global feedback */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, border: '1px solid #bbf7d0' }}>
          User account created successfully! Redirecting to user list...
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, border: '1px solid #fecaca' }}>
          {error}
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
            {/* Column 1: Basic Information */}
            <Stack spacing={2.5}>
              <SectionHeader icon={<AccountIcon />} title="Basic Information" color="#1e40af" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={() => handleBlur('firstName')}
                error={Boolean(getError('firstName'))}
                helperText={getError('firstName')}
                fullWidth
                required
                autoComplete="given-name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={() => handleBlur('lastName')}
                error={Boolean(getError('lastName'))}
                helperText={getError('lastName')}
                fullWidth
                required
                autoComplete="family-name"
                sx={formFieldSx}
              />
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                error={Boolean(getError('email'))}
                helperText={getError('email')}
                fullWidth
                required
                autoComplete="email"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={Boolean(getError('username'))}
                helperText={getError('username')}
                fullWidth
                required
                autoComplete="username"
                sx={formFieldSx}
              />
              <TextField
                label="Phone Number (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                autoComplete="tel"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
            </Stack>

            {/* Column 2: Role & Assignment */}
            <Stack spacing={2.5}>
              <SectionHeader icon={<RoleIcon />} title="Role & Assignment" color="#047857" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <FormControl fullWidth required size="small" sx={formFieldSx}>
                <InputLabel id="role-select-label">System Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  value={formData.role}
                  label="System Role"
                  onChange={handleChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <RoleIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Admin">Administrator</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                fullWidth
                placeholder="e.g. Infrastructure, Finance"
                autoComplete="organization"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <DepartmentIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="sendActivationEmail"
                    checked={formData.sendActivationEmail}
                    onChange={handleChange}
                    color="primary"
                    sx={{ '&.Mui-checked': { color: '#4f46e5' } }}
                  />
                }
                label="Send activation email"
                sx={{ mt: 1, '& .MuiFormControlLabel-label': { color: '#334155', fontSize: '0.9rem' } }}
              />
            </Stack>

            {/* Column 3: Security Credentials */}
            <Stack spacing={2.5}>
              <SectionHeader icon={<SecurityIcon />} title="Security Credentials" color="#7c3aed" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                label="Initial Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={Boolean(getError('password'))}
                helperText={getError('password')}
                fullWidth
                required
                autoComplete="new-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                error={Boolean(getError('confirmPassword'))}
                helperText={getError('confirmPassword')}
                fullWidth
                required
                autoComplete="new-password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={formFieldSx}
              />
            </Stack>
          </Box>

          {/* Submit & Actions */}
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
              Password must be at least 6 characters
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/users')}
                disabled={loading}
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
                disabled={loading || success}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338ca, #3730a3)' },
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8', boxShadow: 'none', backgroundImage: 'none' },
                }}
              >
                {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Create Account'}
              </Button>
            </Stack>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateUser;