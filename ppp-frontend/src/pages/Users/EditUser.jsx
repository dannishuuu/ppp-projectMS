import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
  Avatar,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { useAuth } from '../../context/AuthContext';

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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={36} sx={{ color: '#6366f1' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          Loading user details...
        </Typography>
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
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Avatar sx={{ width: 42, height: 42, backgroundColor: '#4f46e5', fontSize: '0.95rem', fontWeight: 700 }}>
            {getUserInitials()}
          </Avatar>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/users" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Users Management
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Edit User
            </Typography>
          </Breadcrumbs>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            {formData.first_name ? `${formData.first_name} ${formData.last_name || ''}`.trim() : 'Edit User'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users/list')}
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
        Update user information and account settings.
      </Typography>

      {/* Self-edit warning alert */}
      {isEditingSelf && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2, border: '1px solid #bae6fd' }}>
          You are editing your own account.
        </Alert>
      )}

      {/* Global feedback */}
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
              <SectionHeader icon={<PersonIcon />} title="Basic Information" color="#1e40af" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                fullWidth
                autoComplete="given-name"
                sx={formFieldSx}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                fullWidth
                autoComplete="family-name"
                sx={formFieldSx}
              />
              <TextField
                label="Display Name"
                name="display_name"
                value={[formData.first_name, formData.last_name].filter(Boolean).join(' ').trim() || formData.display_name}
                fullWidth
                disabled
                helperText="Auto-generated from first and last name"
                sx={formFieldSx}
              />
            </Stack>

            {/* Column 2: Contact Information */}
            <Stack spacing={2.5}>
              <SectionHeader icon={<EmailIcon />} title="Contact Information" color="#047857" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                fullWidth
                required
                autoComplete="email"
                sx={formFieldSx}
              />
              <TextField
                label="Phone Number (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                fullWidth
                autoComplete="tel"
                sx={formFieldSx}
              />
            </Stack>

            {/* Column 3: Account Information */}
            <Stack spacing={2.5}>
              <SectionHeader icon={<AccountIcon />} title="Account Information" color="#7c3aed" />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange('username')}
                placeholder="Unique identifier for login"
                fullWidth
                autoComplete="username"
                sx={formFieldSx}
              />
              <TextField
                label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                fullWidth
                autoComplete="new-password"
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
              Password is optional — leave blank to keep the current one
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/users/list')}
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
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
              </Button>
            </Stack>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default EditUser;
