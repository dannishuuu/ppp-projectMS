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
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { userService } from '../../services/userServices/userServices';

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
      {/* Breadcrumbs & Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard">
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" component={RouterLink} to="/users">
            Users Management
          </Link>
          <Typography color="text.primary">Create New User</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Create New Account
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Add a new user account to the system and configure their authorization levels.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/users/list')}
            sx={{ borderRadius: 2, flexShrink: 0 }}
          >
            Back to Users
          </Button>
        </Box>
      </Box>

      {/* Global feedback */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          User account created successfully! Redirecting to user list...
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Form - using CSS Grid for 3 equal columns */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4, md: 5 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Grid container with 3 columns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 4,
              alignItems: 'stretch',
            }}
          >
            {/* Column 1: Basic Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  letterSpacing: '0.5px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}
              >
                Basic Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
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
              />
              <TextField
                label="Phone Number (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                autoComplete="tel"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Column 2: Role & Assignment */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  letterSpacing: '0.5px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}
              >
                Role & Assignment
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <FormControl fullWidth required>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DepartmentIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="sendActivationEmail"
                    checked={formData.sendActivationEmail}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="Send activation email"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Column 3: Security Credentials */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#1a237e',
                  letterSpacing: '0.5px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}
              >
                Security Credentials
              </Typography>
              <Divider sx={{ mb: 1 }} />
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
                InputProps={{
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
                }}
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
                InputProps={{
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
                }}
              />
            </Box>
          </Box>

          {/* Submit & Actions - full width row */}
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
              onClick={() => navigate('/users')}
              disabled={loading}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || success}
              sx={{
                px: 5,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1a237e, #283593)',
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Create Account'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateUser;