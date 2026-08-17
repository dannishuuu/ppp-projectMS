import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  Tab,
  Tabs,
  IconButton,
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
  HistoryOutlined as HistoryIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatBadge = ({ icon, label, value }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      px: 3,
      py: 2,
      borderRadius: '14px',
      backgroundColor: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
      minWidth: 100,
    }}
  >
    {React.cloneElement(icon, { sx: { color: 'rgba(255,255,255,0.7)', fontSize: 18 } })}
    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>
      {value}
    </Typography>
    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </Typography>
  </Box>
);

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
      borderRadius: '16px',
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
          borderRadius: '10px',
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
  const [tab, setTab] = useState(0);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', pb: 6 }}>

      {/* ── Compact Top Bar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: back + breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              borderRadius: '8px',
              minHeight: 0,
              '&:hover': { backgroundColor: 'rgba(99,102,241,0.06)', color: '#6366f1' },
            }}
          >
            Users
          </Button>
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>/</Typography>
          <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}>
            {displayName}
          </Typography>
        </Box>

        {/* Right: Edit button */}
        {!isMe && (
          <Button
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => navigate(`/users/${id}/edit`)}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: '10px',
              px: 2.5,
              py: 0.85,
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

      {/* ── Hero Profile Card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        {/* Banner */}
        <Box
          sx={{
            px: { xs: 3, md: 5 },
            pt: 4,
            pb: 5,
            background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <Box sx={{ position: 'absolute', bottom: -20, left: '30%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Box sx={{ position: 'absolute', top: 20, right: '20%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Avatar */}
            <Box
              sx={{
                p: '3px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              <Avatar
                sx={{
                  width: 88,
                  height: 88,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                  border: '2.5px solid rgba(255,255,255,0.6)',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {user.avatar_url
                  ? <Box component="img" src={user.avatar_url} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initials()
                }
              </Avatar>
            </Box>

            {/* Name + username + status */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {displayName}
                </Typography>
                <Chip
                  label={user.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    borderRadius: '20px',
                    backgroundColor: user.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                    color: user.is_active ? '#6ee7b7' : '#fca5a5',
                    border: `1px solid ${user.is_active ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  }}
                />
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', mt: 0.5, fontWeight: 500 }}>
                @{user.username || 'N/A'} · {user.email}
              </Typography>
            </Box>

            {/* Stat badges */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <StatBadge icon={<CalendarIcon />} label="Joined" value={formatDate(user.created_at)} />
              <StatBadge icon={<LastLoginIcon />} label="Last Login" value={user.last_login_at ? formatDate(user.last_login_at) : 'Never'} />
            </Box>
          </Box>
        </Box>

        {/* ── Tabs ── */}
        <Box sx={{ borderBottom: '1px solid #f1f5f9', px: { xs: 2, md: 4 }, backgroundColor: '#fff' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                minHeight: 48,
                color: '#94a3b8',
                px: 2.5,
                mr: 0.5,
                '&.Mui-selected': { color: '#4f46e5', fontWeight: 700 },
                '&:hover': { color: '#4f46e5', backgroundColor: 'rgba(99,102,241,0.04)', borderRadius: '8px 8px 0 0' },
              },
              '& .MuiTabs-indicator': { height: 2.5, borderRadius: '3px 3px 0 0', backgroundColor: '#4f46e5' },
            }}
          >
            <Tab icon={<PersonIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Overview" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Activity" />
          </Tabs>
        </Box>

        {/* ── Tab Content ── */}
        <Box sx={{ p: { xs: 2.5, md: 4 }, backgroundColor: '#f8fafc' }}>

          {/* OVERVIEW TAB */}
          {tab === 0 && (
            <Grid container spacing={2.5}>

              {/* Personal Info */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={<PersonIcon />} title="Personal Information">
                  <FieldRow icon={<PersonIcon />} label="First Name" value={user.first_name} />
                  <FieldRow icon={<PersonIcon />} label="Last Name" value={user.last_name} />
                  <FieldRow icon={<BadgeIcon />} label="Display Name" value={user.display_name} />
                  <FieldRow icon={<PhoneIcon />} label="Phone" value={user.phone} last />
                </SectionCard>
              </Grid>

              {/* Account Info */}
              <Grid item xs={12} md={6}>
                <SectionCard icon={<AccountIcon />} title="Account Details">
                  <FieldRow icon={<EmailIcon />} label="Email" value={user.email} copyable />
                  <FieldRow icon={<AccountIcon />} label="Username" value={user.username ? `@${user.username}` : '—'} />
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
              </Grid>

              {/* Dates */}
              <Grid item xs={12}>
                <SectionCard icon={<TimeIcon />} title="Timeline">
                  <Grid container>
                    <Grid item xs={12} sm={4}>
                      <FieldRow icon={<CalendarIcon />} label="Created" value={formatDateTime(user.created_at)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FieldRow icon={<TimeIcon />} label="Last Updated" value={formatDateTime(user.updated_at)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FieldRow icon={<LastLoginIcon />} label="Last Login" value={user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'} last />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* ACTIVITY TAB */}
          {tab === 1 && (
            <Box
              sx={{
                py: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                borderRadius: '16px',
                border: '1px dashed #e2e8f0',
                backgroundColor: '#fff',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(124,58,237,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HistoryIcon sx={{ fontSize: 26, color: '#a5b4fc' }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>
                No Activity Yet
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.83rem', textAlign: 'center', maxWidth: 280 }}>
                User activity history will appear here once actions are recorded.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default UserDetails;