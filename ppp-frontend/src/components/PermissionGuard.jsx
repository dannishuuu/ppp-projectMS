// components/PermissionGuard.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { AccessDenied } from '../pages/Errors/AccessDenied';
import { getRequiredPermission } from '../utils/routePermissions';

/**
 * Layout route guard. Renders the matched child route when the signed-in user
 * holds the permission required for the active path (resolved by
 * utils/routePermissions.js); otherwise renders the AccessDenied (403) page
 * in place of the page content — the sidebar and header remain visible.
 *
 * The decision is made against the full permission set fetched by
 * AuthContext (`loadPermissions` → getMyPermissions). While that set is still
 * being resolved, a loading state is shown instead of guessing, so an empty
 * in-flight set is never mistaken for "no access".
 *
 * Paths without a mapped permission stay unrestricted, mirroring the sidebar
 * entries that carry no `permission` field.
 */
export const PermissionGuard = () => {
  const location = useLocation();
  const { hasPermission, permissions, permissionsLoading, isInitialCheckDone } = useAuth();

  const requiredPermission = getRequiredPermission(location.pathname);

  // Wait until AuthContext has resolved the user's assigned permissions:
  //  - before the initial auth check completes, and
  //  - while a fetch is in flight and no permission data exists yet.
  // (During a background refresh with already-loaded data, the current
  // permission set stays in use — no content flash.)
  const isResolvingPermissions =
    !isInitialCheckDone || (permissionsLoading && permissions.size === 0);

  if (isResolvingPermissions) {
    return (
      <Box
        sx={{
          minHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <CircularProgress size={32} sx={{ color: '#1a237e' }} />
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Verifying your access permissions...
        </Typography>
      </Box>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }

  return <Outlet />;
};

export default PermissionGuard;
