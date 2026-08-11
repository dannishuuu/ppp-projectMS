import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  InputBase,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  RestartAlt as ResetIcon,
  Logout as LogoutIcon,
  WarningAmberRounded as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';

export const Header = ({ handleDrawerToggle }) => {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm, resetAllData } = useProjects();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  // User info from backend (snake_case fields)
  const userDisplayName = user?.username || user?.display_name || 'User';
  const userEmail = user?.email || '';
  const userInitials = (user?.username?.[0] || user?.first_name?.[0] || 'U').toUpperCase();
  const userRole = user?.role || (user?.is_active ? 'Active' : 'Inactive');

  const handleOpenProfileMenu = (event) => setProfileAnchorEl(event.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    handleCloseProfileMenu();
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const handleCancelLogout = () => setLogoutDialogOpen(false);

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#ffffff',
        color: '#1e293b',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>

        {/* Left: Mobile toggle & Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              width: { xs: '100%', sm: 320, md: 400 },
              border: '1px solid #e2e8f0',
              '&:focus-within': {
                borderColor: '#1a237e',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 0 2px rgba(26, 35, 126, 0.1)',
              },
            }}
          >
            <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search projects by code, name, developer, authority..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{ fontSize: '0.875rem' }}
            />
          </Box>
        </Box>

        {/* Right: Reset, Notifications, Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>

          <Tooltip title="Reset mock data to initial 58 projects">
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<ResetIcon fontSize="small" />}
              onClick={resetAllData}
              sx={{
                display: { xs: 'none', lg: 'inline-flex' },
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.75rem',
                borderRadius: 2,
              }}
            >
              Reset Mock Data
            </Button>
          </Tooltip>

          <IconButton color="inherit" size="small">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon sx={{ color: '#64748b' }} />
            </Badge>
          </IconButton>

          {/* Profile avatar — opens dropdown */}
          <Box
            onClick={handleOpenProfileMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pl: 1,
              cursor: 'pointer',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
          >
            <Avatar
              src={user?.avatar_url || undefined}
              sx={{ width: 36, height: 36, backgroundColor: '#1a237e', fontSize: '0.9rem', fontWeight: 700 }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                {userDisplayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {userEmail || 'No email'}
              </Typography>
            </Box>
          </Box>

          {/* Profile dropdown */}
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleCloseProfileMenu}
            PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 200, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {userDisplayName}
              </Typography>
              {userEmail && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                  {userEmail}
                </Typography>
              )}
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: '#ef4444' }}>
              <LogoutIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sign Out
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* ── Sign Out Confirmation Dialog ── */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400, width: '100%' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WarningIcon sx={{ color: '#f97316', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Sign Out
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
            Are you sure you want to sign out? You will need to log in again to access the PPP dashboard.
          </Typography>
          <Box sx={{ mt: 2, px: 2, py: 1.2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Signed in as&nbsp;
              <strong style={{ color: '#1a237e' }}>{userDisplayName}</strong>
              &nbsp;·&nbsp;{userRole}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleCancelLogout}
            variant="outlined"
            color="inherit"
            sx={{ borderColor: '#e2e8f0', color: '#475569', fontWeight: 600, borderRadius: 2, flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            startIcon={<LogoutIcon />}
            sx={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              fontWeight: 700,
              borderRadius: 2,
              flex: 1,
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                boxShadow: '0 6px 16px rgba(239,68,68,0.45)',
              },
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};
