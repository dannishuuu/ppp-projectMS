// pages/RolePermissionManage/ModuleRoleManagement.jsx
import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Security as RoleIcon,
  Layers as ModuleIcon,
  FlashOn as ActionIcon,
  VpnKey as PermissionIcon,
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as AutoGenIcon,
  VerifiedUser as SystemIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import {
  roleService,
  moduleService,
  actionService,
  permissionService,
} from '../../services/moduleRolePermissionService';

/* ── Design Tokens ────────────────────────────────────────────────────────── */
const T = {
  primary: '#1e40af',
  primaryCont: '#1d4ed8',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
};

export const ModuleRoleManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // Active Tab: 0 = Roles, 1 = Modules, 2 = Actions, 3 = Permissions
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 0: ROLES STATE & HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */
  const [roles, setRoles] = useState([]);
  const [rolePage, setRolePage] = useState(0);
  const [roleRowsPerPage, setRoleRowsPerPage] = useState(10);
  const [roleTotal, setRoleTotal] = useState(0);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleStatus, setRoleStatus] = useState('all');

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [roleFormSaving, setRoleFormSaving] = useState(false);

  const [matrixModules, setMatrixModules] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deletingRole, setDeletingRole] = useState(false);

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 1: MODULES STATE & HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */
  const [modulesList, setModulesList] = useState([]);
  const [modulePage, setModulePage] = useState(0);
  const [moduleRowsPerPage, setModuleRowsPerPage] = useState(10);
  const [moduleTotal, setModuleTotal] = useState(0);
  const [moduleSearch, setModuleSearch] = useState('');

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleDialogMode, setModuleDialogMode] = useState('create');
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [moduleFormSaving, setModuleFormSaving] = useState(false);

  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [deletingModule, setDeletingModule] = useState(false);

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 2: ACTIONS STATE & HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */
  const [actionsList, setActionsList] = useState([]);
  const [actionPage, setActionPage] = useState(0);
  const [actionRowsPerPage, setActionRowsPerPage] = useState(10);
  const [actionTotal, setActionTotal] = useState(0);
  const [actionSearch, setActionSearch] = useState('');

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionDialogMode, setActionDialogMode] = useState('create');
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionForm, setActionForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [actionFormSaving, setActionFormSaving] = useState(false);

  const [deleteActionDialogOpen, setDeleteActionDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [deletingAction, setDeletingAction] = useState(false);

  /* ══════════════════════════════════════════════════════════════════════════
     TAB 3: PERMISSIONS STATE & HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */
  const [permissionsList, setPermissionsList] = useState([]);
  const [permPage, setPermPage] = useState(0);
  const [permRowsPerPage, setPermRowsPerPage] = useState(15);
  const [permTotal, setPermTotal] = useState(0);
  const [permSearch, setPermSearch] = useState('');
  const [permModuleFilter, setPermModuleFilter] = useState('');

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchModuleId, setBatchModuleId] = useState('');
  const [batchSelectedActionIds, setBatchSelectedActionIds] = useState(new Set());
  const [batchGenerating, setBatchGenerating] = useState(false);

  /* ──────────────────────────────────────────────────────────────────────────
     FETCHERS
  ────────────────────────────────────────────────────────────────────────── */

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await roleService.getRoles({
        page: rolePage + 1,
        limit: roleRowsPerPage,
        search: roleSearch,
        status: roleStatus,
      });
      setRoles(res.roles || []);
      setRoleTotal(res.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load roles', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await moduleService.getModules({
        page: modulePage + 1,
        limit: moduleRowsPerPage,
        search: moduleSearch,
      });
      setModulesList(res.modules || []);
      setModuleTotal(res.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load modules', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await actionService.getActions({
        page: actionPage + 1,
        limit: actionRowsPerPage,
        search: actionSearch,
      });
      setActionsList(res.actions || []);
      setActionTotal(res.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load actions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await permissionService.getPermissions({
        page: permPage + 1,
        limit: permRowsPerPage,
        search: permSearch,
        moduleId: permModuleFilter || null,
      });
      setPermissionsList(res.permissions || []);
      setPermTotal(res.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load permissions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrix = async () => {
    setMatrixLoading(true);
    try {
      const data = await permissionService.getPermissionMatrix();
      setMatrixModules(Array.isArray(data) ? data : []);
    } catch (err) {
      enqueueSnackbar('Failed to load permission matrix', { variant: 'warning' });
    } finally {
      setMatrixLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     EFFECTS
  ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (activeTab === 0) fetchRoles();
    if (activeTab === 1) fetchModules();
    if (activeTab === 2) fetchActions();
    if (activeTab === 3) {
      fetchPermissions();
      if (modulesList.length === 0) fetchModules();
    }
  }, [
    activeTab,
    rolePage,
    roleRowsPerPage,
    roleStatus,
    modulePage,
    moduleRowsPerPage,
    actionPage,
    actionRowsPerPage,
    permPage,
    permRowsPerPage,
    permModuleFilter,
  ]);

  // Debounced search handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 0) {
        setRolePage(0);
        fetchRoles();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [roleSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 1) {
        setModulePage(0);
        fetchModules();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [moduleSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 2) {
        setActionPage(0);
        fetchActions();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [actionSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 3) {
        setPermPage(0);
        fetchPermissions();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [permSearch]);

  /* ──────────────────────────────────────────────────────────────────────────
     ROLE HANDLERS
  ────────────────────────────────────────────────────────────────────────── */
  const handleOpenCreateRole = async () => {
    setRoleDialogMode('create');
    setSelectedRole(null);
    setRoleForm({ name: '', code: '', description: '', is_active: true });
    setSelectedPermissionIds(new Set());
    setRoleDialogOpen(true);
    await fetchMatrix();
  };

  const handleOpenEditRole = async (role) => {
    setRoleDialogMode('edit');
    setSelectedRole(role);
    setRoleForm({
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      is_active: role.is_active,
    });
    setRoleDialogOpen(true);
    await fetchMatrix();

    try {
      const fullRole = await roleService.getRoleById(role.id);
      const permIds = new Set(
        (fullRole.permissions || []).map((p) => p.permission_id || p.id).filter(Boolean)
      );
      setSelectedPermissionIds(permIds);
    } catch (err) {
      enqueueSnackbar('Could not load assigned permissions', { variant: 'warning' });
    }
  };

  const handleTogglePermission = (permId) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleToggleModuleAll = (modulePerms, shouldSelect) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      modulePerms.forEach((p) => {
        if (shouldSelect) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const handleSelectAllMatrix = (shouldSelect) => {
    if (!shouldSelect) {
      setSelectedPermissionIds(new Set());
      return;
    }
    const allIds = new Set();
    matrixModules.forEach((mod) => {
      (mod.permissions || []).forEach((p) => allIds.add(p.id));
    });
    setSelectedPermissionIds(allIds);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      enqueueSnackbar('Role Name is required', { variant: 'warning' });
      return;
    }
    if (roleDialogMode === 'create' && !roleForm.code.trim()) {
      enqueueSnackbar('Role Code is required', { variant: 'warning' });
      return;
    }

    setRoleFormSaving(true);
    try {
      const permIdsArray = Array.from(selectedPermissionIds);
      if (roleDialogMode === 'create') {
        await roleService.createRole({
          name: roleForm.name,
          code: roleForm.code,
          description: roleForm.description,
          permissionIds: permIdsArray,
        });
        enqueueSnackbar('Custom role created successfully!', { variant: 'success' });
      } else {
        await roleService.updateRole(selectedRole.id, {
          name: roleForm.name,
          description: roleForm.description,
          permissionIds: permIdsArray,
        });
        enqueueSnackbar('Role updated successfully!', { variant: 'success' });
      }
      setRoleDialogOpen(false);
      fetchRoles();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to save role', { variant: 'error' });
    } finally {
      setRoleFormSaving(false);
    }
  };

  const handleToggleRoleStatus = async (role) => {
    try {
      await roleService.toggleRoleStatus(role.id);
      enqueueSnackbar(`Role "${role.name}" status updated`, { variant: 'info' });
      fetchRoles();
    } catch (err) {
      enqueueSnackbar(err.message || 'Status toggle failed', { variant: 'error' });
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeletingRole(true);
    try {
      await roleService.deleteRole(roleToDelete.id);
      enqueueSnackbar(`Role "${roleToDelete.name}" deleted successfully`, { variant: 'success' });
      setDeleteRoleDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      enqueueSnackbar(err.message || 'Cannot delete role', { variant: 'error' });
    } finally {
      setDeletingRole(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     MODULE HANDLERS
  ────────────────────────────────────────────────────────────────────────── */
  const handleOpenCreateModule = () => {
    setModuleDialogMode('create');
    setSelectedModule(null);
    setModuleForm({ name: '', code: '', description: '', is_active: true });
    setModuleDialogOpen(true);
  };

  const handleOpenEditModule = (mod) => {
    setModuleDialogMode('edit');
    setSelectedModule(mod);
    setModuleForm({
      name: mod.name || '',
      code: mod.code || '',
      description: mod.description || '',
      is_active: mod.is_active,
    });
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.name.trim()) {
      enqueueSnackbar('Module name is required', { variant: 'warning' });
      return;
    }
    if (moduleDialogMode === 'create' && !moduleForm.code.trim()) {
      enqueueSnackbar('Module code is required', { variant: 'warning' });
      return;
    }

    setModuleFormSaving(true);
    try {
      if (moduleDialogMode === 'create') {
        await moduleService.createModule({
          name: moduleForm.name,
          code: moduleForm.code,
          description: moduleForm.description,
        });
        enqueueSnackbar('Module created successfully!', { variant: 'success' });
      } else {
        await moduleService.updateModule(selectedModule.id, {
          name: moduleForm.name,
          description: moduleForm.description,
        });
        enqueueSnackbar('Module updated successfully!', { variant: 'success' });
      }
      setModuleDialogOpen(false);
      fetchModules();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to save module', { variant: 'error' });
    } finally {
      setModuleFormSaving(false);
    }
  };

  const handleToggleModuleStatus = async (mod) => {
    try {
      await moduleService.toggleModuleStatus(mod.id);
      enqueueSnackbar(`Module "${mod.name}" status updated`, { variant: 'info' });
      fetchModules();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to toggle status', { variant: 'error' });
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    setDeletingModule(true);
    try {
      await moduleService.deleteModule(moduleToDelete.id);
      enqueueSnackbar(`Module "${moduleToDelete.name}" deleted successfully`, { variant: 'success' });
      setDeleteModuleDialogOpen(false);
      setModuleToDelete(null);
      fetchModules();
    } catch (err) {
      enqueueSnackbar(err.message || 'Cannot delete module', { variant: 'error' });
    } finally {
      setDeletingModule(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     ACTION HANDLERS (TAB 2)
  ────────────────────────────────────────────────────────────────────────── */
  const handleOpenCreateAction = () => {
    setActionDialogMode('create');
    setSelectedAction(null);
    setActionForm({ name: '', code: '', description: '', is_active: true });
    setActionDialogOpen(true);
  };

  const handleOpenEditAction = (act) => {
    setActionDialogMode('edit');
    setSelectedAction(act);
    setActionForm({
      name: act.name || '',
      code: act.code || '',
      description: act.description || '',
      is_active: act.is_active,
    });
    setActionDialogOpen(true);
  };

  const handleSaveAction = async () => {
    if (!actionForm.name.trim()) {
      enqueueSnackbar('Action name is required', { variant: 'warning' });
      return;
    }
    if (actionDialogMode === 'create' && !actionForm.code.trim()) {
      enqueueSnackbar('Action code is required', { variant: 'warning' });
      return;
    }

    setActionFormSaving(true);
    try {
      if (actionDialogMode === 'create') {
        await actionService.createAction({
          name: actionForm.name,
          code: actionForm.code,
          description: actionForm.description,
        });
        enqueueSnackbar('Action created successfully!', { variant: 'success' });
      } else {
        await actionService.updateAction(selectedAction.id, {
          name: actionForm.name,
          description: actionForm.description,
        });
        enqueueSnackbar('Action updated successfully!', { variant: 'success' });
      }
      setActionDialogOpen(false);
      fetchActions();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to save action', { variant: 'error' });
    } finally {
      setActionFormSaving(false);
    }
  };

  const handleToggleActionStatus = async (act) => {
    try {
      await actionService.toggleActionStatus(act.id);
      enqueueSnackbar(`Action "${act.name}" status updated`, { variant: 'info' });
      fetchActions();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to toggle status', { variant: 'error' });
    }
  };

  const handleDeleteAction = async () => {
    if (!actionToDelete) return;
    setDeletingAction(true);
    try {
      await actionService.deleteAction(actionToDelete.id);
      enqueueSnackbar(`Action "${actionToDelete.name}" deleted successfully`, { variant: 'success' });
      setDeleteActionDialogOpen(false);
      setActionToDelete(null);
      fetchActions();
    } catch (err) {
      enqueueSnackbar(err.message || 'Cannot delete action', { variant: 'error' });
    } finally {
      setDeletingAction(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     BATCH GENERATOR HANDLERS (TAB 3)
  ────────────────────────────────────────────────────────────────────────── */
  const handleOpenBatchGenerator = async () => {
    if (modulesList.length === 0) await fetchModules();
    setBatchModuleId(modulesList[0]?.id || '');
    setBatchSelectedActionIds(new Set());
    setBatchDialogOpen(true);
    if (actionsList.length === 0) await fetchActions();
  };

  const handleToggleBatchAction = (actionId) => {
    setBatchSelectedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  const handleExecuteBatchGenerate = async () => {
    if (!batchModuleId) {
      enqueueSnackbar('Please select a target module', { variant: 'warning' });
      return;
    }
    if (batchSelectedActionIds.size === 0) {
      enqueueSnackbar('Please select at least one action', { variant: 'warning' });
      return;
    }

    setBatchGenerating(true);
    try {
      await permissionService.batchGeneratePermissions({
        moduleId: batchModuleId,
        actionIds: Array.from(batchSelectedActionIds),
      });
      enqueueSnackbar('Permissions generated successfully!', { variant: 'success' });
      setBatchDialogOpen(false);
      fetchPermissions();
    } catch (err) {
      enqueueSnackbar(err.message || 'Batch generation failed', { variant: 'error' });
    } finally {
      setBatchGenerating(false);
    }
  };

  const totalSelectedCount = selectedPermissionIds.size;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* ── Breadcrumbs & Header ── */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.85rem' }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          Role & Permission Management
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
            Access Control & RBAC Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: T.textSecondary, mt: 0.3 }}>
            Manage custom roles, system modules, atomic actions, and permission assignments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateRole}
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
              Create New Role
            </Button>
          )}

          {activeTab === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModule}
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
              Add Module
            </Button>
          )}

          {activeTab === 2 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateAction}
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
              Add Action
            </Button>
          )}

          {activeTab === 3 && (
            <Button
              variant="outlined"
              startIcon={<AutoGenIcon />}
              onClick={handleOpenBatchGenerator}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                borderColor: T.primary,
                color: T.primary,
              }}
            >
              Batch Generate Permissions
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Main Navigation Tabs ── */}
      <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            px: 2,
            pt: 1,
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${T.border}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<RoleIcon fontSize="small" />} iconPosition="start" label="Custom Roles & Matrix" />
          <Tab icon={<ModuleIcon fontSize="small" />} iconPosition="start" label="System Modules" />
          <Tab icon={<ActionIcon fontSize="small" />} iconPosition="start" label="Action Verbs" />
          <Tab icon={<PermissionIcon fontSize="small" />} iconPosition="start" label="Permissions Catalog" />
        </Tabs>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB PANEL 0: ROLES
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search role by name or code..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={roleStatus}
                  onChange={(e) => {
                    setRoleStatus(e.target.value);
                    setRolePage(0);
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Role Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Assigned Capabilities</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Assigned Users</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: T.textSecondary }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: T.textSecondary }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: T.textSecondary }}>
                        No roles found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.textPrimary }}>
                            {r.name}
                          </Typography>
                          {r.description && (
                            <Typography variant="caption" sx={{ color: T.textSecondary, display: 'block' }}>
                              {r.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.code}
                            size="small"
                            sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PermissionIcon style={{ fontSize: 14 }} />}
                            label={`${r.permission_count || 0} permissions`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {r.user_count || 0} users
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {r.is_system ? (
                            <Tooltip title="System-defined built-in role">
                              <Chip
                                icon={<SystemIcon style={{ fontSize: 13 }} />}
                                label="System"
                                size="small"
                                sx={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip label="Custom" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={r.is_active ? <ActiveIcon style={{ fontSize: 13 }} /> : <InactiveIcon style={{ fontSize: 13 }} />}
                            label={r.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={r.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Role & Permissions Matrix">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditRole(r)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!r.is_system && (
                              <>
                                <Tooltip title={r.is_active ? 'Deactivate Role' : 'Activate Role'}>
                                  <IconButton size="small" onClick={() => handleToggleRoleStatus(r)}>
                                    {r.is_active ? <InactiveIcon fontSize="small" color="action" /> : <ActiveIcon fontSize="small" color="success" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Role">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setRoleToDelete(r);
                                      setDeleteRoleDialogOpen(true);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={roleTotal}
                rowsPerPage={roleRowsPerPage}
                page={rolePage}
                onPageChange={(e, newPage) => setRolePage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRoleRowsPerPage(parseInt(e.target.value, 10));
                  setRolePage(0);
                }}
              />
            </TableContainer>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB PANEL 1: MODULES
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ maxWidth: 400, mb: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: T.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Module Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Code / Slug</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : modulesList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: T.textSecondary }}>
                        No modules found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    modulesList.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{m.name}</TableCell>
                        <TableCell>
                          <Chip label={m.code} size="small" sx={{ fontFamily: 'monospace', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ color: T.textSecondary }}>{m.description || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={m.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={m.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Module">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditModule(m)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={m.is_active ? 'Deactivate Module' : 'Activate Module'}>
                              <IconButton size="small" onClick={() => handleToggleModuleStatus(m)}>
                                {m.is_active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" color="success" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Module">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setModuleToDelete(m);
                                  setDeleteModuleDialogOpen(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={moduleTotal}
                rowsPerPage={moduleRowsPerPage}
                page={modulePage}
                onPageChange={(e, p) => setModulePage(p)}
                onRowsPerPageChange={(e) => {
                  setModuleRowsPerPage(parseInt(e.target.value, 10));
                  setModulePage(0);
                }}
              />
            </TableContainer>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB PANEL 2: ACTIONS (VERBS)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ maxWidth: 400, mb: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search action verbs..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: T.textSecondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Action Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Code / Verb</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : actionsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: T.textSecondary }}>
                        No actions found. Click &quot;Add Action&quot; to define new action verbs.
                      </TableCell>
                    </TableRow>
                  ) : (
                    actionsList.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={a.code}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: T.textSecondary }}>{a.description || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={a.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={a.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Action">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditAction(a)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={a.is_active ? 'Deactivate Action' : 'Activate Action'}>
                              <IconButton size="small" onClick={() => handleToggleActionStatus(a)}>
                                {a.is_active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" color="success" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Action">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setActionToDelete(a);
                                  setDeleteActionDialogOpen(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={actionTotal}
                rowsPerPage={actionRowsPerPage}
                page={actionPage}
                onPageChange={(e, p) => setActionPage(p)}
                onRowsPerPageChange={(e) => {
                  setActionRowsPerPage(parseInt(e.target.value, 10));
                  setActionPage(0);
                }}
              />
            </TableContainer>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB PANEL 3: PERMISSIONS CATALOG
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by code or name..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
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
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={permModuleFilter}
                  onChange={(e) => {
                    setPermModuleFilter(e.target.value);
                    setPermPage(0);
                  }}
                  displayEmpty
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
                >
                  <MenuItem value="">All Modules</MenuItem>
                  {modulesList.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${T.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Permission Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name / Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action Verb</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : permissionsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: T.textSecondary }}>
                        No permissions found. Click &quot;Batch Generate Permissions&quot; to auto-create them.
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissionsList.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Chip
                            label={p.code}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {p.name}
                          </Typography>
                          {p.description && (
                            <Typography variant="caption" sx={{ color: T.textSecondary }}>
                              {p.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={p.module_name || p.module_code} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={p.action_name || p.action_code} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={p.is_active ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[10, 15, 30, 50]}
                component="div"
                count={permTotal}
                rowsPerPage={permRowsPerPage}
                page={permPage}
                onPageChange={(e, p) => setPermPage(p)}
                onRowsPerPageChange={(e) => {
                  setPermRowsPerPage(parseInt(e.target.value, 10));
                  setPermPage(0);
                }}
              />
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: CREATE / EDIT ROLE
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => !roleFormSaving && setRoleDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          {roleDialogMode === 'create' ? 'Create Custom Dynamic Role' : `Edit Role: ${selectedRole?.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Role Name"
                placeholder="e.g. Senior Project Manager"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Role Code (Slug)"
                placeholder="e.g. SENIOR_PROJECT_MANAGER"
                value={roleForm.code}
                onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                disabled={roleDialogMode === 'edit'}
                helperText={roleDialogMode === 'edit' ? 'Role code cannot be changed' : 'Unique capital identifier'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description"
                placeholder="Explain the scope and responsibilities of this role..."
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: T.textPrimary }}>
                Assign Capabilities & Permissions
              </Typography>
              <Typography variant="caption" sx={{ color: T.textSecondary }}>
                Selected: <strong>{totalSelectedCount}</strong> permissions assigned
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => handleSelectAllMatrix(true)}>
                Select All
              </Button>
              <Button size="small" variant="text" color="inherit" onClick={() => handleSelectAllMatrix(false)}>
                Clear All
              </Button>
            </Stack>
          </Box>

          {matrixLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" sx={{ mt: 1, color: T.textSecondary }}>
                Loading capabilities matrix...
              </Typography>
            </Box>
          ) : matrixModules.length === 0 ? (
            <Alert severity="info">No permissions configured in the system yet.</Alert>
          ) : (
            <Box sx={{ maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
              {matrixModules.map((mod) => {
                const perms = mod.permissions || [];
                const allSelected = perms.length > 0 && perms.every((p) => selectedPermissionIds.has(p.id));
                const someSelected = perms.some((p) => selectedPermissionIds.has(p.id)) && !allSelected;

                return (
                  <Accordion
                    key={mod.module_id}
                    defaultExpanded
                    sx={{
                      mb: 1,
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px !important',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f8fafc' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleModuleAll(perms, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                          label={
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {mod.module_name}
                            </Typography>
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Chip label={`${perms.length} actions`} size="small" sx={{ ml: 'auto', fontSize: '0.7rem' }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                      <Grid container spacing={1}>
                        {perms.map((p) => (
                          <Grid item xs={12} sm={6} md={4} key={p.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedPermissionIds.has(p.id)}
                                  onChange={() => handleTogglePermission(p.id)}
                                  size="small"
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                    {p.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: T.textSecondary, fontFamily: 'monospace' }}>
                                    {p.code}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setRoleDialogOpen(false)} disabled={roleFormSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={roleFormSaving}
            sx={{ backgroundColor: T.primary, fontWeight: 700, px: 3 }}
          >
            {roleFormSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: CREATE / EDIT MODULE
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={moduleDialogOpen}
        onClose={() => !moduleFormSaving && setModuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          {moduleDialogMode === 'create' ? 'Add System Module' : `Edit Module: ${selectedModule?.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Module Name"
              placeholder="e.g. Projects, Proposals, Contracts"
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Module Code / Slug"
              placeholder="e.g. project, proposal, contract"
              value={moduleForm.code}
              onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
              disabled={moduleDialogMode === 'edit'}
              helperText={moduleDialogMode === 'edit' ? 'Code cannot be changed once created' : 'Lowercase identifier used in permission prefixes'}
              required
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Description"
              placeholder="Explain the resource this module governs..."
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setModuleDialogOpen(false)} disabled={moduleFormSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveModule}
            disabled={moduleFormSaving}
            sx={{ backgroundColor: T.primary, fontWeight: 700 }}
          >
            {moduleFormSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: CREATE / EDIT ACTION (TAB 2)
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => !actionFormSaving && setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          {actionDialogMode === 'create' ? 'Add Action Verb' : `Edit Action: ${selectedAction?.name}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Action Name"
              placeholder="e.g. Create, List / View, Update / Edit, Approve, Export"
              value={actionForm.name}
              onChange={(e) => setActionForm({ ...actionForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Action Code (Verb Slug)"
              placeholder="e.g. create, list, update, delete, approve, export"
              value={actionForm.code}
              onChange={(e) => setActionForm({ ...actionForm, code: e.target.value })}
              disabled={actionDialogMode === 'edit'}
              helperText={actionDialogMode === 'edit' ? 'Code cannot be changed once created' : 'Lowercase identifier (e.g. create, update, delete)'}
              required
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Description"
              placeholder="Explain what this action verb allows the user to do..."
              value={actionForm.description}
              onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setActionDialogOpen(false)} disabled={actionFormSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAction}
            disabled={actionFormSaving}
            sx={{ backgroundColor: T.primary, fontWeight: 700 }}
          >
            {actionFormSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOG: BATCH PERMISSION GENERATOR (TAB 3)
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={batchDialogOpen}
        onClose={() => !batchGenerating && setBatchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
          Batch Generate Permissions for Module
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: T.textSecondary, mb: 2, mt: 1 }}>
            Select a target module and pick the action verbs to automatically create standard permissions (e.g.{' '}
            <code>module.create</code>, <code>module.update</code>).
          </Typography>

          <TextField
            fullWidth
            select
            size="small"
            label="Target Module"
            value={batchModuleId}
            onChange={(e) => setBatchModuleId(e.target.value)}
            sx={{ mb: 2 }}
          >
            {modulesList.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name} ({m.code})
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Select Action Verbs to Generate:
          </Typography>

          <Grid container spacing={1}>
            {actionsList.map((a) => (
              <Grid item xs={6} key={a.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={batchSelectedActionIds.has(a.id)}
                      onChange={() => handleToggleBatchAction(a.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {a.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: T.textSecondary, fontFamily: 'monospace' }}>
                        {a.code}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${T.border}` }}>
          <Button onClick={() => setBatchDialogOpen(false)} disabled={batchGenerating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteBatchGenerate}
            disabled={batchGenerating}
            sx={{ backgroundColor: T.primary, fontWeight: 700 }}
          >
            {batchGenerating ? <CircularProgress size={20} color="inherit" /> : 'Generate Permissions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialogs ── */}
      <Dialog open={deleteRoleDialogOpen} onClose={() => setDeleteRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Role Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete role <strong>{roleToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteRoleDialogOpen(false)} disabled={deletingRole}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteRole} disabled={deletingRole}>
            {deletingRole ? <CircularProgress size={20} color="inherit" /> : 'Delete Role'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteModuleDialogOpen} onClose={() => setDeleteModuleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Module Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete module <strong>{moduleToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModuleDialogOpen(false)} disabled={deletingModule}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteModule} disabled={deletingModule}>
            {deletingModule ? <CircularProgress size={20} color="inherit" /> : 'Delete Module'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteActionDialogOpen} onClose={() => setDeleteActionDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Action Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete action <strong>{actionToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteActionDialogOpen(false)} disabled={deletingAction}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteAction} disabled={deletingAction}>
            {deletingAction ? <CircularProgress size={20} color="inherit" /> : 'Delete Action'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleRoleManagement;
