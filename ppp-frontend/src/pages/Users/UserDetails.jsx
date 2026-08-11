import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Avatar,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await userService.getUserById(id);
        setUser(userData);
      } catch (err) {
        enqueueSnackbar('Failed to load user details', { variant: 'error' });
        navigate('/users/list');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate, enqueueSnackbar]);

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={36} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const getUserInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.display_name) {
      return user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user.email?.[0] || user.username?.[0] || 'U').toUpperCase();
  };

  const isCurrentUser = (userId) => currentUser?.id === userId;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Breadcrumbs sx={{ mb: 0.5 }}>
          <Link
            component={RouterLink}
            to="/users/list"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#1a237e' } }}
          >
            Users
          </Link>
          <Typography variant="body2" sx={{ color: '#0f172a', fontSize: '0.85rem' }}>
            User Details
          </Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/users/list')}
                sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', '&:hover': { background: 'transparent', color: '#0f172a' } }}
              >
                Back
              </Button>
            </Box>
            {!isCurrentUser(user?.id) && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/users/${id}/edit`)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1a237e, #283593)',
                  boxShadow: '0 4px 14px rgba(26,35,126,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #000051, #1a237e)',
                    boxShadow: '0 6px 20px rgba(26,35,126,0.45)',
                  },
                }}
              >
                Edit User
              </Button>
            )}
          </Box>
      </Box>

      {/* Main Profile Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Header Banner */}
        <Box
          sx={{
            height: 120,
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
            position: 'relative',
          }}
        />

        <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 4 }}>
          <Grid container spacing={4}>
            {/* Left: Avatar & Basic Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -8 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#1a237e',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    border: '4px solid #ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                >
                  {user.avatar_url ? (
                    <Box component="img" src={user.avatar_url} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    getUserInitials()
                  )}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mt: 2, textAlign: 'center' }}>
                  {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                  @{user.username || 'N/A'}
                </Typography>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                  <Chip
                    icon={user.is_active ? <ActiveIcon sx={{ fontSize: 16 }} /> : <InactiveIcon sx={{ fontSize: 16 }} />}
                    label={user.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: user.is_active ? '#059669' : '#dc2626',
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Right: Detailed Info */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EmailIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PhoneIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Phone
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {user.phone || 'Not provided'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CalendarIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Created
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {formatDate(user.created_at)}
                  </Typography>
                </Box>
              </Box>

              {/* Tabs */}
              <Tabs
                value={tabIndex}
                onChange={(_, val) => setTabIndex(val)}
                sx={{
                  borderBottom: '1px solid #e2e8f0',
                  mb: 3,
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    minHeight: 48,
                    mr: 2,
                    color: '#64748b',
                    '&.Mui-selected': { color: '#6366f1' },
                  },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: '#6366f1' },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Activity" />
              </Tabs>

              {/* Tab Panels */}
              {tabIndex === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Personal Information
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b', width: 140 }}>First Name</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.first_name || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Last Name</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.last_name || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Display Name</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.display_name || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Phone</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.phone || '-'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Account Details
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b', width: 140 }}>User ID</TableCell>
                            <TableCell sx={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.8rem' }}>{user.id}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Email</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.email}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Username</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>@{user.username || 'N/A'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                            <TableCell>
                              <Chip
                                label={user.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: user.is_active ? '#059669' : '#dc2626',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                      Important Dates
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b', width: 180 }}>Account Created</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{formatDateTime(user.created_at)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Last Updated</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{formatDateTime(user.updated_at)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Last Login</TableCell>
                            <TableCell sx={{ color: '#0f172a' }}>{user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}

              {tabIndex === 1 && (
                <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                  <Typography variant="body2">Activity history coming soon...</Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default UserDetails;