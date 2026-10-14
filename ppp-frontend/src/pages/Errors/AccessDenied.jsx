// pages/Errors/AccessDenied.jsx
import React from 'react';
import { Box, Paper, Typography, Button, Avatar, Divider } from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Design Theme Tokens consistent with the AAPPP design system
const T = {
  primary: '#1e40af',
  primaryCont: '#1e3a8a',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
};

/**
 * Full error page shown when the signed-in user tries to open a route they
 * do not have permission for (HTTP 403 equivalent). Renders inside the main
 * layout, so the sidebar and header stay visible. Uses the full content
 * width with every element centered.
 */
export const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '—'
    : '—';
  const userEmail = user?.email || '—';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 3,
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            position: 'relative',
            px: 4,
            pt: 4,
            pb: 3.5,
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderBottom: `1px solid ${T.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Ghost 403 watermark */}
          <Typography
            sx={{
              position: 'absolute',
              top: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '7rem',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'rgba(15, 23, 42, 0.05)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            403
          </Typography>

          <Avatar
            sx={{
              width: 68,
              height: 68,
              mx: 'auto',
              mb: 2,
              bgcolor: '#fee2e2',
              color: '#dc2626',
              boxShadow: '0 6px 16px rgba(220, 38, 38, 0.18)',
            }}
          >
            <LockIcon sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography
            variant="overline"
            sx={{ display: 'block', color: '#dc2626', fontWeight: 800, letterSpacing: '0.14em' }}
          >
            Error 403
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', mb: 1 }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: T.textSecondary, maxWidth: 470, mx: 'auto', lineHeight: 1.6 }}
          >
            You don&apos;t have permission to view this page. Your account is not assigned the
            required access, so this area is restricted. If you believe this is a mistake, contact
            your administrator and request access.
          </Typography>
        </Box>

        {/* ── Signed-in user ── */}
        <Box sx={{ px: 4, py: 3, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: T.textSecondary,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 0.5,
            }}
          >
            Signed in as
          </Typography>
          <Typography variant="body2" sx={{ color: T.textPrimary, fontWeight: 600 }}>
            {fullName}
            <Box component="span" sx={{ color: T.textSecondary, fontWeight: 400 }}>
              {' '}
              · {userEmail}
            </Box>
          </Typography>
        </Box>

        <Divider />

        {/* ── Actions ── */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            backgroundColor: '#f8fafc',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderColor: T.border,
              color: T.textPrimary,
              '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
            }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              backgroundColor: T.primary,
              '&:hover': { backgroundColor: T.primaryCont },
            }}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AccessDenied;
