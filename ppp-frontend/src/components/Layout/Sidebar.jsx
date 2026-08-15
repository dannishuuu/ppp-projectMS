import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
  Collapse,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FormatListNumbered as ListIcon,
  AddCircle as AddIcon,
  Folder as ProjectIcon,
  ExpandLess,
  ExpandMore,
  People as UsersIcon,
  PersonAdd as AddUserIcon,
  Groups as UsersListIcon,
  Business as OrganizationIcon,
  Category as CategoryIcon,
  AttachMoney as CurrencyIcon,
  AssignmentTurnedIn as StatusIcon,
  Architecture as FoundationIcon,
  Description as ProposalIcon,
  Tag as SequenceIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import aapppLogo from '../../assets/AAPPP.png';

const DRAWER_WIDTH = 270;

export const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjects();
  const { user } = useAuth();

  const [openMenu, setOpenMenu] = useState(
    location.pathname.startsWith('/projects') && !location.pathname.startsWith('/projects/tracking-types') ? 'projects' :
    location.pathname.startsWith('/users') ? 'users' :
    location.pathname.startsWith('/organization') && !location.pathname.startsWith('/organization-types') ? 'organizations' :
    location.pathname.startsWith('/currencies') || location.pathname.startsWith('/proposal-statuses') || location.pathname.startsWith('/organization-types') || location.pathname.startsWith('/project-categories') || location.pathname.startsWith('/project-statuses') || location.pathname.startsWith('/projects/tracking-types') ? 'foundation' :
    location.pathname.startsWith('/document-sequences') ? 'docmgmt' :
    null
  );

  const handleMenuToggle = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const isMenuOpen = (menu) => openMenu === menu;

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) handleDrawerToggle();
  };

  const projectSubItems = [
    {
      text: 'Projects List',
      icon: <ListIcon />,
      path: '/projects',
      badge: projects?.length || 0,
    },
    {
      text: 'Add New Project',
      icon: <AddIcon />,
      path: '/projects/new',
    },
    {
      text: 'Project Proposals',
      icon: <ProposalIcon />,
      path: '/projects/proposals',
    },
    {
      text: 'Proposal Reviewers',
      icon: <UsersIcon />,
      path: '/projects/reviews',
    },
  ];

  const userSubItems = [
    {
      text: 'Users List',
      icon: <UsersListIcon />,
      path: '/users/list',
    },
    {
      text: 'Add New User',
      icon: <AddUserIcon />,
      path: '/users/new',
    },
  ];

  const orgTypeSubItems = [
    {
      text: 'Organizations List',
      icon: <OrganizationIcon />,
      path: '/organizations',
    },
    {
      text: 'New Organization',
      icon: <AddIcon />,
      path: '/organizations/new',
    },
  ];

  const foundationSubItems = [
    {
      text: 'Organization Types',
      icon: <CategoryIcon />,
      path: '/organization-types',
    },
    {
      text: 'Tracking Types',
      icon: <CategoryIcon />,
      path: '/projects/tracking-types',
    },
    {
      text: 'Project Categories',
      icon: <CategoryIcon />,
      path: '/project-categories',
    },
    {
      text: 'Project Statuses',
      icon: <StatusIcon />,
      path: '/project-statuses',
    },
    {
      text: 'Currencies',
      icon: <CurrencyIcon />,
      path: '/currencies',
    },
    {
      text: 'Proposal Statuses',
      icon: <StatusIcon />,
      path: '/proposal-statuses',
    },
  ];

  const docMgmtSubItems = [
    {
      text: 'Document Seq',
      icon: <SequenceIcon />,
      path: '/document-sequences',
    },
  ];

  const isDashboardActive = location.pathname === '/';
  const isProjectsGroupActive = location.pathname.startsWith('/projects') && !location.pathname.startsWith('/projects/tracking-types') && !location.pathname.startsWith('/project-categories');
  const isUsersGroupActive = location.pathname.startsWith('/users');
  const isOrgTypesGroupActive = location.pathname.startsWith('/organization') && !location.pathname.startsWith('/organization-types'); // checks org pages
  const isOrgTypesTabActive = false; // Organization Types moved to Foundation
  const isOrgTypesMenuGroupActive = isOrgTypesGroupActive || isOrgTypesTabActive;
  const isFoundationGroupActive = location.pathname.startsWith('/currencies') || location.pathname.startsWith('/proposal-statuses') || location.pathname.startsWith('/organization-types') || location.pathname.startsWith('/project-categories') || location.pathname.startsWith('/project-statuses') || location.pathname.startsWith('/projects/tracking-types');
  const isDocMgmtGroupActive = location.pathname.startsWith('/document-sequences');

  const getUserDisplayName = () => {
    if (!user) return 'System Admin';
    return user.username || user.display_name || user.email || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.slice(0, 2).toUpperCase();
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRight: '1px solid #1e293b',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5,
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={aapppLogo}
            alt="AAPPP Logo"
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#ffffff', letterSpacing: '-0.01em' }}>
            PPP Portal
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', noWrap: true }}>
            Addis Ababa City Admin
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b', mx: 2 }} />

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, px: 2, py: 2, overflowY: 'auto' }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.68rem',
          }}
        >
          Navigation
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>

          {/* Dashboard */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigate('/')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isDashboardActive ? '#4f46e5' : 'transparent',
                color: isDashboardActive ? '#ffffff' : '#cbd5e1',
                boxShadow: isDashboardActive ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isDashboardActive ? '#4338ca' : 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDashboardActive ? '#ffffff' : '#94a3b8', minWidth: 36 }}>
                <DashboardIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isDashboardActive ? 600 : 500 }}
              />
            </ListItemButton>
          </ListItem>

          {/* Projects Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('projects')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isProjectsGroupActive && !isMenuOpen('projects') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isProjectsGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isProjectsGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <ProjectIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Projects"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isProjectsGroupActive ? 600 : 500 }}
              />
              {isMenuOpen('projects') ? (
                <ExpandLess sx={{ color: '#64748b', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={isMenuOpen('projects')} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {projectSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                          color: isActive ? '#818cf8' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#818cf8' : '#64748b', minWidth: 32 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 17 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}
                        />
                        {item.badge !== undefined && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.68rem',
                              backgroundColor: isActive ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>

          {/* Organization Types Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('organizations')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isOrgTypesMenuGroupActive && !isMenuOpen('organizations') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isOrgTypesMenuGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isOrgTypesMenuGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <OrganizationIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Organizations"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isOrgTypesMenuGroupActive ? 600 : 500 }}
              />
              {isMenuOpen('organizations') ? (
                <ExpandLess sx={{ color: '#64748b', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={isMenuOpen('organizations')} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {orgTypeSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                          color: isActive ? '#818cf8' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#818cf8' : '#64748b', minWidth: 32 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 17 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>

        </List>

        {/* Foundation Section Label */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 3,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.68rem',
          }}
        >
          Foundation
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Foundation Settings Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('foundation')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isFoundationGroupActive && !isMenuOpen('foundation') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isFoundationGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isFoundationGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <FoundationIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Foundation Settings"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isFoundationGroupActive ? 600 : 500 }}
              />
              {isMenuOpen('foundation') ? (
                <ExpandLess sx={{ color: '#64748b', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={isMenuOpen('foundation')} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {foundationSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                          color: isActive ? '#818cf8' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#818cf8' : '#64748b', minWidth: 32 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 17 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>
        </List>

        {/* Document Management Section Label */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 3,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.68rem',
          }}
        >
          Document Management
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Document Management Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('docmgmt')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isDocMgmtGroupActive && !isMenuOpen('docmgmt') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isDocMgmtGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDocMgmtGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <SequenceIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Document Mngt"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isDocMgmtGroupActive ? 600 : 500 }}
              />
              {isMenuOpen('docmgmt') ? (
                <ExpandLess sx={{ color: '#64748b', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={isMenuOpen('docmgmt')} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {docMgmtSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                          color: isActive ? '#818cf8' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#818cf8' : '#64748b', minWidth: 32 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 17 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>
        </List>

        {/* Administration Section Label */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 3,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.68rem',
          }}
        >
          Administration
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* User Management Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('users')}
              sx={{
                borderRadius: 2.25,
                py: 1.1,
                px: 1.75,
                backgroundColor: isUsersGroupActive && !isMenuOpen('users') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isUsersGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                },
              }}
            >
              <ListItemIcon sx={{ color: isUsersGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <UsersIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="User Management"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isUsersGroupActive ? 600 : 500 }}
              />
              {isMenuOpen('users') ? (
                <ExpandLess sx={{ color: '#64748b', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              )}
            </ListItemButton>

            <Collapse in={isMenuOpen('users')} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                {userSubItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                          color: isActive ? '#818cf8' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#818cf8' : '#64748b', minWidth: 32 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 17 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>
        </List>
      </Box>

      {/* User / System Info Footer Card */}
      <Box sx={{ p: 2, m: 2, mt: 0, borderRadius: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid #1e293b' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, backgroundColor: '#4f46e5', fontSize: '0.8rem', fontWeight: 700 }}>
            {getUserInitials()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getUserDisplayName()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                Online • Active
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
