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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  PersonOutlined as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import aapppLogo from '../../assets/AAPPP.png';
import logoCollidor from '../../assets/LogoCollidor.png';

export const Login = () => {
  const { login, loginError, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (!username || !password) return;

    const success = await login(username, password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const usernameError = touched.username && !username ? 'Username or Email is required' : '';
  const passwordError = touched.password && !password ? 'Password is required' : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000051 0%, #1a237e 45%, #283593 75%, #00695c 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, sm: 4, md: 8 },
        py: 4,
      }}
    >
      {/* Decorative background circles */}
      <Box sx={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -160, right: -100, width: 520, height: 520, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '40%', right: '8%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,137,123,0.12)', pointerEvents: 'none' }} />

      {/* Main Content Container centered */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: 1100,
        }}
      >
        {/* ── Left branding panel ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            pr: 8,
            py: 2,
            gap: 3,
          }}
        >
          {/* Logos */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                p: 0.5,
              }}
            >
              <Box component="img" src={aapppLogo} alt="AAPPP Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                p: 0.5,
              }}
            >
              <Box component="img" src={logoCollidor} alt="Corridor Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ ml: 0.5 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1.1 }}>
                Addis Ababa
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: 1.2 }}>
                PUBLIC PRIORITY PANEL
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', width: 60 }} />

          <Box>
            <Typography
              variant="h4"
              sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2, mb: 2, maxWidth: 420 }}
            >
              Corridor
              <br />
              Building & Rental
              <br />
              Management System
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 380 }}>
              Unified platform for Addis Ababa Corridor Development building
              & office rental operations.
            </Typography>
          </Box>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            {['Building & office rental management', 'Multi-department operations'].map((item) => (
              <Box
                key={item}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  width: 'fit-content',
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ebaaa', flexShrink: 0 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Right login card ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: { xs: '1 1 100%', md: '0 0 440px' },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 420,
              p: { xs: 3, sm: 4.5 },
              borderRadius: 4,
              backgroundColor: '#ffffff',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}
          >
            {/* Card header with logos */}
            <Box sx={{ textAlign: 'center', mb: 3.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={aapppLogo}
                  alt="AAPPP Logo"
                  sx={{
                    width: 62,
                    height: 62,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(26,35,126,0.18))',
                  }}
                />
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ height: 38, my: 'auto', borderColor: '#e2e8f0', borderWidth: 1 }}
                />
                <Box
                  component="img"
                  src={logoCollidor}
                  alt="Corridor Logo"
                  sx={{
                    width: 62,
                    height: 62,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(0,105,92,0.18))',
                  }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Access CBR Portal
              </Typography>
            </Box>

            {/* Error alert */}
            {loginError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {loginError}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Username or Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  error={Boolean(usernameError)}
                  helperText={usernameError}
                  fullWidth
                  autoComplete="username or email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#1a237e' } },
                    '& label.Mui-focused': { color: '#1a237e' },
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  error={Boolean(passwordError)}
                  helperText={passwordError}
                  fullWidth
                  autoComplete="current-password"
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
                          {showPassword
                            ? <VisibilityOff sx={{ fontSize: 20, color: '#94a3b8' }} />
                            : <Visibility sx={{ fontSize: 20, color: '#94a3b8' }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: '#1a237e' } },
                    '& label.Mui-focused': { color: '#1a237e' },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={authLoading}
                  sx={{
                    mt: 0.5,
                    py: 1.4,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #1a237e, #283593)',
                    boxShadow: '0 6px 20px rgba(26,35,126,0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #000051, #1a237e)',
                      boxShadow: '0 8px 24px rgba(26,35,126,0.45)',
                    },
                    '&.Mui-disabled': { opacity: 0.7 },
                  }}
                >
                  {authLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
                </Button>
              </Box>
            </form>

            {/* Demo credentials hint */}
            <Box
              sx={{
                mt: 3,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}
            >

            </Box>

            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#cbd5e1', mt: 3 }}>
              © {new Date().getFullYear()} Addis Ababa City Administration
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};