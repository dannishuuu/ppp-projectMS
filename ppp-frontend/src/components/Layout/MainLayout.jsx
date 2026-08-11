import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const SIDEBAR_WIDTH = 260;

export const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area — fills remaining width after sidebar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,            // allows flex child to shrink below content size
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top App Header */}
        <Header handleDrawerToggle={handleDrawerToggle} />

        {/* Page Content — full available width with comfortable padding */}
        <Box
          sx={{
            flexGrow: 1,
            pt: 3,
            pb: 4,
            px: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
