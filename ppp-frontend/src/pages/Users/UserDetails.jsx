import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  Stack,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AccountCircle as AccountIcon,
  AccessTime as TimeIcon,
  VpnKey as KeyIcon,
  BadgeOutlined as BadgeIcon,
  LoginRounded as LastLoginIcon,
  ContentCopy as CopyIcon,
  Public as LocationIcon,
  Map as RegionIcon,
  Place as ZoneIcon,
  HomeWork as WoredaIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

// ─── Sub-components ──────────────────────────────────────────────────────────

// Compact stacked row for the identity sidebar card
const SummaryRow = ({ icon, label, value, mono = false, copyable = false, last = false }) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      enqueueSnackbar('Copied to clipboard', { variant: 'success', autoHideDuration: 1500 });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        py: 1.1,
        px: 0.25,
        borderBottom: last ? 'none' : '1px solid #f1f5f9',
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          backgroundColor: 'rgba(99,102,241,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {React.cloneElement(icon, { sx: { color: '#a5b4fc', fontSize: 14 } })}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#1e293b',
              fontFamily: mono ? '"Roboto Mono", monospace' : 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || '—'}
          </Typography>
          {copyable && value && (
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ p: 0.3, color: '#94a3b8', '&:hover': { color: '#6366f1' } }}
            >
              <CopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const FieldRow = ({ icon, label, value, mono = false, copyable = false, chip = null, last = false }) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      enqueueSnackbar('Copied to clipboard', { variant: 'success', autoHideDuration: 1500 });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.6,
        px: 0.25,
        borderBottom: last ? 'none' : '1px solid #f1f5f9',
        gap: 1.5,
        '&:hover .copy-btn': { opacity: 1 },
        transition: 'background 0.15s',
        borderRadius: '6px',
        '&:hover': { backgroundColor: '#fafbff' },
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '8px',
          backgroundColor: 'rgba(99,102,241,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { sx: { color: '#a5b4fc', fontSize: 15 } })}
      </Box>

      <Typography sx={{ width: 130, flexShrink: 0, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
        {label}
      </Typography>

      {chip ? chip : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: '#1e293b',
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: mono ? '"Roboto Mono", monospace' : 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || '—'}
          </Typography>
          {copyable && value && (
            <IconButton
              className="copy-btn"
              size="small"
              onClick={handleCopy}
              sx={{ opacity: 0, transition: 'opacity 0.2s', p: 0.3, color: '#94a3b8', '&:hover': { color: '#6366f1' } }}
            >
              <CopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
};

const SectionCard = ({ icon, title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid #eef2f7',
      backgroundColor: '#fff',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(124,58,237,0.12))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {React.cloneElement(icon, { sx: { color: '#6366f1', fontSize: 16 } })}
      </Box>
      <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </Typography>
    </Box>
    <Divider sx={{ mb: 1.5 }} />
    {children}
  </Paper>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await userService.getUserById(id);
        setUser(data);
      } catch {
        enqueueSnackbar('Failed to load user details', { variant: 'error' });
        navigate('/users/list');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate, enqueueSnackbar]);

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress size={40} thickness={4} sx={{ color: '#6366f1' }} />
        <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading profile...</Typography>
      </Box>
    );
  }

  const initials = () => {
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    if (user.display_name) return user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (user.email?.[0] || user.username?.[0] || 'U').toUpperCase();
  };

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User';
  const isMe = currentUser?.id === user?.id;

  return (
    <Box sx={{ width: '100%', pb: 6 }}>

      {/* ── Compact Top Bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate('/users/list')}
            size="small"
            sx={{
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.8rem',
              px: 1.5,
              py: 0.6,
              borderRadius: 2,
              minHeight: 0,
              textTransform: 'none',
              borderColor: '#cbd5e1',
              '&:hover': { backgroundColor: 'rgba(99,102,241,0.06)', color: '#6366f1', borderColor: '#94a3b8' },
            }}
          >
            Users
          </Button>
          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            {displayName}
          </Typography>
        </Box>

        {!isMe && (
          <Button
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate(`/users/${id}/edit`)}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: 2,
              px: 2.5,
              py: 0.85,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca, #6d28d9)',
                boxShadow: '0 6px 18px rgba(99,102,241,0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Edit User
          </Button>
        )}
      </Box>

      {/* Subtitle */}
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
        View user profile details and account information.
      </Typography>

      <Fade in>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '340px 1fr',
            gap: 2.5,
            alignItems: 'start',
          }}
        >
          {/* ── Identity Sidebar Card ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Gradient banner */}
            <Box
              sx={{
                height: 84,
                background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <Box sx={{ position: 'absolute', bottom: -30, left: '20%', width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            </Box>

            {/* Avatar + identity */}
            <Box sx={{ px: 3, pb: 2.5, mt: '-46px', position: 'relative', textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  p: '3px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}
              >
                <Avatar
                  sx={{
                    width: 92,
                    height: 92,
                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    border: '3px solid #ffffff',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  {user.avatar_url
                    ? <Box component="img" src={user.avatar_url} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials()
                  }
                </Avatar>
              </Box>

              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem', letterSpacing: '-0.01em', mt: 1.25, lineHeight: 1.3 }}>
                {displayName}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500, mt: 0.25 }}>
                @{user.username || 'N/A'}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={user.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    borderRadius: '20px',
                    backgroundColor: user.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: user.is_active ? '#059669' : '#dc2626',
                    border: `1px solid ${user.is_active ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                  }}
                />
                {isMe && (
                  <Chip
                    label="This is you"
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(99,102,241,0.1)',
                      color: '#4f46e5',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  />
                )}
              </Box>
            </Box>

            <Divider />

            {/* Quick stats */}
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <SummaryRow icon={<CalendarIcon />} label="Joined" value={formatDate(user.created_at)} />
              <SummaryRow
                icon={<LastLoginIcon />}
                label="Last Login"
                value={user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                last
              />
            </Box>
          </Paper>

          {/* ── Details Column ── */}
          <Stack spacing={2.5}>

            {/* Personal Info + Account Details Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 2.5 }}>
              <SectionCard icon={<PersonIcon />} title="Personal Information">
                <FieldRow icon={<PersonIcon />} label="First Name" value={user.first_name} />
                <FieldRow icon={<PersonIcon />} label="Last Name" value={user.last_name} />
                <FieldRow icon={<BadgeIcon />} label="Display Name" value={user.display_name} last />
              </SectionCard>

              <SectionCard icon={<AccountIcon />} title="Account Details">
                <FieldRow icon={<EmailIcon />} label="Email" value={user.email} copyable />
                <FieldRow icon={<PhoneIcon />} label="Phone" value={user.phone} />
                <FieldRow icon={<KeyIcon />} label="User ID" value={user.id} mono copyable />
                <FieldRow
                  icon={<AccountIcon />}
                  label="Status"
                  last
                  chip={
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        borderRadius: '8px',
                        backgroundColor: user.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: user.is_active ? '#059669' : '#dc2626',
                      }}
                    />
                  }
                />
              </SectionCard>
            </Box>

            {/* Location Details */}
            <SectionCard icon={<LocationIcon />} title="Location Details">
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 2 }}>
                <FieldRow icon={<LocationIcon />} label="Country" value={user.location_country_name || '—'} last={false} />
                <FieldRow icon={<RegionIcon />} label="Region" value={user.location_region_name || '—'} last={false} />
                <FieldRow icon={<ZoneIcon />} label="Zone / Sub-city" value={user.location_zone_name || '—'} last={false} />
                <FieldRow icon={<WoredaIcon />} label="Woreda" value={user.location_woreda_name || '—'} last={true} />
              </Box>
            </SectionCard>

            {/* Timeline */}
            <SectionCard icon={<TimeIcon />} title="Timeline">
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 2 }}>
                <FieldRow icon={<CalendarIcon />} label="Created" value={formatDateTime(user.created_at)} last={false} />
                <FieldRow icon={<TimeIcon />} label="Last Updated" value={formatDateTime(user.updated_at)} last={false} />
                <FieldRow icon={<LastLoginIcon />} label="Last Login" value={user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'} last />
              </Box>
            </SectionCard>
          </Stack>
        </Box>
      </Fade>
    </Box>
  );
};

export default UserDetails;
