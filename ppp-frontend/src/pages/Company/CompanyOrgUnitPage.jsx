import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Grid,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  AccountTree as TreeIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  FolderOff as EmptyIcon,
  SwapHoriz as MoveIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { companyService, orgUnitTypeService, companyOrgUnitService } from '../../services/company';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/;

// Visual language per seeded unit type code
const TYPE_COLORS = {
  COMP: { bg: '#eef2ff', color: '#4f46e5' },
  DIV: { bg: '#f5f3ff', color: '#7c3aed' },
  DEPT: { bg: '#e0f2fe', color: '#0284c7' },
  SEC: { bg: '#cffafe', color: '#0891b2' },
  TEAM: { bg: '#ecfdf5', color: '#059669' },
  BR: { bg: '#fff7ed', color: '#ea580c' },
};
const typeColor = (code) => TYPE_COLORS[code] || { bg: '#f1f5f9', color: '#475569' };

// Shared gradient dialog header — icon tile, title, subtitle, close button
const DialogHeader = ({ icon, title, subtitle, onClose }) => (
  <Box
    sx={{
      px: 3,
      py: 2.25,
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%), #4f46e5',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}
  >
    <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.25 }} noWrap>{title}</Typography>
      {subtitle && <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.74rem' }} noWrap>{subtitle}</Typography>}
    </Box>
    <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)', color: '#ffffff' } }}>
      <CloseIcon sx={{ fontSize: 20 }} />
    </IconButton>
  </Box>
);

const DIALOG_PAPER_SX = { borderRadius: 3, overflow: 'hidden', boxShadow: '0 24px 60px -12px rgba(15,23,42,0.35)' };
const DIALOG_FOOTER_SX = { px: 3, py: 1.75, m: 0, gap: 1, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' };

const emptyForm = {
  parentId: '',
  unitTypeId: '',
  code: '',
  name: '',
  nameAmharic: '',
  nameAfaanOromo: '',
  description: '',
  sortOrder: '0',
};

// Flatten a nested tree into [{ node, depth }], respecting the collapsed set
const flattenTree = (nodes, depth = 0, collapsed = new Set(), out = []) => {
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length && !collapsed.has(String(node.id))) {
      flattenTree(node.children, depth + 1, collapsed, out);
    }
  }
  return out;
};

// Full flat list ignoring collapse state (for parent pickers)
const flattenAll = (nodes, depth = 0, out = []) => {
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length) flattenAll(node.children, depth + 1, out);
  }
  return out;
};

