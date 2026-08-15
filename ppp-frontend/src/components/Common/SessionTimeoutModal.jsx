import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export const SessionTimeoutModal = ({ open, countdown, onContinue, onLogout }) => {
  const progressPercent = Math.max(0, Math.min(100, (countdown / 60) * 100));

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        // Prevent closing by clicking backdrop or pressing ESC
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onContinue();
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1.5,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
            Session Inactivity Warning
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            Inactivity detected (over 5 minutes)
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography variant="body2" sx={{ color: '#334155', mb: 2, fontSize: '0.875rem', lineHeight: 1.5 }}>
          You have been inactive for more than 5 minutes. For your security, your session will automatically log out in:
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            p: 2,
            mb: 2,
            backgroundColor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <Chip
            label={`${countdown}s remaining`}
            color={countdown <= 15 ? 'error' : 'warning'}
            sx={{ fontWeight: 800, fontSize: '0.95rem', px: 1, mb: 1.5 }}
          />

          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              color={countdown <= 15 ? 'error' : 'warning'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', display: 'block' }}>
          Click "Continue Session" to stay logged in.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, px: 2.5 }}
        >
          Log Out
        </Button>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onContinue}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            px: 3,
          }}
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutModal;
