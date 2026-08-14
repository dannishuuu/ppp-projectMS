import { useState, useEffect } from 'react';
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
  CircularProgress,
  Avatar,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Category as TypeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Restore as RestoreIcon,
  AccountTree as AreaIcon,
  Checklist as ChecklistIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { trackingItemTypeService, trackingAreaService, checklistService } from '../../services/projectServices';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectTrackingTypePage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // ============================================
  // TRACKING ITEM TYPES TAB
  // ============================================
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesPage, setTypesPage] = useState(0);
  const [typesRowsPerPage, setTypesRowsPerPage] = useState(10);
  const [typesTotalCount, setTypesTotalCount] = useState(0);
  const [typesSearchTerm, setTypesSearchTerm] = useState('');
  const [typesActiveFilter, setTypesActiveFilter] = useState('true');

  // Types modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isWbs: false,
    isLeaf: false,
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // ============================================
  // TRACKING AREAS TAB
  // ============================================
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areasPage, setAreasPage] = useState(0);
  const [areasRowsPerPage, setAreasRowsPerPage] = useState(10);
  const [areasTotalCount, setAreasTotalCount] = useState(0);
  const [areasSearchTerm, setAreasSearchTerm] = useState('');
  const [areasActiveFilter, setAreasActiveFilter] = useState('true');
  const [areasTypeFilter, setAreasTypeFilter] = useState('');

  // Areas modal states
  const [areaDetailsOpen, setAreaDetailsOpen] = useState(false);
  const [areaCreateOpen, setAreaCreateOpen] = useState(false);
  const [areaEditOpen, setAreaEditOpen] = useState(false);
  const [areaDeleteOpen, setAreaDeleteOpen] = useState(false);
  const [areaRestoreOpen, setAreaRestoreOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [areaFormData, setAreaFormData] = useState({
    trackingItemTypeId: '',
    parentId: '',
    name: '',
    description: '',
    isActive: true,
  });

  // ============================================
  // CHECKLISTS TAB
  // ============================================
  const [checklists, setChecklists] = useState([]);
  const [checklistsLoading, setChecklistsLoading] = useState(true);
  const [checklistsPage, setChecklistsPage] = useState(0);
  const [checklistsRowsPerPage, setChecklistsRowsPerPage] = useState(10);
  const [checklistsTotalCount, setChecklistsTotalCount] = useState(0);
  const [checklistsSearchTerm, setChecklistsSearchTerm] = useState('');
  const [checklistsActiveFilter, setChecklistsActiveFilter] = useState('true');
  const [checklistsAreaFilter, setChecklistsAreaFilter] = useState('');
  // Checklists modal states
  const [checklistDetailsOpen, setChecklistDetailsOpen] = useState(false);
  const [checklistCreateOpen, setChecklistCreateOpen] = useState(false);
  const [checklistEditOpen, setChecklistEditOpen] = useState(false);
  const [checklistDeleteOpen, setChecklistDeleteOpen] = useState(false);
  const [checklistRestoreOpen, setChecklistRestoreOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistFormData, setChecklistFormData] = useState({
    trackingAreaId: '',
    name: '',
    description: '',
    isActive: true,
  });

  // Dropdown options
  const [trackingTypes, setTrackingTypes] = useState([]);
  const [trackingAreas, setTrackingAreas] = useState([]);

  // ============================================
  // FETCH FUNCTIONS
  // ============================================

  const fetchTypes = async () => {
    setTypesLoading(true);
    try {
      const isActiveValue = typesActiveFilter === 'all' ? null : typesActiveFilter === 'true';
      const result = await trackingItemTypeService.getTrackingItemTypes({
        page: typesPage + 1, limit: typesRowsPerPage, search: typesSearchTerm, isActive: isActiveValue,
      });
      setTypes(result?.trackingItemTypes || result?.data?.trackingItemTypes || []);
      setTypesTotalCount(result?.pagination?.total || result?.data?.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load tracking types', { variant: 'error' });
    } finally {
      setTypesLoading(false);
    }
  };

  const fetchAreas = async () => {
    setAreasLoading(true);
    try {
      const isActiveValue = areasActiveFilter === 'all' ? null : areasActiveFilter === 'true';
      const result = await trackingAreaService.getTrackingAreas({
        page: areasPage + 1, limit: areasRowsPerPage, search: areasSearchTerm,
        isActive: isActiveValue, trackingItemTypeId: areasTypeFilter || null,
      });
      setAreas(result?.trackingAreas || result?.data?.trackingAreas || []);
      setAreasTotalCount(result?.pagination?.total || result?.data?.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load tracking areas', { variant: 'error' });
    } finally {
      setAreasLoading(false);
    }
  };

  const fetchChecklists = async () => {
    setChecklistsLoading(true);
    try {
      const isActiveValue = checklistsActiveFilter === 'all' ? null : checklistsActiveFilter === 'true';
      const result = await checklistService.getChecklists({
        page: checklistsPage + 1, limit: checklistsRowsPerPage, search: checklistsSearchTerm,
        isActive: isActiveValue, trackingAreaId: checklistsAreaFilter || null,
      });
      setChecklists(result?.checklists || result?.data?.checklists || []);
      setChecklistsTotalCount(result?.pagination?.total || result?.data?.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load checklists', { variant: 'error' });
    } finally {
      setChecklistsLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [typesRes, areasRes] = await Promise.all([
        trackingItemTypeService.getActiveTrackingItemTypes(),
        trackingAreaService.getTrackingAreas({ limit: 100, isActive: true }),
      ]);
      setTrackingTypes(typesRes?.data || typesRes || []);
      setTrackingAreas(areasRes?.trackingAreas || areasRes?.data?.trackingAreas || []);
    } catch (error) {
      console.error('Failed to load dropdown options:', error);
    }
  };

  useEffect(() => { fetchDropdownOptions(); }, []);
  useEffect(() => { fetchTypes(); }, [typesPage, typesRowsPerPage, typesActiveFilter]);
  useEffect(() => { fetchAreas(); }, [areasPage, areasRowsPerPage, areasActiveFilter, areasTypeFilter]);
  useEffect(() => { fetchChecklists(); }, [checklistsPage, checklistsRowsPerPage, checklistsActiveFilter, checklistsAreaFilter]);

  useEffect(() => { const t = setTimeout(() => { if (typesPage === 0) fetchTypes(); else setTypesPage(0); }, 300); return () => clearTimeout(t); }, [typesSearchTerm]);
  useEffect(() => { const t = setTimeout(() => { if (areasPage === 0) fetchAreas(); else setAreasPage(0); }, 300); return () => clearTimeout(t); }, [areasSearchTerm]);
  useEffect(() => { const t = setTimeout(() => { if (checklistsPage === 0) fetchChecklists(); else setChecklistsPage(0); }, 300); return () => clearTimeout(t); }, [checklistsSearchTerm]);

  // ============================================
  // TRACKING ITEM TYPES HANDLERS
  // ============================================

  const handleViewDetails = (type) => { setSelectedType(type); setDetailsOpen(true); };
  const handleOpenCreate = () => { setFormData({ code: '', name: '', description: '', isWbs: false, isLeaf: false, isActive: true }); setCreateOpen(true); };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await trackingItemTypeService.createTrackingItemType(formData);
      enqueueSnackbar('Tracking type created successfully', { variant: 'success' });
      setCreateOpen(false); fetchTypes(); fetchDropdownOptions();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to create tracking type', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenEdit = (type) => {
    setSelectedType(type);
    setFormData({ code: type.code, name: type.name, description: type.description || '', isWbs: type.is_wbs, isLeaf: type.is_leaf, isActive: type.is_active });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      await trackingItemTypeService.updateTrackingItemType(selectedType.id, formData);
      enqueueSnackbar('Tracking type updated successfully', { variant: 'success' });
      setEditOpen(false); fetchTypes(); fetchDropdownOptions();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to update tracking type', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenDelete = (type) => { setSelectedType(type); setDeleteOpen(true); };
  const handleDelete = async () => {
    try { await trackingItemTypeService.deleteTrackingItemType(selectedType.id); enqueueSnackbar('Tracking type deleted successfully', { variant: 'success' }); setDeleteOpen(false); fetchTypes(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to delete tracking type', { variant: 'error' }); }
  };

  const handleOpenRestore = (type) => { setSelectedType(type); setRestoreOpen(true); };
  const handleRestore = async () => {
    try { await trackingItemTypeService.restoreTrackingItemType(selectedType.id); enqueueSnackbar('Tracking type restored successfully', { variant: 'success' }); setRestoreOpen(false); fetchTypes(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to restore tracking type', { variant: 'error' }); }
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'isWbs' && value === true) newData.isLeaf = false;
      else if (field === 'isLeaf' && value === true) newData.isWbs = false;
      return newData;
    });
  };

  // ============================================
  // TRACKING AREAS HANDLERS
  // ============================================

  const handleViewAreaDetails = (area) => { setSelectedArea(area); setAreaDetailsOpen(true); };
  const handleOpenAreaCreate = () => { setAreaFormData({ trackingItemTypeId: '', parentId: '', name: '', description: '', isActive: true }); setAreaCreateOpen(true); };

  const handleAreaCreate = async () => {
    setFormLoading(true);
    try {
      await trackingAreaService.createTrackingArea(areaFormData);
      enqueueSnackbar('Tracking area created successfully', { variant: 'success' });
      setAreaCreateOpen(false); fetchAreas(); fetchDropdownOptions();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to create tracking area', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenAreaEdit = (area) => {
    setSelectedArea(area);
    setAreaFormData({ trackingItemTypeId: area.tracking_item_type_id, parentId: area.parent_id || '', name: area.name, description: area.description || '', isActive: area.is_active });
    setAreaEditOpen(true);
  };

  const handleAreaUpdate = async () => {
    setFormLoading(true);
    try {
      await trackingAreaService.updateTrackingArea(selectedArea.id, areaFormData);
      enqueueSnackbar('Tracking area updated successfully', { variant: 'success' });
      setAreaEditOpen(false); fetchAreas(); fetchDropdownOptions();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to update tracking area', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenAreaDelete = (area) => { setSelectedArea(area); setAreaDeleteOpen(true); };
  const handleAreaDelete = async () => {
    try { await trackingAreaService.deleteTrackingArea(selectedArea.id); enqueueSnackbar('Tracking area deleted successfully', { variant: 'success' }); setAreaDeleteOpen(false); fetchAreas(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to delete tracking area', { variant: 'error' }); }
  };

  const handleOpenAreaRestore = (area) => { setSelectedArea(area); setAreaRestoreOpen(true); };
  const handleAreaRestore = async () => {
    try { await trackingAreaService.restoreTrackingArea(selectedArea.id); enqueueSnackbar('Tracking area restored successfully', { variant: 'success' }); setAreaRestoreOpen(false); fetchAreas(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to restore tracking area', { variant: 'error' }); }
  };

  // ============================================
  // CHECKLISTS HANDLERS
  // ============================================

  const handleViewChecklistDetails = (checklist) => { setSelectedChecklist(checklist); setChecklistDetailsOpen(true); };
  const handleOpenChecklistCreate = () => { setChecklistFormData({ trackingAreaId: '', name: '', description: '', isActive: true }); setChecklistCreateOpen(true); };

  const handleChecklistCreate = async () => {
    setFormLoading(true);
    try {
      await checklistService.createChecklist(checklistFormData);
      enqueueSnackbar('Checklist created successfully', { variant: 'success' });
      setChecklistCreateOpen(false); fetchChecklists();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to create checklist', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenChecklistEdit = (checklist) => {
    setSelectedChecklist(checklist);
    setChecklistFormData({ trackingAreaId: checklist.tracking_area_id, name: checklist.name, description: checklist.description || '', isActive: checklist.is_active });
    setChecklistEditOpen(true);
  };

  const handleChecklistUpdate = async () => {
    setFormLoading(true);
    try {
      await checklistService.updateChecklist(selectedChecklist.id, checklistFormData);
      enqueueSnackbar('Checklist updated successfully', { variant: 'success' });
      setChecklistEditOpen(false); fetchChecklists();
    } catch (error) { enqueueSnackbar(error.message || 'Failed to update checklist', { variant: 'error' });
    } finally { setFormLoading(false); }
  };

  const handleOpenChecklistDelete = (checklist) => { setSelectedChecklist(checklist); setChecklistDeleteOpen(true); };
  const handleChecklistDelete = async () => {
    try { await checklistService.deleteChecklist(selectedChecklist.id); enqueueSnackbar('Checklist deleted successfully', { variant: 'success' }); setChecklistDeleteOpen(false); fetchChecklists(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to delete checklist', { variant: 'error' }); }
  };

  const handleOpenChecklistRestore = (checklist) => { setSelectedChecklist(checklist); setChecklistRestoreOpen(true); };
  const handleChecklistRestore = async () => {
    try { await checklistService.restoreChecklist(selectedChecklist.id); enqueueSnackbar('Checklist restored successfully', { variant: 'success' }); setChecklistRestoreOpen(false); fetchChecklists(); }
    catch (error) { enqueueSnackbar(error.message || 'Failed to restore checklist', { variant: 'error' }); }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Dashboard</Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Tracking Management</Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>Project Tracking Management</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { if (tabValue === 0) handleOpenCreate(); else if (tabValue === 1) handleOpenAreaCreate(); else handleOpenChecklistCreate(); }}
          sx={{ fontWeight: 600, borderRadius: 2, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, fontSize: '0.82rem' }}>
          New {tabValue === 0 ? 'Type' : tabValue === 1 ? 'Area' : 'Checklist'}
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: '1px solid #e2e8f0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}>
          <Tab icon={<TypeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Tracking Item Types" />
          <Tab icon={<AreaIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Tracking Areas" />
          <Tab icon={<ChecklistIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Checklists" />
        </Tabs>

        {/* TAB 1: TRACKING ITEM TYPES */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</Typography>
            </Box>
            <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />
            <TextField size="small" placeholder="Search by code or name..." value={typesSearchTerm} onChange={(e) => setTypesSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Box> }}
              sx={{ flex: '1 1 200px', maxWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }} />
            <TextField select size="small" value={typesActiveFilter} onChange={(e) => setTypesActiveFilter(e.target.value)} label="Status" InputLabelProps={{ shrink: true }}
              sx={{ flex: '0 0 130px', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
            <Box sx={{ ml: 'auto' }}><Chip label={`${typesTotalCount} types`} size="small" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }} /></Box>
          </Paper>

          {/* Types Table */}
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Type Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Structure</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {typesLoading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={36} sx={{ color: '#4f46e5' }} /></TableCell></TableRow>
                ) : types.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>No tracking types found matching criteria.</TableCell></TableRow>
                ) : (
                  types.map((type) => (
                    <TableRow key={type.id} hover sx={{ '& td': { py: 0.8 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: '#c7d2fe', color: '#4338ca' }}><TypeIcon sx={{ fontSize: 18 }} /></Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" onClick={() => handleViewDetails(type)} sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', cursor: 'pointer', '&:hover': { color: '#4f46e5', textDecoration: 'underline' } }}>{type.name}</Typography>
                              <Chip label={type.code} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created: {formatDate(type.created_at)}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                          {type.is_wbs && <Chip label="WBS-Capable" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#d1fae5', color: '#065f46' }} />}
                          {type.is_leaf && <Chip label="Leaf Node" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e' }} />}
                          {!type.is_wbs && !type.is_leaf && <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Standard</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {type.is_active ? <Chip icon={<CheckIcon sx={{ fontSize: 14 }} />} label="Active" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }} /> : <Chip icon={<CancelIcon sx={{ fontSize: 14 }} />} label="Inactive" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }} />}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 1 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details" arrow><IconButton size="small" onClick={() => handleViewDetails(type)} sx={{ p: 0.5, color: '#6366f1' }}><ViewIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                          {type.is_active ? (
                            <>
                              <Tooltip title="Edit Type" arrow><IconButton size="small" onClick={() => handleOpenEdit(type)} sx={{ p: 0.5, color: '#64748b' }}><EditIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                              <Tooltip title="Delete Type" arrow><IconButton size="small" onClick={() => handleOpenDelete(type)} sx={{ p: 0.5, color: '#dc2626' }}><DeleteIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                            </>
                          ) : <Tooltip title="Restore Type" arrow><IconButton size="small" onClick={() => handleOpenRestore(type)} sx={{ p: 0.5, color: '#059669' }}><RestoreIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={typesTotalCount} rowsPerPage={typesRowsPerPage} page={typesPage} onPageChange={(_, newPage) => setTypesPage(newPage)} onRowsPerPageChange={(e) => { setTypesRowsPerPage(parseInt(e.target.value, 10)); setTypesPage(0); }} sx={{ borderTop: '1px solid #e2e8f0' }} />
        </TabPanel>

        {/* TAB 2: TRACKING AREAS */}
        <TabPanel value={tabValue} index={1}>
          {/* Filters */}
          <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</Typography>
            </Box>
            <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />
            <TextField size="small" placeholder="Search by name..." value={areasSearchTerm} onChange={(e) => setAreasSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Box> }}
              sx={{ flex: '1 1 200px', maxWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel shrink>Type</InputLabel>
              <Select value={areasTypeFilter} onChange={(e) => setAreasTypeFilter(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' }}>
                <MenuItem value="">All Types</MenuItem>
                {trackingTypes.map((t) => (<MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField select size="small" value={areasActiveFilter} onChange={(e) => setAreasActiveFilter(e.target.value)} label="Status" InputLabelProps={{ shrink: true }}
              sx={{ flex: '0 0 130px', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
            <Box sx={{ ml: 'auto' }}><Chip label={`${areasTotalCount} areas`} size="small" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }} /></Box>
          </Paper>

          {/* Areas Table */}
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Area Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areasLoading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={36} sx={{ color: '#4f46e5' }} /></TableCell></TableRow>
                ) : areas.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>No tracking areas found matching criteria.</TableCell></TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area.id} hover sx={{ '& td': { py: 0.8 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: area.parent_id ? '#d1fae5' : '#c7d2fe', color: area.parent_id ? '#065f46' : '#4338ca' }}><AreaIcon sx={{ fontSize: 18 }} /></Avatar>
                          <Box>
                            <Typography variant="body2" onClick={() => handleViewAreaDetails(area)} sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', cursor: 'pointer', '&:hover': { color: '#4f46e5', textDecoration: 'underline' } }}>{area.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Created: {formatDate(area.created_at)}</Typography>
                              {area.parent_id && <Chip label="Phase" size="small" sx={{ height: 16, fontSize: '0.6rem', backgroundColor: '#d1fae5', color: '#065f46' }} />}
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{trackingTypes.find(t => t.id === area.tracking_item_type_id)?.name || '-'}</Typography></TableCell>
                      <TableCell>
                        {area.is_active ? <Chip icon={<CheckIcon sx={{ fontSize: 14 }} />} label="Active" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#d1fae5', color: '#065f46' }} /> : <Chip icon={<CancelIcon sx={{ fontSize: 14 }} />} label="Inactive" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b' }} />}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 1 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details" arrow><IconButton size="small" onClick={() => handleViewAreaDetails(area)} sx={{ p: 0.5, color: '#6366f1' }}><ViewIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                          {area.is_active ? (
                            <>
                              <Tooltip title="Edit Area" arrow><IconButton size="small" onClick={() => handleOpenAreaEdit(area)} sx={{ p: 0.5, color: '#64748b' }}><EditIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                              <Tooltip title="Delete Area" arrow><IconButton size="small" onClick={() => handleOpenAreaDelete(area)} sx={{ p: 0.5, color: '#dc2626' }}><DeleteIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                            </>
                          ) : <Tooltip title="Restore Area" arrow><IconButton size="small" onClick={() => handleOpenAreaRestore(area)} sx={{ p: 0.5, color: '#059669' }}><RestoreIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={areasTotalCount} rowsPerPage={areasRowsPerPage} page={areasPage} onPageChange={(_, newPage) => setAreasPage(newPage)} onRowsPerPageChange={(e) => { setAreasRowsPerPage(parseInt(e.target.value, 10)); setAreasPage(0); }} sx={{ borderTop: '1px solid #e2e8f0' }} />
        </TabPanel>

        {/* TAB 3: CHECKLISTS */}
        <TabPanel value={tabValue} index={2}>
          {/* Filters */}
          <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</Typography>
            </Box>
            <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />
            <TextField size="small" placeholder="Search by name..." value={checklistsSearchTerm} onChange={(e) => setChecklistsSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Box> }}
              sx={{ flex: '1 1 200px', maxWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel shrink>Area</InputLabel>
              <Select value={checklistsAreaFilter} onChange={(e) => setChecklistsAreaFilter(e.target.value)} displayEmpty sx={{ borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' }}>
                <MenuItem value="">All Areas</MenuItem>
                {trackingAreas.map((a) => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField select size="small" value={checklistsActiveFilter} onChange={(e) => setChecklistsActiveFilter(e.target.value)} label="Status" InputLabelProps={{ shrink: true }}
              sx={{ flex: '0 0 130px', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
            <Box sx={{ ml: 'auto' }}><Chip label={`${checklistsTotalCount} items`} size="small" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }} /></Box>
          </Paper>

          {/* Checklists Table */}
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Checklist Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Tracking Area</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checklistsLoading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={36} sx={{ color: '#4f46e5' }} /></TableCell></TableRow>
                ) : checklists.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>No checklists found matching criteria.</TableCell></TableRow>
                ) : (
                  checklists.map((checklist) => (
                    <TableRow key={checklist.id} hover sx={{ '& td': { py: 0.8 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: '#c7d2fe', color: '#4338ca' }}>
                            <ChecklistIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" onClick={() => handleViewChecklistDetails(checklist)} sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', cursor: 'pointer', '&:hover': { color: '#4f46e5', textDecoration: 'underline' } }}>{checklist.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Created: {formatDate(checklist.created_at)}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{trackingAreas.find(a => a.id === checklist.tracking_area_id)?.name || '-'}</Typography></TableCell>
                      <TableCell>
                        {checklist.is_active ? <Chip icon={<CheckIcon sx={{ fontSize: 14 }} />} label="Active" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#d1fae5', color: '#065f46' }} /> : <Chip icon={<CancelIcon sx={{ fontSize: 14 }} />} label="Inactive" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b' }} />}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 1 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details" arrow><IconButton size="small" onClick={() => handleViewChecklistDetails(checklist)} sx={{ p: 0.5, color: '#6366f1' }}><ViewIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                          {checklist.is_active ? (
                            <>
                              <Tooltip title="Edit Checklist" arrow><IconButton size="small" onClick={() => handleOpenChecklistEdit(checklist)} sx={{ p: 0.5, color: '#64748b' }}><EditIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                              <Tooltip title="Delete Checklist" arrow><IconButton size="small" onClick={() => handleOpenChecklistDelete(checklist)} sx={{ p: 0.5, color: '#dc2626' }}><DeleteIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                            </>
                          ) : <Tooltip title="Restore Checklist" arrow><IconButton size="small" onClick={() => handleOpenChecklistRestore(checklist)} sx={{ p: 0.5, color: '#059669' }}><RestoreIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={checklistsTotalCount} rowsPerPage={checklistsRowsPerPage} page={checklistsPage} onPageChange={(_, newPage) => setChecklistsPage(newPage)} onRowsPerPageChange={(e) => { setChecklistsRowsPerPage(parseInt(e.target.value, 10)); setChecklistsPage(0); }} sx={{ borderTop: '1px solid #e2e8f0' }} />
        </TabPanel>
      </Paper>

      {/* ============================================ */}
      {/* TRACKING ITEM TYPES MODALS */}
      {/* ============================================ */}

      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Type Details: {selectedType?.name}</DialogTitle>
        <DialogContent>
          {selectedType && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Code</Typography><Chip label={selectedType.code} sx={{ mt: 0.5, backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: 600 }} /></Grid>
                <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Name</Typography><Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedType.name}</Typography></Grid>
                {selectedType.description && <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Description</Typography><Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>{selectedType.description}</Typography></Grid>}
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>WBS Capable</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_wbs ? '#10b981' : '#ef4444' }}>{selectedType.is_wbs ? '✓ Can have children' : '✗ Cannot have children'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Leaf Node</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_leaf ? '#f59e0b' : '#3b82f6' }}>{selectedType.is_leaf ? '✓ Final (no children)' : '✗ Can have children'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Status</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_active ? '#10b981' : '#ef4444' }}>{selectedType.is_active ? 'Active' : 'Inactive'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Created</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(selectedType.created_at)}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Create Tracking Type</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField required fullWidth label="Code" value={formData.code} onChange={handleFormChange('code')} margin="normal" size="small" placeholder="e.g., MILESTONE" helperText="Short uppercase code used by system" />
            <TextField required fullWidth label="Name" value={formData.name} onChange={handleFormChange('name')} margin="normal" size="small" placeholder="e.g., Milestone" />
            <TextField fullWidth multiline rows={3} label="Description" value={formData.description} onChange={handleFormChange('description')} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={formData.isWbs} onChange={handleFormChange('isWbs')} disabled={formData.isLeaf} />} label="Can have children (WBS-capable)" /><Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>{formData.isLeaf ? "Cannot enable WBS when leaf is selected" : "If true, items of this type can be broken down into children"}</Typography></Box>
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={formData.isLeaf} onChange={handleFormChange('isLeaf')} disabled={formData.isWbs} />} label="Is leaf node (final, no children)" /><Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>{formData.isWbs ? "Cannot enable leaf when WBS is selected" : "If true, items of this type cannot have children"}</Typography></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} variant="contained" disabled={formLoading || !formData.code || !formData.name}>{formLoading ? 'Creating...' : 'Create Type'}</Button></DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Edit Tracking Type: {selectedType?.name}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField required fullWidth label="Code" value={formData.code} onChange={handleFormChange('code')} margin="normal" size="small" />
            <TextField required fullWidth label="Name" value={formData.name} onChange={handleFormChange('name')} margin="normal" size="small" />
            <TextField fullWidth multiline rows={3} label="Description" value={formData.description} onChange={handleFormChange('description')} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={formData.isWbs} onChange={handleFormChange('isWbs')} disabled={formData.isLeaf} />} label="Can have children (WBS-capable)" /></Box>
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={formData.isLeaf} onChange={handleFormChange('isLeaf')} disabled={formData.isWbs} />} label="Is leaf node (final, no children)" /></Box>
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={formData.isActive !== false} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />} label="Active" /></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleUpdate} variant="contained" disabled={formLoading}>{formLoading ? 'Updating...' : 'Update Type'}</Button></DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal open={deleteOpen} title="Delete Tracking Type" message={`Are you sure you want to delete the tracking type "${selectedType?.name}"? This action cannot be undone.`} onConfirm={handleDelete} onClose={() => setDeleteOpen(false)} confirmText="Delete Type" confirmColor="error" />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal open={restoreOpen} title="Restore Tracking Type" message={`Are you sure you want to restore the tracking type "${selectedType?.name}"?`} onConfirm={handleRestore} onClose={() => setRestoreOpen(false)} confirmText="Restore Type" confirmColor="success" />

      {/* ============================================ */}
      {/* TRACKING AREAS MODALS */}
      {/* ============================================ */}

      {/* Area Details Modal */}
      <Dialog open={areaDetailsOpen} onClose={() => setAreaDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Area Details: {selectedArea?.name}</DialogTitle>
        <DialogContent>
          {selectedArea && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Name</Typography><Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedArea.name}</Typography></Grid>
                {selectedArea.description && <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Description</Typography><Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>{selectedArea.description}</Typography></Grid>}
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Type</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{trackingTypes.find(t => t.id === selectedArea.tracking_item_type_id)?.name || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Parent</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{selectedArea.parent_id ? trackingAreas.find(a => a.id === selectedArea.parent_id)?.name || '-' : 'None (Top-Level)'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Status</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedArea.is_active ? '#10b981' : '#ef4444' }}>{selectedArea.is_active ? 'Active' : 'Inactive'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Created</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(selectedArea.created_at)}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setAreaDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Area Create Modal */}
      <Dialog open={areaCreateOpen} onClose={() => setAreaCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Create Tracking Area</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Tracking Item Type *</InputLabel><Select value={areaFormData.trackingItemTypeId} onChange={(e) => setAreaFormData(prev => ({ ...prev, trackingItemTypeId: e.target.value }))} displayEmpty>{trackingTypes.map((t) => (<MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>))}</Select></FormControl>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Parent Area (optional)</InputLabel><Select value={areaFormData.parentId} onChange={(e) => setAreaFormData(prev => ({ ...prev, parentId: e.target.value }))} displayEmpty><MenuItem value="">None (Top-Level)</MenuItem>{trackingAreas.map((a) => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}</Select></FormControl>
            <TextField required fullWidth label="Name" value={areaFormData.name} onChange={(e) => setAreaFormData(prev => ({ ...prev, name: e.target.value }))} margin="normal" size="small" />
            <TextField fullWidth multiline rows={3} label="Description" value={areaFormData.description} onChange={(e) => setAreaFormData(prev => ({ ...prev, description: e.target.value }))} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={areaFormData.isActive} onChange={(e) => setAreaFormData(prev => ({ ...prev, isActive: e.target.checked }))} />} label="Active" /></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setAreaCreateOpen(false)}>Cancel</Button><Button onClick={handleAreaCreate} variant="contained" disabled={formLoading || !areaFormData.trackingItemTypeId || !areaFormData.name}>{formLoading ? 'Creating...' : 'Create Area'}</Button></DialogActions>
      </Dialog>

      {/* Area Edit Modal */}
      <Dialog open={areaEditOpen} onClose={() => setAreaEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Edit Tracking Area: {selectedArea?.name}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Tracking Item Type *</InputLabel><Select value={areaFormData.trackingItemTypeId} onChange={(e) => setAreaFormData(prev => ({ ...prev, trackingItemTypeId: e.target.value }))} displayEmpty>{trackingTypes.map((t) => (<MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>))}</Select></FormControl>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Parent Area (optional)</InputLabel><Select value={areaFormData.parentId} onChange={(e) => setAreaFormData(prev => ({ ...prev, parentId: e.target.value }))} displayEmpty><MenuItem value="">None (Top-Level)</MenuItem>{trackingAreas.filter(a => a.id !== selectedArea?.id).map((a) => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}</Select></FormControl>
            <TextField required fullWidth label="Name" value={areaFormData.name} onChange={(e) => setAreaFormData(prev => ({ ...prev, name: e.target.value }))} margin="normal" size="small" />
            <TextField fullWidth multiline rows={3} label="Description" value={areaFormData.description} onChange={(e) => setAreaFormData(prev => ({ ...prev, description: e.target.value }))} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={areaFormData.isActive} onChange={(e) => setAreaFormData(prev => ({ ...prev, isActive: e.target.checked }))} />} label="Active" /></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setAreaEditOpen(false)}>Cancel</Button><Button onClick={handleAreaUpdate} variant="contained" disabled={formLoading}>{formLoading ? 'Updating...' : 'Update Area'}</Button></DialogActions>
      </Dialog>

      {/* Area Delete Confirmation Modal */}
      <ConfirmationModal open={areaDeleteOpen} title="Delete Tracking Area" message={`Are you sure you want to delete the tracking area "${selectedArea?.name}"? This action cannot be undone.`} onConfirm={handleAreaDelete} onClose={() => setAreaDeleteOpen(false)} confirmText="Delete Area" confirmColor="error" />

      {/* Area Restore Confirmation Modal */}
      <ConfirmationModal open={areaRestoreOpen} title="Restore Tracking Area" message={`Are you sure you want to restore the tracking area "${selectedArea?.name}"?`} onConfirm={handleAreaRestore} onClose={() => setAreaRestoreOpen(false)} confirmText="Restore Area" confirmColor="success" />

      {/* ============================================ */}
      {/* CHECKLISTS MODALS */}
      {/* ============================================ */}

      {/* Checklist Details Modal */}
      <Dialog open={checklistDetailsOpen} onClose={() => setChecklistDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Checklist Details: {selectedChecklist?.name}</DialogTitle>
        <DialogContent>
          {selectedChecklist && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Name</Typography><Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedChecklist.name}</Typography></Grid>
                {selectedChecklist.description && <Grid item xs={12}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Description</Typography><Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>{selectedChecklist.description}</Typography></Grid>}
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Tracking Area</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{trackingAreas.find(a => a.id === selectedChecklist.tracking_area_id)?.name || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Status</Typography><Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedChecklist.is_active ? '#10b981' : '#ef4444' }}>{selectedChecklist.is_active ? 'Active' : 'Inactive'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>Created</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(selectedChecklist.created_at)}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setChecklistDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Checklist Create Modal */}
      <Dialog open={checklistCreateOpen} onClose={() => setChecklistCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Create Checklist Item</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Tracking Area *</InputLabel><Select value={checklistFormData.trackingAreaId} onChange={(e) => setChecklistFormData(prev => ({ ...prev, trackingAreaId: e.target.value }))} displayEmpty><MenuItem value="">Select Area</MenuItem>{trackingAreas.map((a) => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}</Select></FormControl>
            <TextField required fullWidth label="Name" value={checklistFormData.name} onChange={(e) => setChecklistFormData(prev => ({ ...prev, name: e.target.value }))} margin="normal" size="small" />
            <TextField fullWidth multiline rows={3} label="Description" value={checklistFormData.description} onChange={(e) => setChecklistFormData(prev => ({ ...prev, description: e.target.value }))} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={checklistFormData.isActive} onChange={(e) => setChecklistFormData(prev => ({ ...prev, isActive: e.target.checked }))} />} label="Active" /></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setChecklistCreateOpen(false)}>Cancel</Button><Button onClick={handleChecklistCreate} variant="contained" disabled={formLoading || !checklistFormData.trackingAreaId || !checklistFormData.name}>{formLoading ? 'Creating...' : 'Create Checklist'}</Button></DialogActions>
      </Dialog>

      {/* Checklist Edit Modal */}
      <Dialog open={checklistEditOpen} onClose={() => setChecklistEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Edit Checklist Item: {selectedChecklist?.name}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" size="small"><InputLabel shrink>Tracking Area *</InputLabel><Select value={checklistFormData.trackingAreaId} onChange={(e) => setChecklistFormData(prev => ({ ...prev, trackingAreaId: e.target.value }))} displayEmpty><MenuItem value="">Select Area</MenuItem>{trackingAreas.map((a) => (<MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>))}</Select></FormControl>
            <TextField required fullWidth label="Name" value={checklistFormData.name} onChange={(e) => setChecklistFormData(prev => ({ ...prev, name: e.target.value }))} margin="normal" size="small" />
            <TextField fullWidth multiline rows={3} label="Description" value={checklistFormData.description} onChange={(e) => setChecklistFormData(prev => ({ ...prev, description: e.target.value }))} margin="normal" size="small" />
            <Box sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={checklistFormData.isActive} onChange={(e) => setChecklistFormData(prev => ({ ...prev, isActive: e.target.checked }))} />} label="Active" /></Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setChecklistEditOpen(false)}>Cancel</Button><Button onClick={handleChecklistUpdate} variant="contained" disabled={formLoading}>{formLoading ? 'Updating...' : 'Update Checklist'}</Button></DialogActions>
      </Dialog>

      {/* Checklist Delete Confirmation Modal */}
      <ConfirmationModal open={checklistDeleteOpen} title="Delete Checklist Item" message={`Are you sure you want to delete the checklist item "${selectedChecklist?.name}"? This action cannot be undone.`} onConfirm={handleChecklistDelete} onClose={() => setChecklistDeleteOpen(false)} confirmText="Delete Checklist" confirmColor="error" />

      {/* Checklist Restore Confirmation Modal */}
      <ConfirmationModal open={checklistRestoreOpen} title="Restore Checklist Item" message={`Are you sure you want to restore the checklist item "${selectedChecklist?.name}"?`} onConfirm={handleChecklistRestore} onClose={() => setChecklistRestoreOpen(false)} confirmText="Restore Checklist" confirmColor="success" />
    </Box>
  );
};

export default ProjectTrackingTypePage;