export const CompanyOrgUnitPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Company + tree state
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [types, setTypes] = useState([]);
  const [treeData, setTreeData] = useState({ company: null, roots: [] });
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());

  // Dialog state: form ('add' | 'edit'), view, move
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formParentLabel, setFormParentLabel] = useState('');
  const [formTarget, setFormTarget] = useState(null); // unit being edited
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveParentId, setMoveParentId] = useState('');
  const [moveError, setMoveError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'toggle' | 'delete'
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Initial lookups: companies + active types
  useEffect(() => {
    const init = async () => {
      try {
        const [compRes, typeRes] = await Promise.all([
          companyService.getCompanies({ page: 1, limit: 200, status: 'all' }),
          orgUnitTypeService.getOrgUnitTypes({ page: 1, limit: 100, status: 'active' }),
        ]);
        const comps = compRes?.companies || [];
        setCompanies(comps);
        setTypes(typeRes?.orgUnitTypes || []);
        // Default to the first company
        if (comps.length > 0) setSelectedCompany(comps[0]);
      } catch (err) {
        enqueueSnackbar(err.message || 'Failed to load companies or unit types.', { variant: 'error' });
      } finally {
        setLoadingCompanies(false);
      }
    };
    init();
  }, [enqueueSnackbar]);

  const fetchTree = useCallback(async () => {
    if (!selectedCompany) {
      setTreeData({ company: null, roots: [] });
      return;
    }
    setLoadingTree(true);
    try {
      const result = await companyOrgUnitService.getCompanyTree(selectedCompany.id);
      setTreeData(result || { company: null, roots: [] });
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load organization structure.', { variant: 'error' });
      setTreeData({ company: null, roots: [] });
    } finally {
      setLoadingTree(false);
    }
  }, [selectedCompany, enqueueSnackbar]);

  useEffect(() => {
    fetchTree();
    setCollapsed(new Set());
  }, [fetchTree]);

  const typeById = useMemo(() => new Map(types.map((t) => [String(t.id), t])), [types]);
  const allFlat = useMemo(() => flattenAll(treeData.roots || []), [treeData]);
  const visibleRows = useMemo(
    () => flattenTree(treeData.roots || [], 0, collapsed),
    [treeData, collapsed]
  );
  const hasRoot = (treeData.roots || []).length > 0;

  const toggleCollapsed = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  };

  // ── Allowed unit types given a parent (and, on edit, the node's children) ──
  const allowedTypesForParent = (parentId, excludeUnitId = null) => {
    if (!parentId) {
      // Only the COMP type may be a root
      return types.filter((t) => t.code === 'COMP');
    }
    const parent = allFlat.find((f) => String(f.node.id) === String(parentId))?.node;
    if (!parent) return types;
    const parentTypeSort = typeById.get(String(parent.unit_type_id))?.sort_order ?? -1;

    let minChildSort = Infinity;
    if (excludeUnitId) {
      const target = allFlat.find((f) => String(f.node.id) === String(excludeUnitId))?.node;
      if (target) {
        for (const child of target.children || []) {
          const s = typeById.get(String(child.unit_type_id))?.sort_order;
          if (s !== undefined) minChildSort = Math.min(minChildSort, s);
        }
      }
    }

    return types.filter(
      (t) => t.sort_order > parentTypeSort && (minChildSort === Infinity || t.sort_order < minChildSort)
    );
  };

  // ── Add / Edit dialog ──────────────────────────────────────────────────────

  const openAddDialog = (parentNode = null) => {
    if (!selectedCompany) {
      enqueueSnackbar('Select a company first.', { variant: 'warning' });
      return;
    }
    setFormMode('add');
    setFormTarget(null);
    setForm({ ...emptyForm, parentId: parentNode ? String(parentNode.id) : '' });
    setFormParentLabel(parentNode ? `${parentNode.name} (${parentNode.code})` : '');
    setFormErrors({});
    setErrorMsg('');
    setFormOpen(true);
  };

  const openEditDialog = (unit) => {
    setFormMode('edit');
    setFormTarget(unit);
    setForm({
      ...emptyForm,
      parentId: unit.parent_id ? String(unit.parent_id) : '',
      unitTypeId: unit.unit_type_id ? String(unit.unit_type_id) : '',
      code: unit.code || '',
      name: unit.name || '',
      nameAmharic: unit.name_amharic || '',
      nameAfaanOromo: unit.name_afaan_oromo || '',
      description: unit.description || '',
      sortOrder: unit.sort_order !== null && unit.sort_order !== undefined ? String(unit.sort_order) : '0',
    });
    setFormParentLabel(
      unit.parent_id
        ? `${allFlat.find((f) => String(f.node.id) === String(unit.parent_id))?.node?.name || unit.parent_name || ''}`
        : ''
    );
    setFormErrors({});
    setErrorMsg('');
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    setFormOpen(false);
    setFormMode('add');
    setFormTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setErrorMsg('');
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    if (errorMsg) setErrorMsg('');
  };

  const validateForm = () => {
    const errors = {};
    if (!form.parentId && formMode === 'add') {
      // Root only allowed for companies without a root yet
      if (hasRoot) errors.parentId = 'This company already has a root unit — select a parent.';
    }
    if (!form.unitTypeId) errors.unitTypeId = 'Unit type is required.';
    const code = form.code.trim();
    if (!code) errors.code = 'Unit code is required.';
    else if (!CODE_RE.test(code)) errors.code = '1-50 chars: letters, digits, "-" or "_".';
    if (!form.name.trim()) errors.name = 'Unit name is required.';
    const n = parseInt(form.sortOrder, 10);
    if (form.sortOrder !== '' && (isNaN(n) || n < 0)) errors.sortOrder = 'Non-negative integer.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildFormPayload = () => ({
    companyId: selectedCompany.id,
    parentId: form.parentId || null,
    unitTypeId: form.unitTypeId,
    code: form.code.trim(),
    name: form.name.trim(),
    nameAmharic: form.nameAmharic.trim() || null,
    nameAfaanOromo: form.nameAfaanOromo.trim() || null,
    description: form.description.trim() || null,
    sortOrder: form.sortOrder === '' ? 0 : parseInt(form.sortOrder, 10),
  });

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setErrorMsg('');
    try {
      if (formMode === 'add') {
        await companyOrgUnitService.createUnit(buildFormPayload());
        enqueueSnackbar(`Unit "${form.name.trim()}" added to the structure.`, { variant: 'success' });
      } else if (formMode === 'edit' && formTarget) {
        const payload = buildFormPayload();
        delete payload.parentId; // re-parenting goes through the Move action
        await companyOrgUnitService.updateUnit(formTarget.id, payload);
        enqueueSnackbar(`Unit "${form.name.trim()}" updated.`, { variant: 'success' });
      }
      closeFormDialog();
      fetchTree();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save the unit.');
    } finally {
      setSaving(false);
    }
  };

  const formTypeOptions = useMemo(() => {
    if (formMode === 'edit' && formTarget) {
      // Editing: parent is fixed to the current one
      return allowedTypesForParent(formTarget.parent_id, formTarget.id);
    }
    return allowedTypesForParent(form.parentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.parentId, formMode, formTarget, allFlat, types]);

  // ── View dialog ────────────────────────────────────────────────────────────

  const openViewDialog = (unit) => {
    setViewTarget(unit);
    setViewOpen(true);
  };

  const unitBreadcrumb = (unit) => {
    if (!unit?.path) return '';
    return unit.path
      .split('/')
      .filter(Boolean)
      .map((id) => allFlat.find((f) => String(f.node.id) === id)?.node?.name)
      .filter(Boolean)
      .join('  ›  ');
  };

  // ── Move dialog ────────────────────────────────────────────────────────────

  const openMoveDialog = (unit) => {
    setMoveTarget(unit);
    setMoveParentId(unit.parent_id ? String(unit.parent_id) : '');
    setMoveError('');
    setMoveOpen(true);
  };

  const moveParentOptions = useMemo(() => {
    if (!moveTarget) return [];
    // Exclude the node itself and its whole subtree (path prefix = descendants)
    return allFlat.filter((f) => String(f.node.id) !== String(moveTarget.id) && !f.node.path.startsWith(moveTarget.path));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveTarget, allFlat]);

  const handleMoveSubmit = async () => {
    if (!moveTarget) return;
    setSaving(true);
    setMoveError('');
    try {
      const result = await companyOrgUnitService.moveUnit(moveTarget.id, moveParentId || null);
      enqueueSnackbar(`"${moveTarget.name}" moved. Now at level ${result?.level ?? '?'}.`, { variant: 'success' });
      setMoveOpen(false);
      setMoveTarget(null);
      fetchTree();
    } catch (err) {
      setMoveError(err.message || 'Failed to move the unit.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle / delete ────────────────────────────────────────────────────────

  const openConfirm = (action, unit) => {
    setConfirmAction(action);
    setConfirmTarget(unit);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmTarget || !confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction === 'toggle') {
        const result = await companyOrgUnitService.toggleUnitStatus(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Status updated.', { variant: 'success' });
      } else {
        const result = await companyOrgUnitService.deleteUnit(confirmTarget.id);
        enqueueSnackbar(result?.message || 'Unit deleted.', { variant: 'success' });
      }
      setConfirmOpen(false);
      setConfirmAction(null);
      setConfirmTarget(null);
      fetchTree();
    } catch (err) {
      enqueueSnackbar(err.message || 'Action failed.', { variant: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderTextField = (field, label, { required = false, multiline = false, rows = 3, type = 'text', placeholder = '' } = {}) => (
    <TextField
      required={required}
      fullWidth
      size="small"
      type={type}
      label={label}
      placeholder={placeholder}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      value={form[field]}
      onChange={handleFormChange(field)}
      error={Boolean(formErrors[field])}
      helperText={formErrors[field]}
      disabled={saving}
      inputProps={type === 'number' ? { min: 0, step: 1 } : undefined}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
    />
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem', mb: 0.5 }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Dashboard</Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/company/companymanagement" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Company Management</Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Organization Structure</Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TreeIcon sx={{ fontSize: 21 }} />
            </Box>
            Company Organization Units
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, ml: '52px' }}>
            Maintain each company's hierarchy of divisions, departments, sections, teams and branches.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<CategoryIcon />}
          onClick={() => navigate('/company/orgunitype')}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Manage Unit Types
        </Button>
      </Box>

      {/* Company selector toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company
            </Typography>
          </Box>
          <Autocomplete
            size="small"
            loading={loadingCompanies}
            options={companies}
            value={selectedCompany}
            onChange={(event, newValue) => setSelectedCompany(newValue)}
            getOptionLabel={(option) => (typeof option === 'string' ? option : `${option.name} (${option.code})`)}
            isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id ?? val)}
            noOptionsText={loadingCompanies ? 'Loading...' : 'No companies found — register one first.'}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={option.id || key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{option.name}</Typography>
                    {option.name_amharic && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{option.name_amharic}</Typography>
                    )}
                  </Box>
                  <Chip label={option.code} size="small" sx={{ height: 18, fontSize: '0.64rem', fontWeight: 800, fontFamily: 'monospace', backgroundColor: '#f1f5f9' }} />
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search & select a company..."
                sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.84rem' } }}
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps?.input,
                    endAdornment: (
                      <>
                        {loadingCompanies ? <CircularProgress size={16} /> : null}
                        {params.slotProps?.input?.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openAddDialog(null)}
            disabled={!selectedCompany || saving}
            sx={{ borderRadius: 2, px: 2.5, fontWeight: 700, fontSize: '0.82rem', backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
          >
            {hasRoot ? 'Add Unit' : 'Add Root Unit'}
          </Button>
        </Box>
      </Paper>

      {/* Tree */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TreeIcon sx={{ color: '#4f46e5', fontSize: 18 }} />
            Organization Chart {treeData.company ? `— ${treeData.company.name}` : ''}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={`${allFlat.length} units`} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4f46e5' }} />
          {visibleRows.length !== allFlat.length && (
            <Button size="small" onClick={() => setCollapsed(new Set())} sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
              Expand all
            </Button>
          )}
        </Box>

        {loadingTree ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Loading organization structure...</Typography>
          </Box>
        ) : !selectedCompany ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <BusinessIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>Select a company above to view its organization tree.</Typography>
          </Box>
        ) : visibleRows.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <EmptyIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
              No organization units yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Start by adding the root <strong>COMP</strong> unit (named after the company), then add divisions and departments under it.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 1 }}>
            {visibleRows.map(({ node, depth }) => {
              const color = typeColor(node.unit_type_code);
              const isCollapsed = collapsed.has(String(node.id));
              const hasKids = (node.children?.length || 0) > 0;
              return (
                <Box
                  key={node.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.9,
                    pl: `${2 + depth * 28}px`,
                    borderLeft: '3px solid',
                    borderColor: 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': { backgroundColor: '#f8fafc', borderColor: color.color },
                  }}
                >
                  {/* Expand / collapse */}
                  <Box sx={{ width: 22, flexShrink: 0 }}>
                    {hasKids ? (
                      <IconButton size="small" onClick={() => toggleCollapsed(node.id)} sx={{ p: 0.2, color: '#64748b' }}>
                        {isCollapsed ? <ExpandIcon sx={{ fontSize: 16 }} /> : <CollapseIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    ) : (
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#cbd5e1', mx: 'auto' }} />
                    )}
                  </Box>

                  {/* Type chip */}
                  <Chip
                    label={node.unit_type_name || node.unit_type_code || 'Unit'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.66rem', fontWeight: 800, backgroundColor: color.bg, color: color.color, borderRadius: 1.25, flexShrink: 0, minWidth: 84 }}
                  />

                  {/* Code + name */}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{node.name}</Typography>
                      <Chip
                        label={node.code}
                        size="small"
                        onClick={() => openViewDialog(node)}
                        sx={{ height: 18, fontSize: '0.64rem', fontWeight: 800, fontFamily: 'monospace', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', '&:hover': { backgroundColor: '#e2e8f0' } }}
                      />
                      {node.manager_name && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>· {node.manager_name}</Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Children count */}
                  {hasKids && (
                    <Chip
                      label={node.children.length}
                      size="small"
                      sx={{ height: 18, fontSize: '0.64rem', fontWeight: 700, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', flexShrink: 0 }}
                    />
                  )}

                  {/* Status */}
                  <Chip
                    label={node.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      backgroundColor: node.is_active ? '#dcfce7' : '#fee2e2',
                      color: node.is_active ? '#15803d' : '#b91c1c',
                      flexShrink: 0,
                    }}
                  />

                  {/* Row actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    <Tooltip title="Add a child unit under this one" arrow placement="top">
                      <IconButton size="small" onClick={() => openAddDialog(node)} sx={{ color: '#16a34a', p: 0.5, '&:hover': { backgroundColor: '#dcfce7' } }}>
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View details" arrow placement="top">
                      <IconButton size="small" onClick={() => openViewDialog(node)} sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}>
                        <ViewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit unit information" arrow placement="top">
                      <IconButton size="small" onClick={() => openEditDialog(node)} sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#0284c7', backgroundColor: '#e0f2fe' } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Move this unit (and its subtree) under another parent" arrow placement="top">
                      <IconButton size="small" onClick={() => openMoveDialog(node)} sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#7c3aed', backgroundColor: '#f5f3ff' } }}>
                        <MoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={node.is_active ? 'Deactivate unit' : 'Activate unit'} arrow placement="top">
                      <IconButton
                        size="small"
                        onClick={() => openConfirm('toggle', node)}
                        sx={{ color: node.is_active ? '#ca8a04' : '#16a34a', p: 0.5, '&:hover': { backgroundColor: node.is_active ? '#fef9c3' : '#dcfce7' } }}
                      >
                        {node.is_active ? <DeactivateIcon sx={{ fontSize: 16 }} /> : <ActivateIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title="Delete unit (must have no children)" arrow placement="top">
                      <IconButton size="small" onClick={() => openConfirm('delete', node)} sx={{ color: '#ef4444', p: 0.5, '&:hover': { backgroundColor: '#fee2e2' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip> */}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* ── Add / Edit dialog ── */}
      <Dialog 
        open={formOpen} 
        onClose={closeFormDialog} 
        maxWidth="md" 
        fullWidth 
        slotProps={{ paper: { sx: DIALOG_PAPER_SX } }}
      >
        <DialogHeader
          icon={<TreeIcon sx={{ fontSize: 22 }} />}
          title={
            formMode === 'add'
              ? form.parentId
                ? `Add Unit Under: ${formParentLabel}`
                : 'Add Root Unit (Company)'
              : `Edit Unit: ${formTarget?.name || ''}`
          }
          subtitle={
            formMode === 'add'
              ? 'Grow the organization hierarchy one level deeper'
              : `Update details for unit code "${formTarget?.code || ''}"`
          }
          onClose={closeFormDialog}
        />

        <DialogContent sx={{ p: 3.5, backgroundColor: '#ffffff' }}>
          <Box component="form" onSubmit={handleFormSubmit} noValidate id="org-unit-form">
            {errorMsg && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500, fontSize: '0.85rem' }}
              >
                {errorMsg}
              </Alert>
            )}

            {/* Section 1: Hierarchy & Type */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: '#64748b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontSize: '0.7rem', 
                mb: 1.5, 
                display: 'block' 
              }}
            >
              Hierarchy & Classification
            </Typography>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2.5, 
                width: '100%', 
                mb: 3 
              }}
            >
              {formMode === 'add' ? (
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={allFlat.map((f) => f.node)}
                    value={allFlat.find((f) => String(f.node.id) === String(form.parentId))?.node || null}
                    onChange={(event, newValue) => {
                      setForm((prev) => ({ ...prev, parentId: newValue ? String(newValue.id) : '', unitTypeId: '' }));
                      setFormParentLabel(newValue ? `${newValue.name} (${newValue.code})` : '');
                      if (formErrors.parentId) setFormErrors((prev) => ({ ...prev, parentId: undefined }));
                    }}
                    getOptionLabel={(o) => `${'— '.repeat(Math.max(o.level - 1, 0))}${o.name} (${o.code})`}
                    isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id ?? v)}
                    disabled={saving}
                    noOptionsText="No eligible parents — add the root unit first"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Parent Unit"
                        required={hasRoot}
                        placeholder="Blank = new root"
                        error={Boolean(formErrors.parentId)}
                        helperText={formErrors.parentId}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#f8fafc',
                            minHeight: '42px',
                            '&:hover': { backgroundColor: '#f1f5f9' },
                            '&.Mui-focused': { backgroundColor: '#ffffff' }
                          }
                        }}
                      />
                    )}
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2.5, 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    minHeight: '42px', 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem' }}>
                      Parent Unit: <strong style={{ color: '#0f172a' }}>{formTarget?.parent_name || 'None (root)'}</strong>
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ flex: 1, width: '100%' }}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={formTypeOptions}
                  value={types.find((t) => String(t.id) === String(form.unitTypeId)) || null}
                  onChange={(event, newValue) => {
                    setForm((prev) => ({ ...prev, unitTypeId: newValue ? String(newValue.id) : '' }));
                    if (formErrors.unitTypeId) setFormErrors((prev) => ({ ...prev, unitTypeId: undefined }));
                  }}
                  getOptionLabel={(t) => (typeof t === 'string' ? t : `${t.name} (${t.code})`)}
                  isOptionEqualToValue={(t, v) => String(t?.id) === String(v?.id ?? v)}
                  disabled={saving}
                  noOptionsText={
                    formMode === 'add' && !form.parentId
                      ? 'Only the COMP type may be used for the root unit'
                      : 'No types fit this position — a child type must rank below its parent type.'
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit Type"
                      required
                      error={Boolean(formErrors.unitTypeId)}
                      helperText={formErrors.unitTypeId}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                          backgroundColor: '#f8fafc',
                          minHeight: '42px',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          '&.Mui-focused': { backgroundColor: '#ffffff' }
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Section 2: Basic Details */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: '#64748b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontSize: '0.7rem', 
                mb: 1.5, 
                display: 'block' 
              }}
            >
              Basic Details
            </Typography>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2.5, 
                width: '100%', 
                mb: 3 
              }}
            >
              <Box sx={{ flex: 1, width: '100%' }}>
                {renderTextField('code', 'Unit Code', { required: true, placeholder: 'e.g. DIV-FIN' })}
              </Box>
              <Box sx={{ flex: 2, width: '100%' }}>
                {renderTextField('name', 'Unit Name (English)', { required: true, placeholder: 'e.g. Finance Division' })}
              </Box>
            </Box>

            {/* Section 3: Localization & Settings */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: '#64748b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontSize: '0.7rem', 
                mb: 1.5, 
                display: 'block' 
              }}
            >
              Localization & Settings
            </Typography>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2.5, 
                width: '100%', 
                mb: 2.5 
              }}
            >
              <Box sx={{ flex: 1, width: '100%' }}>
                {renderTextField('nameAmharic', 'Amharic Name', { placeholder: 'ስም በአማርኛ' })}
              </Box>
              <Box sx={{ flex: 1, width: '100%' }}>
                {renderTextField('nameAfaanOromo', 'Afaan Oromo Name', { placeholder: 'Maqaa Afaan Oromootiin' })}
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '120px' } }}>
                {renderTextField('sortOrder', 'Sort Order', { type: 'number' })}
              </Box>
            </Box>

            {/* Description Scope - Full Modal Width */}
            <Box sx={{ width: '100%' }}>
              {renderTextField('description', 'Description / Scope', { multiline: true, rows: 3, placeholder: 'Department objectives, primary responsibilities...' })}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ ...DIALOG_FOOTER_SX, py: 2, px: 3 }}>
          <Button 
            onClick={closeFormDialog} 
            color="inherit" 
            disabled={saving} 
            sx={{ fontWeight: 600, textTransform: 'none', color: '#64748b', px: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="org-unit-form"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : formMode === 'add' ? <AddIcon /> : <EditIcon />}
            sx={{
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca', boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)' }
            }}
          >
            {saving ? 'Saving...' : formMode === 'add' ? 'Create Unit' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Details dialog ── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: DIALOG_PAPER_SX } }}>
        <DialogHeader
          icon={<TreeIcon sx={{ fontSize: 20 }} />}
          title={`Unit Details — ${viewTarget?.name || ''}`}
          subtitle={`${viewTarget?.unit_type_name || viewTarget?.unit_type_code || 'Unit'} · ${viewTarget?.code || ''}`}
          onClose={() => setViewOpen(false)}
        />
        <DialogContent sx={{ pt: 3, px: 3 }}>
          {viewTarget && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 44, height: 44, backgroundColor: typeColor(viewTarget.unit_type_code).bg, color: typeColor(viewTarget.unit_type_code).color }}>
                  <TreeIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{viewTarget.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                    <Chip label={viewTarget.code} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, fontFamily: 'monospace', backgroundColor: '#f1f5f9' }} />
                    <Chip
                      label={viewTarget.unit_type_name || viewTarget.unit_type_code}
                      size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, backgroundColor: typeColor(viewTarget.unit_type_code).bg, color: typeColor(viewTarget.unit_type_code).color }}
                    />
                    <Chip
                      label={viewTarget.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: viewTarget.is_active ? '#dcfce7' : '#fee2e2',
                        color: viewTarget.is_active ? '#15803d' : '#b91c1c',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', mb: 1.5 }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', mb: 0.5 }}>
                  Position in Hierarchy
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                  {unitBreadcrumb(viewTarget) || viewTarget.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Level {viewTarget.level} · Sort order {viewTarget.sort_order} · {viewTarget.children?.length || 0} direct child(ren)
                </Typography>
              </Box>

              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>COMPANY</Typography><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{viewTarget.company_name || treeData.company?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>PARENT</Typography><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{viewTarget.parent_name || 'None (root)'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>MANAGER</Typography><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{viewTarget.manager_name || '—'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>CREATED / UPDATED</Typography><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{formatDate(viewTarget.created_at)} · {formatDate(viewTarget.updated_at)}</Typography></Grid>
              </Grid>

              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                  {viewTarget.description || (viewTarget.name_amharic || viewTarget.name_afaan_oromo
                    ? [viewTarget.name_amharic, viewTarget.name_afaan_oromo].filter(Boolean).join('  ·  ')
                    : '—')}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={DIALOG_FOOTER_SX}>
          <Button onClick={() => setViewOpen(false)} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Close</Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              const target = viewTarget;
              setViewOpen(false);
              openEditDialog(target);
            }}
            sx={{ px: 2.5, borderRadius: 2, fontWeight: 700, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
          >
            Edit Unit
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Move dialog ── */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: DIALOG_PAPER_SX } }}>
        <DialogHeader
          icon={<MoveIcon sx={{ fontSize: 20 }} />}
          title={`Move "${moveTarget?.name || ''}"`}
          subtitle={moveTarget ? `Currently at level ${moveTarget.level} under ${moveTarget.parent_name || 'root'}` : undefined}
          onClose={() => setMoveOpen(false)}
        />
        <DialogContent sx={{ pt: 3, px: 3 }}>
          {moveError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{moveError}</Alert>}
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
            The entire subtree below this unit moves with it. Cycles and cross-company moves are rejected by the server.
          </Typography>
          <Autocomplete
            size="small"
            options={moveParentOptions.map((f) => f.node)}
            value={allFlat.find((f) => String(f.node.id) === String(moveParentId))?.node || null}
            onChange={(event, newValue) => setMoveParentId(newValue ? String(newValue.id) : '')}
            getOptionLabel={(o) => (o ? `${o.name} (${o.code})` : '')}
            isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id ?? v)}
            disabled={saving}
            noOptionsText="No other units available"
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              const depth = (option.level || 1) - 1;
              return (
                <Box component="li" key={option.id || key} {...rest} sx={{ pl: `${1 + depth * 2}px` }}>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    {'— '.repeat(depth)}{option.name} <span style={{ color: '#94a3b8' }}>({option.code})</span>
                  </Typography>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="New Parent" placeholder="Blank = move to root" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          />
        </DialogContent>

        <DialogActions sx={DIALOG_FOOTER_SX}>
          <Button onClick={() => setMoveOpen(false)} color="inherit" disabled={saving} sx={{ fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={handleMoveSubmit}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <MoveIcon />}
            sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 700, backgroundColor: '#7c3aed', '&:hover': { backgroundColor: '#6d28d9' } }}
          >
            {saving ? 'Moving...' : 'Move Unit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle / delete confirmation */}
      <ConfirmationModal
        open={confirmOpen}
        title={
          confirmAction === 'delete'
            ? 'Delete Organization Unit'
            : confirmTarget?.is_active
              ? 'Deactivate Unit'
              : 'Activate Unit'
        }
        message={
          confirmAction === 'delete'
            ? `Are you sure you want to delete "${confirmTarget?.name}"? This fails while the unit still has children.`
            : confirmTarget?.is_active
              ? `Are you sure you want to deactivate "${confirmTarget?.name}"?`
              : `Are you sure you want to activate "${confirmTarget?.name}"?`
        }
        confirmText={confirmAction === 'delete' ? 'Delete' : confirmTarget?.is_active ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        confirmColor={confirmAction === 'delete' ? 'error' : confirmTarget?.is_active ? 'warning' : 'primary'}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); setConfirmTarget(null); }}
      />
    </Box>
  );
};

export default CompanyOrgUnitPage;
