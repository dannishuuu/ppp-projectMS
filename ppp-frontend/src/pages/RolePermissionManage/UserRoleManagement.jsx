// pages/RolePermissionManage/UserRoleManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Divider,
  InputAdornment,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  Checkbox,
  FormControlLabel,
  Stack,
  Avatar,
  Card,
  CardContent,
  Badge,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Security as RoleIcon,
  AssignmentInd as AssignIcon,
  GroupAdd as BulkAssignIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Layers as ModuleIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import { userRoleService } from '../../services/moduleRolePermissionService/userRoleService';
import { roleService } from '../../services/moduleRolePermissionService/roleService';
import { userService } from '../../services/userServices/userServices';

// Design Theme Tokens consistent with the AAPPP design system
const T = {
  primary: '#1e40af',
  primaryCont: '#1e3a8a',
  secondary: '#0f766e',
  surface: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
};

const UserRoleManagement = () => {
  const { enqueueSnackbar } = useSnackbar();

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: USERS LIST & PAGINATION
  // ──────────────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Map of userId -> array of assigned roles [{ role_id, role_name, role_code, is_system }]
  const [userRolesMap, setUserRolesMap] = useState({});
  const [loadingRolesForUsers, setLoadingRolesForUsers] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: ALL ACTIVE ROLES (FOR ASSIGNMENT MODAL & FILTER)
  // ──────────────────────────────────────────────────────────────────────────
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingAvailableRoles, setLoadingAvailableRoles] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: ASSIGN ROLES MODAL
  // ──────────────────────────────────────────────────────────────────────────
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState(new Set());
  const [initialRoleIds, setInitialRoleIds] = useState(new Set());
  const [modalRoleSearch, setModalRoleSearch] = useState('');
  const [savingAssignments, setSavingAssignments] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: INSPECT PERMISSIONS MODAL
  // ──────────────────────────────────────────────────────────────────────────
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState(null);
  const [userEffectiveData, setUserEffectiveData] = useState(null);
  const [loadingEffectivePermissions, setLoadingEffectivePermissions] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: REMOVE SINGLE ROLE CONFIRMATION
  // ──────────────────────────────────────────────────────────────────────────
  const [removeRoleDialogOpen, setRemoveRoleDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [userForRoleRemoval, setUserForRoleRemoval] = useState(null);
  const [removingRole, setRemovingRole] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // STATE: BULK MULTI-USER ROLE ALLOCATION
  // ──────────────────────────────────────────────────────────────────────────
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkSelectedRoleIds, setBulkSelectedRoleIds] = useState(new Set());
  const [bulkAllocationMode, setBulkAllocationMode] = useState('append'); // 'append' | 'replace'
  const [bulkRoleSearch, setBulkRoleSearch] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // FETCHERS
  // ──────────────────────────────────────────────────────────────────────────

  // Fetch available roles for assignment
  const fetchAvailableRoles = async () => {
    setLoadingAvailableRoles(true);
    try {
      const res = await roleService.getRoles({
        page: 1,
        limit: 200,
        status: 'active',
        sortBy: 'name',
      });
      setAvailableRoles(res.roles || []);
    } catch (err) {
      console.error('Failed to load available roles:', err);
      enqueueSnackbar('Failed to load roles list', { variant: 'error' });
    } finally {
      setLoadingAvailableRoles(false);
    }
  };

  // Fetch users and their assigned roles
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await userService.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        status: statusFilter,
      });

      const userList = res.users || [];
      setUsers(userList);
      setTotalUsers(res.pagination?.total || 0);

      // Load assigned roles for the returned users in parallel
      if (userList.length > 0) {
        setLoadingRolesForUsers(true);
        const rolesMap = {};
        await Promise.all(
          userList.map(async (u) => {
            try {
              const rolesRes = await userRoleService.getUserRoles(u.id);
              const list = Array.isArray(rolesRes)
                ? rolesRes
                : rolesRes.data || rolesRes.roles || [];
              rolesMap[u.id] = list;
            } catch (e) {
              rolesMap[u.id] = [];
            }
          })
        );
        setUserRolesMap(rolesMap);
        setLoadingRolesForUsers(false);
      } else {
        setUserRolesMap({});
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      enqueueSnackbar(err.message || 'Failed to load users list', { variant: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  }, [page, rowsPerPage, searchQuery, statusFilter, enqueueSnackbar]);

  // Initial load
  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS: ASSIGN ROLES MODAL
  // ──────────────────────────────────────────────────────────────────────────

  const handleOpenAssignModal = async (user) => {
    setSelectedUserForAssign(user);
    setModalRoleSearch('');

    // Pre-populate with currently assigned role IDs
    const currentRoles = userRolesMap[user.id] || [];
    const currentIds = new Set(currentRoles.map((r) => r.role_id));
    setSelectedRoleIds(new Set(currentIds));
    setInitialRoleIds(new Set(currentIds));

    setAssignModalOpen(true);

    // Refresh user's roles from backend to be 100% up to date
    try {
      const freshRoles = await userRoleService.getUserRoles(user.id);
      const list = Array.isArray(freshRoles)
        ? freshRoles
        : freshRoles.data || freshRoles.roles || [];
      const freshIds = new Set(list.map((r) => r.role_id));
      setSelectedRoleIds(new Set(freshIds));
      setInitialRoleIds(new Set(freshIds));
      setUserRolesMap((prev) => ({ ...prev, [user.id]: list }));
    } catch (e) {
      console.error('Error refreshing user roles', e);
    }
  };

  const handleToggleRoleSelection = (roleId) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSelectAllRoles = () => {
    setSelectedRoleIds(new Set(availableRoles.map((r) => r.id)));
  };

  const handleClearAllRoles = () => {
    setSelectedRoleIds(new Set());
  };

  const handleResetRoles = () => {
    setSelectedRoleIds(new Set(initialRoleIds));
  };

  const handleSaveAssignments = async () => {
    if (!selectedUserForAssign) return;

    setSavingAssignments(true);
    try {
      const roleIdsArray = Array.from(selectedRoleIds);
      const updated = await userRoleService.assignRolesToUser(
        selectedUserForAssign.id,
        roleIdsArray
      );

      const list = Array.isArray(updated)
        ? updated
        : updated.data || updated.roles || [];

      // Update local state map
      setUserRolesMap((prev) => ({
        ...prev,
        [selectedUserForAssign.id]: list,
      }));

      enqueueSnackbar(
        `Roles updated successfully for ${selectedUserForAssign.first_name || 'user'}!`,
        { variant: 'success' }
      );
      setAssignModalOpen(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update user roles', { variant: 'error' });
    } finally {
      setSavingAssignments(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS: REMOVE ROLE CHIP DIRECTLY
  // ──────────────────────────────────────────────────────────────────────────

  const handleRequestRemoveRole = (user, role) => {
    setUserForRoleRemoval(user);
    setRoleToRemove(role);
    setRemoveRoleDialogOpen(true);
  };

  const handleConfirmRemoveRole = async () => {
    if (!userForRoleRemoval || !roleToRemove) return;

    setRemovingRole(true);
    try {
      await userRoleService.removeRoleFromUser(
        userForRoleRemoval.id,
        roleToRemove.role_id
      );

      // Remove from local userRolesMap
      setUserRolesMap((prev) => {
        const current = prev[userForRoleRemoval.id] || [];
        return {
          ...prev,
          [userForRoleRemoval.id]: current.filter(
            (r) => r.role_id !== roleToRemove.role_id
          ),
        };
      });

      enqueueSnackbar(
        `Role "${roleToRemove.role_name}" removed from ${userForRoleRemoval.first_name || 'user'}`,
        { variant: 'info' }
      );
      setRemoveRoleDialogOpen(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to remove role', { variant: 'error' });
    } finally {
      setRemovingRole(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS: VIEW EFFECTIVE PERMISSIONS
  // ──────────────────────────────────────────────────────────────────────────

  const handleOpenPermissionsInspector = async (user) => {
    setInspectUser(user);
    setUserEffectiveData(null);
    setPermissionsModalOpen(true);
    setLoadingEffectivePermissions(true);

    try {
      const data = await userRoleService.getUserPermissions(user.id);
      setUserEffectiveData(data);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load user permissions', { variant: 'error' });
    } finally {
      setLoadingEffectivePermissions(false);
    }
  };

  // Filtered users by role in UI table
  const displayedUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    if (roleFilter === 'unassigned') {
      return users.filter((u) => {
        const roles = userRolesMap[u.id] || [];
        return roles.length === 0;
      });
    }
    return users.filter((u) => {
      const roles = userRolesMap[u.id] || [];
      return roles.some((r) => r.role_id === roleFilter);
    });
  }, [users, roleFilter, userRolesMap]);

  // Statistics
  const usersWithRolesCount = useMemo(() => {
    return Object.values(userRolesMap).filter((roles) => roles && roles.length > 0).length;
  }, [userRolesMap]);

  // ──────────────────────────────────────────────────────────────────────────
  // MULTI-USER SELECTION LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  const allPageUserIds = useMemo(() => displayedUsers.map((u) => u.id), [displayedUsers]);
  const isAllPageSelected = useMemo(
    () => allPageUserIds.length > 0 && allPageUserIds.every((id) => selectedUserIds.has(id)),
    [allPageUserIds, selectedUserIds]
  );
  const isSomePageSelected = useMemo(
    () => allPageUserIds.some((id) => selectedUserIds.has(id)) && !isAllPageSelected,
    [allPageUserIds, selectedUserIds, isAllPageSelected]
  );

  const handleToggleSelectAllPage = () => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        allPageUserIds.forEach((id) => next.delete(id));
      } else {
        allPageUserIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleClearSelectedUsers = () => {
    setSelectedUserIds(new Set());
  };

  const selectedUsersList = useMemo(() => {
    return users.filter((u) => selectedUserIds.has(u.id));
  }, [users, selectedUserIds]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS: BULK ROLE ALLOCATION
  // ──────────────────────────────────────────────────────────────────────────
  const handleOpenBulkAssignModal = () => {
    if (selectedUserIds.size === 0) {
      enqueueSnackbar('Please select at least one user from the list', { variant: 'warning' });
      return;
    }
    setBulkSelectedRoleIds(new Set());
    setBulkRoleSearch('');
    setBulkAllocationMode('append');
    setBulkAssignModalOpen(true);
  };

  const handleToggleBulkRoleSelection = (roleId) => {
    setBulkSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSelectAllBulkRoles = () => {
    setBulkSelectedRoleIds(new Set(availableRoles.map((r) => r.id)));
  };

  const handleClearAllBulkRoles = () => {
    setBulkSelectedRoleIds(new Set());
  };

  const handleExecuteBulkAllocation = async () => {
    if (selectedUserIds.size === 0) return;
    if (bulkSelectedRoleIds.size === 0) {
      enqueueSnackbar('Please select at least one role to allocate', { variant: 'warning' });
      return;
    }

    setBulkSaving(true);
    const targetUserIds = Array.from(selectedUserIds);
    const chosenRoleIds = Array.from(bulkSelectedRoleIds);
    let successCount = 0;
    let failCount = 0;
    const updatedMap = { ...userRolesMap };

    try {
      await Promise.all(
        targetUserIds.map(async (userId) => {
          try {
            let finalRoleIds = chosenRoleIds;
            if (bulkAllocationMode === 'append') {
              const existingRoles = userRolesMap[userId] || [];
              const existingIds = existingRoles.map((r) => r.role_id);
              finalRoleIds = Array.from(new Set([...existingIds, ...chosenRoleIds]));
            }
            const res = await userRoleService.assignRolesToUser(userId, finalRoleIds);
            const list = Array.isArray(res) ? res : (res.data || res.roles || []);
            updatedMap[userId] = list;
            successCount++;
          } catch (e) {
            failCount++;
            console.error(`Failed to assign roles to user ${userId}:`, e);
          }
        })
      );

      setUserRolesMap(updatedMap);
      if (failCount === 0) {
        enqueueSnackbar(
          `Successfully allocated roles to ${successCount} user${successCount > 1 ? 's' : ''}!`,
          { variant: 'success' }
        );
      } else {
        enqueueSnackbar(
          `Roles allocated to ${successCount} user${successCount > 1 ? 's' : ''} (${failCount} failed).`,
          { variant: 'warning' }
        );
      }
      setBulkAssignModalOpen(false);
      setSelectedUserIds(new Set());
    } catch (err) {
      enqueueSnackbar(err.message || 'Bulk allocation failed', { variant: 'error' });
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* ── Breadcrumbs & Header ── */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.85rem' }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/users/roles-permissions" underline="hover" color="inherit">
          Roles & Permissions
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          User Role Assignment
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em' }}>
            User Role Assignment & PBAC
          </Typography>
          <Typography variant="body2" sx={{ color: T.textSecondary, mt: 0.3 }}>
            Assign dynamic custom roles to users, manage authorization levels, and inspect inherited permissions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {selectedUserIds.size > 0 && (
            <Button
              variant="contained"
              startIcon={<BulkAssignIcon />}
              onClick={handleOpenBulkAssignModal}
              sx={{
                backgroundColor: T.secondary,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 2,
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                '&:hover': { backgroundColor: '#0d655f' },
              }}
            >
              Bulk Allocate ({selectedUserIds.size})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchUsers()}
            disabled={loadingUsers}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderColor: T.border,
              backgroundColor: '#ffffff',
              color: T.textPrimary,
              '&:hover': { backgroundColor: '#f8fafc' },
            }}
          >
            Refresh
          </Button>
          <Button
            component={RouterLink}
            to="/users/roles-permissions"
            variant="contained"
            startIcon={<RoleIcon />}
            sx={{
              backgroundColor: T.primary,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
              '&:hover': { backgroundColor: T.primaryCont },
            }}
          >
            Manage Roles & Matrix
          </Button>
        </Stack>
      </Box>

      {/* ── Stat Summary Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${T.primary}15`, color: T.primary, width: 48, height: 48 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: T.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Total System Users
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: T.textPrimary }}>
                  {totalUsers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${T.secondary}15`, color: T.secondary, width: 48, height: 48 }}>
                <AssignIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: T.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Users With Assigned Roles
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: T.secondary }}>
                  {usersWithRolesCount} <Typography component="span" variant="body2" sx={{ color: T.textSecondary }}>/ {users.length} on page</Typography>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#f59e0b15', color: '#d97706', width: 48, height: 48 }}>
                <ShieldIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: T.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>
                  Available Active Roles
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#b45309' }}>
                  {availableRoles.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Filter & Search Toolbar ── */}
      <Paper sx={{ p: 2, borderRadius: 2.5, mb: 3, border: `1px solid ${T.border}` }} elevation={0}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search user by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: T.textSecondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              select
              size="small"
              label="Role Filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="unassigned">Unassigned (No Roles)</MenuItem>
              {availableRoles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="inactive">Inactive Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Bulk Actions Banner Bar ── */}
      {selectedUserIds.size > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2.5,
            mb: 2.5,
            borderRadius: 2.5,
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            boxShadow: '0 4px 14px rgba(30, 64, 175, 0.08)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={`${selectedUserIds.size} User${selectedUserIds.size > 1 ? 's' : ''} Selected`}
              color="primary"
              sx={{ fontWeight: 800, fontSize: '0.82rem' }}
            />
            <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600 }}>
              Batch allocate dynamic custom roles across all selected user accounts
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearSelectedUsers}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#1e40af',
                borderColor: '#93c5fd',
                backgroundColor: '#ffffff',
                '&:hover': { backgroundColor: '#f8fafc' },
              }}
            >
              Clear Selection
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<BulkAssignIcon />}
              onClick={handleOpenBulkAssignModal}
              sx={{
                backgroundColor: T.primary,
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                '&:hover': { backgroundColor: T.primaryCont },
              }}
            >
              Allocate Roles ({selectedUserIds.size})
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Users & Assigned Roles Table ── */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ py: 1.5, pl: 2 }}>
                <Checkbox
                  color="primary"
                  indeterminate={isSomePageSelected}
                  checked={isAllPageSelected}
                  onChange={handleToggleSelectAllPage}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Contact Info</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Account Status</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Assigned Custom Roles</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingUsers ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" sx={{ color: T.textSecondary, mt: 1 }}>
                    Loading users and assignments...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: T.textSecondary }}>
                  No users found matching current filters.
                </TableCell>
              </TableRow>
            ) : (
              displayedUsers.map((u) => {
                const isUserSelected = selectedUserIds.has(u.id);
                const assignedRoles = userRolesMap[u.id] || [];
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'User';
                const initials = (u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase();

                return (
                  <TableRow
                    key={u.id}
                    hover
                    selected={isUserSelected}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: isUserSelected ? '#f0f7ff !important' : undefined,
                    }}
                  >
                    {/* Multi-Select Checkbox */}
                    <TableCell padding="checkbox" sx={{ pl: 2 }}>
                      <Checkbox
                        color="primary"
                        checked={isUserSelected}
                        onChange={() => handleToggleSelectUser(u.id)}
                        size="small"
                      />
                    </TableCell>

                    {/* User Profile */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={u.avatar_url}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: T.primary,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                            {fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: T.textSecondary }}>
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: T.textPrimary, fontSize: '0.85rem' }}>
                        {u.phone || '—'}
                      </Typography>
                      {u.username && (
                        <Typography variant="caption" sx={{ color: T.textSecondary, fontFamily: 'monospace' }}>
                          @{u.username}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        icon={u.is_active ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
                        label={u.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={u.is_active ? 'success' : 'default'}
                        variant={u.is_active ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>

                    {/* Assigned Custom Roles */}
                    <TableCell sx={{ maxWidth: 360 }}>
                      {loadingRolesForUsers && assignedRoles.length === 0 ? (
                        <CircularProgress size={16} />
                      ) : assignedRoles.length === 0 ? (
                        <Typography variant="caption" sx={{ color: T.textSecondary, fontStyle: 'italic' }}>
                          No roles assigned (limited guest)
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                          {assignedRoles.map((r) => (
                            <Tooltip
                              key={r.role_id}
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                    {r.role_name} ({r.role_code})
                                  </Typography>
                                  {r.role_description && (
                                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                                      {r.role_description}
                                    </Typography>
                                  )}
                                  {r.is_system && (
                                    <Chip label="System Role" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }} />
                                  )}
                                </Box>
                              }
                            >
                              <Chip
                                label={r.role_name}
                                size="small"
                                color={r.is_system ? 'secondary' : 'primary'}
                                variant="outlined"
                                onDelete={() => handleRequestRemoveRole(u, r)}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  backgroundColor: r.is_system ? '#f3e8ff' : '#eff6ff',
                                  borderColor: r.is_system ? '#c084fc' : '#93c5fd',
                                  color: r.is_system ? '#6b21a8' : '#1e40af',
                                  '& .MuiChip-deleteIcon': {
                                    color: r.is_system ? '#6b21a8' : '#1e40af',
                                    fontSize: '0.85rem',
                                    '&:hover': { color: '#dc2626' },
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Assign or replace roles for this user">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AssignIcon fontSize="small" />}
                            onClick={() => handleOpenAssignModal(u)}
                            sx={{
                              backgroundColor: T.primary,
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              fontSize: '0.78rem',
                              px: 1.5,
                              '&:hover': { backgroundColor: T.primaryCont },
                            }}
                          >
                            Assign Roles
                          </Button>
                        </Tooltip>

                        <Tooltip title="Inspect effective module permissions">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPermissionsInspector(u)}
                            sx={{
                              border: `1px solid ${T.border}`,
                              borderRadius: 1.5,
                              color: T.textSecondary,
                              '&:hover': { backgroundColor: '#f1f5f9', color: T.primary },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: ASSIGN ROLES TO USER
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={assignModalOpen}
        onClose={() => !savingAssignments && setAssignModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: T.primary, width: 36, height: 36, fontWeight: 700 }}>
                {(selectedUserForAssign?.first_name?.[0] || 'U').toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Assign Roles to {selectedUserForAssign?.first_name} {selectedUserForAssign?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: T.textSecondary }}>
                  {selectedUserForAssign?.email} &bull; @{selectedUserForAssign?.username}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setAssignModalOpen(false)} disabled={savingAssignments} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            Select the dynamic roles to assign to this user. Permissions granted by all assigned roles are combined
            additively to determine the user&apos;s access across modules and actions.
          </Alert>

          {/* Search roles in modal & quick buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search roles..."
              value={modalRoleSearch}
              onChange={(e) => setModalRoleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: T.textSecondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={handleSelectAllRoles} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Select All
              </Button>
              <Button size="small" variant="text" onClick={handleResetRoles} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Reset
              </Button>
              <Button size="small" variant="text" color="inherit" onClick={handleClearAllRoles} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Clear All
              </Button>
            </Stack>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Available Roles ({selectedRoleIds.size} of {availableRoles.length} selected):
          </Typography>

          {loadingAvailableRoles ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
              <Grid container spacing={1.5}>
                {availableRoles
                  .filter((r) =>
                    modalRoleSearch
                      ? r.name.toLowerCase().includes(modalRoleSearch.toLowerCase()) ||
                        r.code.toLowerCase().includes(modalRoleSearch.toLowerCase())
                      : true
                  )
                  .map((r) => {
                    const isSelected = selectedRoleIds.has(r.id);
                    return (
                      <Grid item xs={12} sm={6} key={r.id}>
                        <Box
                          onClick={() => handleToggleRoleSelection(r.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                            backgroundColor: isSelected ? `${T.primary}0a` : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': {
                              borderColor: T.primary,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleRoleSelection(r.id)}
                              size="small"
                              sx={{ p: 0.3, mt: 0.2 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                                  {r.name}
                                </Typography>
                                {r.is_system && (
                                  <Chip
                                    label="System"
                                    size="small"
                                    color="warning"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                                  />
                                )}
                              </Box>
                              <Chip
                                label={r.code}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  mt: 0.4,
                                  mb: 0.5,
                                }}
                              />
                              {r.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: T.textSecondary,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {r.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setAssignModalOpen(false)} disabled={savingAssignments} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAssignments}
            disabled={savingAssignments}
            sx={{
              backgroundColor: T.primary,
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: T.primaryCont },
            }}
          >
            {savingAssignments ? <CircularProgress size={20} color="inherit" /> : 'Save Role Assignments'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: INSPECT EFFECTIVE USER PERMISSIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ShieldIcon color="primary" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Effective Permissions: {inspectUser?.first_name} {inspectUser?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: T.textSecondary }}>
                  Resolved permissions inherited from all assigned roles
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setPermissionsModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {loadingEffectivePermissions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6, gap: 1.5, alignItems: 'center' }}>
              <CircularProgress size={28} />
              <Typography variant="body2" sx={{ color: T.textSecondary }}>
                Resolving effective permissions...
              </Typography>
            </Box>
          ) : !userEffectiveData ? (
            <Alert severity="warning">Unable to load effective permissions.</Alert>
          ) : (
            <Box>
              {/* Assigned Roles Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Contributing Roles ({userEffectiveData.roles?.length || 0}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(userEffectiveData.roles || []).map((r) => (
                    <Chip
                      key={r.id || r.role_id}
                      label={r.name || r.role_name}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  ))}
                  {(!userEffectiveData.roles || userEffectiveData.roles.length === 0) && (
                    <Typography variant="body2" sx={{ color: T.textSecondary, fontStyle: 'italic' }}>
                      No roles assigned. User has no access permissions.
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Resolved Permissions by Module */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Inherited Capabilities ({userEffectiveData.permissions?.length || 0} permissions):
              </Typography>

              {(!userEffectiveData.permissions || userEffectiveData.permissions.length === 0) ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  This user currently has 0 active permissions. Assign at least one role with permissions to grant system access.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(
                    (userEffectiveData.permissions || []).reduce((acc, p) => {
                      const mod = p.module_name || p.module_code || 'Other';
                      if (!acc[mod]) acc[mod] = [];
                      acc[mod].push(p);
                      return acc;
                    }, {})
                  ).map(([moduleName, perms]) => (
                    <Grid item xs={12} sm={6} key={moduleName}>
                      <Card elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <ModuleIcon fontSize="small" sx={{ color: T.primary }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {moduleName}
                            </Typography>
                            <Chip label={perms.length} size="small" sx={{ height: 20, fontSize: '0.68rem', ml: 'auto' }} />
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {perms.map((p) => (
                              <Chip
                                key={p.id || p.code}
                                label={p.action_name || p.action_code || p.code}
                                size="small"
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: '#f1f5f9',
                                  fontFamily: 'monospace',
                                }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setPermissionsModalOpen(false)} variant="contained" sx={{ backgroundColor: T.primary }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Confirm Role Removal ── */}
      <Dialog open={removeRoleDialogOpen} onClose={() => setRemoveRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to remove role <strong>{roleToRemove?.role_name}</strong> from user{' '}
            <strong>{userForRoleRemoval?.first_name} {userForRoleRemoval?.last_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRemoveRoleDialogOpen(false)} disabled={removingRole}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmRemoveRole} disabled={removingRole}>
            {removingRole ? <CircularProgress size={20} color="inherit" /> : 'Remove Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: BULK ROLE ALLOCATION (MULTIPLE USERS)
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={bulkAssignModalOpen}
        onClose={() => !bulkSaving && setBulkAssignModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: T.primary, width: 38, height: 38 }}>
                <BulkAssignIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Bulk Role Allocation
                </Typography>
                <Typography variant="caption" sx={{ color: T.textSecondary }}>
                  Assigning dynamic custom roles across {selectedUserIds.size} selected accounts
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setBulkAssignModalOpen(false)} disabled={bulkSaving} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Selected Users Chips Preview */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: T.textPrimary }}>
              Target Accounts ({selectedUserIds.size}):
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.8,
                maxHeight: 110,
                overflowY: 'auto',
                p: 1.2,
                backgroundColor: '#f8fafc',
                borderRadius: 2,
                border: `1px solid ${T.border}`,
              }}
            >
              {selectedUsersList.map((u) => (
                <Chip
                  key={u.id}
                  avatar={<Avatar src={u.avatar_url}>{(u.first_name?.[0] || 'U').toUpperCase()}</Avatar>}
                  label={`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, backgroundColor: '#ffffff' }}
                />
              ))}
            </Box>
          </Box>

          {/* Allocation Strategy: Append vs Replace */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: T.textPrimary }}>
              Allocation Mode:
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Paper
                  onClick={() => setBulkAllocationMode('append')}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1.5px solid ${bulkAllocationMode === 'append' ? T.primary : T.border}`,
                    backgroundColor: bulkAllocationMode === 'append' ? `${T.primary}08` : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  elevation={0}
                >
                  <FormControlLabel
                    value="append"
                    control={<Radio checked={bulkAllocationMode === 'append'} size="small" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                          Add to Existing Roles (Recommended)
                        </Typography>
                        <Typography variant="caption" sx={{ color: T.textSecondary, display: 'block' }}>
                          Retains each user&apos;s current roles and adds the chosen roles to their account.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  onClick={() => setBulkAllocationMode('replace')}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1.5px solid ${bulkAllocationMode === 'replace' ? '#f59e0b' : T.border}`,
                    backgroundColor: bulkAllocationMode === 'replace' ? '#fffbeb' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  elevation={0}
                >
                  <FormControlLabel
                    value="replace"
                    control={<Radio checked={bulkAllocationMode === 'replace'} size="small" color="warning" />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                          Replace Existing Roles
                        </Typography>
                        <Typography variant="caption" sx={{ color: T.textSecondary, display: 'block' }}>
                          Overwrites all existing roles on each selected user with strictly the chosen roles.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Search roles in bulk modal & quick buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search roles to allocate..."
              value={bulkRoleSearch}
              onChange={(e) => setBulkRoleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: T.textSecondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={handleSelectAllBulkRoles} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Select All
              </Button>
              <Button size="small" variant="text" color="inherit" onClick={handleClearAllBulkRoles} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Clear All
              </Button>
            </Stack>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Select Roles to Allocate ({bulkSelectedRoleIds.size} selected):
          </Typography>

          <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
            <Grid container spacing={1.5}>
              {availableRoles
                .filter((r) =>
                  bulkRoleSearch
                    ? r.name.toLowerCase().includes(bulkRoleSearch.toLowerCase()) ||
                      r.code.toLowerCase().includes(bulkRoleSearch.toLowerCase())
                    : true
                )
                .map((r) => {
                  const isSelected = bulkSelectedRoleIds.has(r.id);
                  return (
                    <Grid item xs={12} sm={6} key={r.id}>
                      <Box
                        onClick={() => handleToggleBulkRoleSelection(r.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                          backgroundColor: isSelected ? `${T.primary}0a` : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': {
                            borderColor: T.primary,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleBulkRoleSelection(r.id)}
                            size="small"
                            sx={{ p: 0.3, mt: 0.2 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                                {r.name}
                              </Typography>
                              {r.is_system && (
                                <Chip
                                  label="System"
                                  size="small"
                                  color="warning"
                                  sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                                />
                              )}
                            </Box>
                            <Chip
                              label={r.code}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                mt: 0.4,
                                mb: 0.5,
                              }}
                            />
                            {r.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: T.textSecondary,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {r.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setBulkAssignModalOpen(false)} disabled={bulkSaving} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteBulkAllocation}
            disabled={bulkSaving || bulkSelectedRoleIds.size === 0}
            sx={{
              backgroundColor: T.primary,
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: T.primaryCont },
            }}
          >
            {bulkSaving ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Allocating Roles...</span>
              </Stack>
            ) : (
              `Allocate Roles to ${selectedUserIds.size} User${selectedUserIds.size > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRoleManagement;
