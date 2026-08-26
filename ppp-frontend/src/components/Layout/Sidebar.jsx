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
  InputBase,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FormatListNumbered as ListIcon,
  AddCircle as AddIcon,
  Folder as ProjectIcon,
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
  Search as SearchIcon,
  Public as GeographicIcon,
  Apartment as BuildingTypeIcon,
  Store as ShopServiceIcon,
  Schedule as TimingIcon,
  ReceiptLong as RentalTypeIcon,
  Straighten as AreaUnitIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import aapppLogo from '../../assets/AAPPP.png';

const DRAWER_WIDTH = 275;

export const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjects();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');

  const [openMenu, setOpenMenu] = useState(
    location.pathname.startsWith('/projects') && !location.pathname.startsWith('/projects/tracking-types') ? 'projects' :
    location.pathname.startsWith('/users') ? 'users' :
    location.pathname.startsWith('/organization') && !location.pathname.startsWith('/organization-types') ? 'organizations' :
    location.pathname.startsWith('/currencies') || location.pathname.startsWith('/proposal-statuses') || location.pathname.startsWith('/organization-types') || location.pathname.startsWith('/project-categories') || location.pathname.startsWith('/project-statuses') || location.pathname.startsWith('/projects/tracking-types') || location.pathname.startsWith('/foundation/') ? 'foundation' :
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
    { text: 'Projects List', icon: <ListIcon />, path: '/projects', badge: projects?.length || 0 },
    { text: 'Add New Project', icon: <AddIcon />, path: '/projects/new' },
    { text: 'Project Proposals', icon: <ProposalIcon />, path: '/projects/proposals' },
    { text: 'Proposal Reviewers', icon: <UsersIcon />, path: '/projects/reviews' },
  ];

  const userSubItems = [
    { text: 'Users List', icon: <UsersListIcon />, path: '/users/list' },
    { text: 'Add New User', icon: <AddUserIcon />, path: '/users/new' },
  ];

  const orgSubItems = [
    { text: 'Organizations List', icon: <OrganizationIcon />, path: '/organizations' },
    { text: 'New Organization', icon: <AddIcon />, path: '/organizations/new' },
  ];

  const foundationSubItems = [
    { text: 'Organization Types', icon: <CategoryIcon />, path: '/organization-types' },
    { text: 'Tracking Types', icon: <CategoryIcon />, path: '/projects/tracking-types' },
    { text: 'Project Categories', icon: <CategoryIcon />, path: '/project-categories' },
    { text: 'Project Statuses', icon: <StatusIcon />, path: '/project-statuses' },
    { text: 'Currencies', icon: <CurrencyIcon />, path: '/currencies' },
    { text: 'Proposal Statuses', icon: <StatusIcon />, path: '/proposal-statuses' },
    { text: 'Geographic Mngt', icon: <GeographicIcon />, path: '/foundation/geographical' },
    { text: 'Building Types', icon: <BuildingTypeIcon />, path: '/foundation/building-types' },
    { text: 'Shop/Service Types', icon: <ShopServiceIcon />, path: '/foundation/shop-service-types' },
    { text: 'Payment Timings', icon: <TimingIcon />, path: '/foundation/payment-timings' },
    { text: 'Rental Payment Types', icon: <RentalTypeIcon />, path: '/foundation/rental-payment-types' },
    { text: 'Area Units', icon: <AreaUnitIcon />, path: '/foundation/area-units' },
  ];

  const docMgmtSubItems = [
    { text: 'Document Seq', icon: <SequenceIcon />, path: '/document-sequences' },
  ];

  // Active checks
  const isDashboardActive = location.pathname === '/';
  const isProjectsGroupActive = location.pathname.startsWith('/projects') && !location.pathname.startsWith('/projects/tracking-types') && !location.pathname.startsWith('/project-categories');
  const isUsersGroupActive = location.pathname.startsWith('/users');
  const isOrgGroupActive = location.pathname.startsWith('/organization') && !location.pathname.startsWith('/organization-types');
  const isFoundationGroupActive = location.pathname.startsWith('/currencies') || location.pathname.startsWith('/proposal-statuses') || location.pathname.startsWith('/organization-types') || location.pathname.startsWith('/project-categories') || location.pathname.startsWith('/project-statuses') || location.pathname.startsWith('/projects/tracking-types') || location.pathname.startsWith('/payment-timings') || location.pathname.startsWith('/rental-payment-types') || location.pathname.startsWith('/area-units') || location.pathname.startsWith('/foundation/');
  const isDocMgmtGroupActive = location.pathname.startsWith('/document-sequences');

  const getUserDisplayName = () => {
    if (!user) return 'System Admin';
    return user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user.username || user.display_name || user.email || 'Admin');
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filterSubItems = (items) => {
    if (!searchQuery) return items;
    return items.filter((item) => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0b0f19',
        color: '#f8fafc',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(11, 15, 25, 0) 100%)',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.6,
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Box
            component="img"
            src={aapppLogo}
            alt="AAPPP Logo"
            sx={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
        </Box>

        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              fontSize: '0.95rem',
            }}
          >
            PPP & CBR Portal
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#818cf8',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'block',
              mt: 0.2,
            }}
          >
            Addis Ababa City
          </Typography>
        </Box>
      </Box>

      {/* Quick Filter Search */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.7,
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'all 0.2s ease',
            '&:focus-within': {
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
            },
          }}
        >
          <SearchIcon sx={{ color: '#64748b', fontSize: 16 }} />
          <InputBase
            placeholder="Quick search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              color: '#f8fafc',
              fontSize: '0.78rem',
              width: '100%',
              '& input::placeholder': { color: '#64748b', opacity: 1 },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', mx: 2 }} />

      {/* Navigation Links Scroll Container */}
      <Box
        sx={{
          flexGrow: 1,
          px: 2,
          py: 2,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(99, 102, 241, 0.4)' },
        }}
      >

        {/* SECTION: MAIN MENU */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
          }}
        >
          Main Navigation
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>

          {/* Dashboard */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigate('/')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                position: 'relative',
                backgroundColor: isDashboardActive ? '#4f46e5' : 'transparent',
                color: isDashboardActive ? '#ffffff' : '#cbd5e1',
                boxShadow: isDashboardActive ? '0 6px 20px rgba(79, 70, 229, 0.4)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: isDashboardActive ? '#4338ca' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDashboardActive ? '#ffffff' : '#94a3b8', minWidth: 36 }}>
                <DashboardIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isDashboardActive ? 700 : 500 }}
              />
            </ListItemButton>
          </ListItem>

          {/* Projects Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('projects')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                backgroundColor: isProjectsGroupActive && !isMenuOpen('projects') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isProjectsGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isProjectsGroupActive ? '3px solid #818cf8' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isProjectsGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <ProjectIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Projects"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isProjectsGroupActive ? 700 : 500 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen('projects') ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
            </ListItemButton>

            <Collapse in={isMenuOpen('projects')} timeout="auto" unmountOnExit>
              <List
                disablePadding
                sx={{
                  ml: 2.2,
                  pl: 1.5,
                  pt: 0.6,
                  pb: 0.6,
                  borderLeft: '1.5px dashed rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                {filterSubItems(projectSubItems).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.85,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          color: isActive ? '#a5b4fc' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : '#64748b', minWidth: 30 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}
                        />
                        {item.badge !== undefined && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              backgroundColor: isActive ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
                              color: '#ffffff',
                              fontWeight: 800,
                              borderRadius: '6px',
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

          {/* Organizations Group */}
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('organizations')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                backgroundColor: isOrgGroupActive && !isMenuOpen('organizations') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isOrgGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isOrgGroupActive ? '3px solid #818cf8' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isOrgGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <OrganizationIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Organizations"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isOrgGroupActive ? 700 : 500 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen('organizations') ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
            </ListItemButton>

            <Collapse in={isMenuOpen('organizations')} timeout="auto" unmountOnExit>
              <List
                disablePadding
                sx={{
                  ml: 2.2,
                  pl: 1.5,
                  pt: 0.6,
                  pb: 0.6,
                  borderLeft: '1.5px dashed rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                {filterSubItems(orgSubItems).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.85,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          color: isActive ? '#a5b4fc' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : '#64748b', minWidth: 30 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>

        </List>

        {/* SECTION: FOUNDATION */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 2.8,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
          }}
        >
          Foundation & Settings
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('foundation')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                backgroundColor: isFoundationGroupActive && !isMenuOpen('foundation') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isFoundationGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isFoundationGroupActive ? '3px solid #818cf8' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isFoundationGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <FoundationIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Foundation ⚙️"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isFoundationGroupActive ? 700 : 500 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen('foundation') ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
            </ListItemButton>

            <Collapse in={isMenuOpen('foundation')} timeout="auto" unmountOnExit>
              <List
                disablePadding
                sx={{
                  ml: 2.2,
                  pl: 1.5,
                  pt: 0.6,
                  pb: 0.6,
                  borderLeft: '1.5px dashed rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                {filterSubItems(foundationSubItems).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.85,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          color: isActive ? '#a5b4fc' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : '#64748b', minWidth: 30 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>
        </List>

        {/* SECTION: DOCUMENT MANAGEMENT */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 2.8,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
          }}
        >
          Document Management
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('docmgmt')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                backgroundColor: isDocMgmtGroupActive && !isMenuOpen('docmgmt') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isDocMgmtGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isDocMgmtGroupActive ? '3px solid #818cf8' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isDocMgmtGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <SequenceIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Document Mngt"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isDocMgmtGroupActive ? 700 : 500 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen('docmgmt') ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
            </ListItemButton>

            <Collapse in={isMenuOpen('docmgmt')} timeout="auto" unmountOnExit>
              <List
                disablePadding
                sx={{
                  ml: 2.2,
                  pl: 1.5,
                  pt: 0.6,
                  pb: 0.6,
                  borderLeft: '1.5px dashed rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                {filterSubItems(docMgmtSubItems).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.85,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          color: isActive ? '#a5b4fc' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : '#64748b', minWidth: 30 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </ListItem>
        </List>

        {/* SECTION: ADMINISTRATION */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mt: 2.8,
            mb: 1,
            display: 'block',
            color: '#64748b',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.65rem',
          }}
        >
          Administration
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <ListItemButton
              onClick={() => handleMenuToggle('users')}
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                backgroundColor: isUsersGroupActive && !isMenuOpen('users') ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: isUsersGroupActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: isUsersGroupActive ? '3px solid #818cf8' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: isUsersGroupActive ? '#818cf8' : '#94a3b8', minWidth: 36 }}>
                <UsersIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="User Management"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isUsersGroupActive ? 700 : 500 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen('users') ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ExpandMore sx={{ color: '#64748b', fontSize: 18 }} />
              </Box>
            </ListItemButton>

            <Collapse in={isMenuOpen('users')} timeout="auto" unmountOnExit>
              <List
                disablePadding
                sx={{
                  ml: 2.2,
                  pl: 1.5,
                  pt: 0.6,
                  pb: 0.6,
                  borderLeft: '1.5px dashed rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                {filterSubItems(userSubItems).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.85,
                          px: 1.5,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                          color: isActive ? '#a5b4fc' : '#94a3b8',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : '#64748b', minWidth: 30 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: 16 } })}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: isActive ? 700 : 500 }}
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

      {/* User Info Footer Card with Glassmorphic Accent */}
      <Box
        sx={{
          p: 1.75,
          m: 2,
          mt: 1,
          borderRadius: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 800,
              boxShadow: '0 3px 8px rgba(79, 70, 229, 0.35)',
            }}
          >
            {getUserInitials()}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#f8fafc',
                fontSize: '0.825rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {getUserDisplayName()}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
                Online Session
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
