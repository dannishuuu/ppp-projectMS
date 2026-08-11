import { useState, useEffect } from 'react';
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
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { useAuth } from '../../context/AuthContext';

export const EditUser = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const isEditingSelf = currentUser?.id === id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    display_name: '',
    phone: '',
    password: '',
  });

  const fetchUser = async () => {
    setLoading(true);
    try {
      const user = await userService.getUserById(id);
      setFormData({
        email: user.email || '',
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        phone: user.phone || '',
        password: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [id]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await userService.updateUser(id, payload);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      navigate('/users/list');
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={36} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const getUserInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    if (formData.display_name) {
      return formData.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (formData.email?.[0] || formData.username?.[0] || 'U').toUpperCase();
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
          <Typography color="text.primary">Edit User</Typography>
        </Breadcrumbs>

        {/* Self-edit warning alert */}
        {isEditingSelf && (
          <Alert severity="info" sx={{ mt: 3, mb: 0, borderRadius: 2 }}>
            You are editing your own account.
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, backgroundColor: '#1a237e', fontSize: '1.25rem', fontWeight: 700 }}>
              {getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Edit User
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Update user information and account settings
              </Typography>
            </Box>
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
                name="first_name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                fullWidth
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
                name="last_name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                fullWidth
                autoComplete="family-name"
              />
              <TextField
                label="Display Name"
                name="display_name"
                value={[formData.first_name, formData.last_name].filter(Boolean).join(' ').trim() || formData.display_name}
                fullWidth
                disabled
                helperText="Auto-generated from first and last name"
              />
            </Box>

            {/* Column 2: Contact Information */}
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
                Contact Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
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
                label="Phone Number (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
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

            {/* Column 3: Account Information */}
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
                Account Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange('username')}
                placeholder="Unique identifier for login"
                fullWidth
                autoComplete="username"
              />
              <TextField
                label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                fullWidth
                autoComplete="new-password"
                InputProps={{
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
              onClick={() => navigate('/users/list')}
              disabled={saving}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                px: 5,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1a237e, #283593)',
              }}
            >
              {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default EditUser;