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
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { trackingItemTypeService } from '../../services/projectServices';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const ProjectTrackingTypePage = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Data list
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  // Modal states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isWbs: false,
    isLeaf: false,
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch tracking item types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const isActiveValue = activeFilter === 'all' ? null : activeFilter === 'true';
      
      const result = await trackingItemTypeService.getTrackingItemTypes({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        isActive: isActiveValue,
      });

      const typesData = result?.trackingItemTypes || result?.data?.trackingItemTypes || [];
      const total = result?.pagination?.total || result?.data?.pagination?.total || 0;

      setTypes(typesData);
      setTotalCount(total);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load tracking types', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [page, rowsPerPage, activeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) fetchTypes();
      else setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Handle view details
  const handleViewDetails = (type) => {
    setSelectedType(type);
    setDetailsOpen(true);
  };

  // Handle create
  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      isWbs: false,
      isLeaf: false,
      isActive: true,
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await trackingItemTypeService.createTrackingItemType(formData);
      enqueueSnackbar('Tracking type created successfully', { variant: 'success' });
      setCreateOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to create tracking type', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit
  const handleOpenEdit = (type) => {
    setSelectedType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      isWbs: type.is_wbs,
      isLeaf: type.is_leaf,
      isActive: type.is_active,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      await trackingItemTypeService.updateTrackingItemType(selectedType.id, formData);
      enqueueSnackbar('Tracking type updated successfully', { variant: 'success' });
      setEditOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update tracking type', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleOpenDelete = (type) => {
    setSelectedType(type);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await trackingItemTypeService.deleteTrackingItemType(selectedType.id);
      enqueueSnackbar('Tracking type deleted successfully', { variant: 'success' });
      setDeleteOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete tracking type', { variant: 'error' });
    }
  };

  // Handle restore
  const handleOpenRestore = (type) => {
    setSelectedType(type);
    setRestoreOpen(true);
  };

  const handleRestore = async () => {
    try {
      await trackingItemTypeService.restoreTrackingItemType(selectedType.id);
      enqueueSnackbar('Tracking type restored successfully', { variant: 'success' });
      setRestoreOpen(false);
      fetchTypes();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to restore tracking type', { variant: 'error' });
    }
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Apply WBS/Leaf validation rules
      if (field === 'isWbs' && value === true) {
        // If setting isWbs to true, ensure isLeaf is false
        newData.isLeaf = false;
      } else if (field === 'isLeaf' && value === true) {
        // If setting isLeaf to true, ensure isWbs is false
        newData.isWbs = false;
      }
      
      return newData;
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Tracking Types
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Project Tracking Types
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            fontSize: '0.82rem',
          }}
        >
          New Type
        </Button>
      </Box>

      {/* Filters Panel */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Filters
          </Typography>
        </Box>
        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Box>,
          }}
          sx={{
            flex: '1 1 200px',
            maxWidth: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.8rem',
              backgroundColor: '#f8fafc',
            },
          }}
        />

        {/* Status Filter */}
        <TextField
          select
          size="small"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          label="Status"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: '0 0 130px',
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
          }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${totalCount} types`}
            size="small"
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          />
        </Box>
      </Paper>

      {/* Types Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No tracking types found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id} hover sx={{ '& td': { py: 0.8 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: '#c7d2fe', color: '#4338ca' }}>
                          <TypeIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              onClick={() => handleViewDetails(type)}
                              sx={{
                                fontWeight: 700,
                                color: '#0f172a',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                              }}
                            >
                              {type.name}
                            </Typography>
                            <Chip
                              label={type.code}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            Created: {formatDate(type.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                        {type.is_wbs && (
                          <Chip
                            label="WBS-Capable"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                            }}
                          />
                        )}
                        {type.is_leaf && (
                          <Chip
                            label="Leaf Node"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                            }}
                          />
                        )}
                        {!type.is_wbs && !type.is_leaf && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            Standard
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {type.is_active ? (
                        <Chip
                          icon={<CheckIcon sx={{ fontSize: 14 }} />}
                          label="Active"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            border: '1px solid #6ee7b7',
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon sx={{ fontSize: 14 }} />}
                          label="Inactive"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fca5a5',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(type)}
                            sx={{ p: 0.5, color: '#6366f1' }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        
                        {type.is_active ? (
                          <>
                            <Tooltip title="Edit Type" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(type)}
                                sx={{ p: 0.5, color: '#64748b' }}
                              >
                                <EditIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete Type" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDelete(type)}
                                sx={{ p: 0.5, color: '#dc2626' }}
                              >
                                <DeleteIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Restore Type" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenRestore(type)}
                              sx={{ p: 0.5, color: '#059669' }}
                            >
                              <RestoreIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Type Details: {selectedType?.name}
        </DialogTitle>
        <DialogContent>
          {selectedType && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Code
                  </Typography>
                  <Chip
                    label={selectedType.code}
                    sx={{
                      mt: 0.5,
                      backgroundColor: '#e0e7ff',
                      color: '#4f46e5',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedType.name}
                  </Typography>
                </Grid>
                
                {selectedType.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>
                      {selectedType.description}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    WBS Capable
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_wbs ? '#10b981' : '#ef4444' }}>
                    {selectedType.is_wbs ? '✓ Can have children' : '✗ Cannot have children'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Leaf Node
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_leaf ? '#f59e0b' : '#3b82f6' }}>
                    {selectedType.is_leaf ? '✓ Final (no children)' : '✗ Can have children'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Status
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: selectedType.is_active ? '#10b981' : '#ef4444' }}>
                    {selectedType.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {formatDate(selectedType.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Create Tracking Type
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Code"
              value={formData.code}
              onChange={handleFormChange('code')}
              margin="normal"
              size="small"
              placeholder="e.g., MILESTONE"
              helperText="Short uppercase code used by system"
            />
            
            <TextField
              required
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleFormChange('name')}
              margin="normal"
              size="small"
              placeholder="e.g., Milestone"
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              margin="normal"
              size="small"
            />
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isWbs}
                    onChange={handleFormChange('isWbs')}
                    disabled={formData.isLeaf}
                  />
                }
                label="Can have children (WBS-capable)"
              />
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>
                {formData.isLeaf 
                  ? "Cannot enable WBS when leaf is selected"
                  : "If true, items of this type can be broken down into children"}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isLeaf}
                    onChange={handleFormChange('isLeaf')}
                    disabled={formData.isWbs}
                  />
                }
                label="Is leaf node (final, no children)"
              />
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>
                {formData.isWbs 
                  ? "Cannot enable leaf when WBS is selected"
                  : "If true, items of this type cannot have children"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={formLoading || !formData.code || !formData.name}
          >
            {formLoading ? 'Creating...' : 'Create Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Edit Tracking Type: {selectedType?.name}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Code"
              value={formData.code}
              onChange={handleFormChange('code')}
              margin="normal"
              size="small"
            />
            
            <TextField
              required
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleFormChange('name')}
              margin="normal"
              size="small"
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              margin="normal"
              size="small"
            />
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isWbs}
                    onChange={handleFormChange('isWbs')}
                    disabled={formData.isLeaf}
                  />
                }
                label="Can have children (WBS-capable)"
              />
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>
                {formData.isLeaf 
                  ? "Cannot enable WBS when leaf is selected"
                  : "If true, items of this type can be broken down into children"}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isLeaf}
                    onChange={handleFormChange('isLeaf')}
                    disabled={formData.isWbs}
                  />
                }
                label="Is leaf node (final, no children)"
              />
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', ml: 4 }}>
                {formData.isWbs 
                  ? "Cannot enable leaf when WBS is selected"
                  : "If true, items of this type cannot have children"}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={formLoading}
          >
            {formLoading ? 'Updating...' : 'Update Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteOpen}
        title="Delete Tracking Type"
        message={`Are you sure you want to delete the tracking type "${selectedType?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
        confirmText="Delete Type"
        confirmColor="error"
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        open={restoreOpen}
        title="Restore Tracking Type"
        message={`Are you sure you want to restore the tracking type "${selectedType?.name}"?`}
        onConfirm={handleRestore}
        onClose={() => setRestoreOpen(false)}
        confirmText="Restore Type"
        confirmColor="success"
      />
    </Box>
  );
};

export default ProjectTrackingTypePage;
