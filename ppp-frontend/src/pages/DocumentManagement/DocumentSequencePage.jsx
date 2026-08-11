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
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Tag as SequenceIcon,
  Refresh as ResetIcon,
  Close as CloseIcon,
  Tune as ConfigIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { documentSequenceService } from '../../services/projectServices/documentSequenceService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const EMPTY_FORM = {
  entityType:    '',
  prefix:        '',
  suffix:        '',
  paddingLength: 4,
  currentYear:   new Date().getFullYear(),
  resetYearly:   true,
  nextSequence:  1,
  isActive:      true,
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper: preview the formatted number given current form values
// ──────────────────────────────────────────────────────────────────────────────
const previewNumber = (form) => {
  const padded = String(form.nextSequence || 1).padStart(Number(form.paddingLength) || 4, '0');
  const year   = form.resetYearly ? `${form.currentYear || new Date().getFullYear()}-` : '';
  return `${form.prefix || '???'}${year}${padded}${form.suffix || ''}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// Details Dialog
// ──────────────────────────────────────────────────────────────────────────────
const DetailsDialog = ({ open, seq, onClose, onEdit, onReset }) => {
  const [resetYear, setResetYear] = useState(new Date().getFullYear());
  if (!seq) return null;

  const DetailRow = ({ label, value }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 1, py: 0.8, borderBottom: '1px solid #f1f5f9' }}>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', alignSelf: 'center' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.83rem', wordBreak: 'break-all' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#eef2ff' }}>
            <SequenceIcon sx={{ fontSize: 20, color: '#4f46e5' }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Sequence Details
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{seq.entity_type}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {/* Live preview */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>
            Next Generated Number
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: '#4f46e5', mt: 0.3 }}>
            {previewNumber({ ...seq, prefix: seq.prefix, suffix: seq.suffix, paddingLength: seq.padding_length, currentYear: seq.current_year, resetYearly: seq.reset_yearly, nextSequence: seq.next_sequence })}
          </Typography>
        </Box>

        <DetailRow label="Entity Type"     value={seq.entity_type} />
        <DetailRow label="Prefix"          value={seq.prefix} />
        <DetailRow label="Suffix"          value={seq.suffix || 'None'} />
        <DetailRow label="Padding Length"  value={seq.padding_length} />
        <DetailRow label="Next Sequence #" value={seq.next_sequence} />
        <DetailRow label="Current Year"    value={seq.current_year} />
        <DetailRow label="Reset Yearly"    value={seq.reset_yearly ? 'Yes' : 'No'} />
        <DetailRow label="Active"          value={seq.is_active ? 'Yes' : 'No'} />
        <DetailRow label="Created"         value={formatDate(seq.created_at)} />
        <DetailRow label="Updated"         value={formatDate(seq.updated_at)} />

        <Divider sx={{ my: 2 }} />

        {/* Reset counter panel */}
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Reset Sequence Counter
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              type="number"
              label="Year"
              value={resetYear}
              onChange={(e) => setResetYear(Number(e.target.value))}
              sx={{ width: 120 }}
              inputProps={{ min: 2000, max: 2100 }}
            />
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<ResetIcon />}
              onClick={() => onReset(seq.id, resetYear)}
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            >
              Reset to 1
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Close</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(seq)}
          sx={{ backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, borderRadius: 2, fontWeight: 600 }}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Create / Edit Dialog
// ──────────────────────────────────────────────────────────────────────────────
const SequenceFormDialog = ({ open, mode, initial, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initial) {
        setForm({
          entityType:    initial.entity_type    || '',
          prefix:        initial.prefix         || '',
          suffix:        initial.suffix         || '',
          paddingLength: initial.padding_length ?? 4,
          currentYear:   initial.current_year   ?? new Date().getFullYear(),
          resetYearly:   initial.reset_yearly   ?? true,
          nextSequence:  initial.next_sequence  ?? 1,
          isActive:      initial.is_active      ?? true,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, mode, initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const labelStyle = { color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', mb: 0.4, display: 'block' };
  const fieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.83rem', backgroundColor: '#f8fafc' },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: mode === 'edit' ? '#fef3c7' : '#eef2ff' }}>
            {mode === 'edit' ? <EditIcon sx={{ fontSize: 18, color: '#d97706' }} /> : <AddIcon sx={{ fontSize: 18, color: '#4f46e5' }} />}
          </Avatar>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
            {mode === 'edit' ? 'Edit Sequence' : 'New Document Sequence'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {/* Live preview */}
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>
            Preview
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#4f46e5', mt: 0.3 }}>
            {previewNumber(form)}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {/* Entity Type */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="caption" sx={labelStyle}>Entity Type *</Typography>
            <TextField
              fullWidth size="small" value={form.entityType}
              onChange={set('entityType')}
              placeholder="e.g. project_proposal"
              disabled={mode === 'edit'}
              sx={fieldSx}
            />
          </Box>

          {/* Prefix */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Prefix *</Typography>
            <TextField fullWidth size="small" value={form.prefix} onChange={set('prefix')} placeholder="e.g. PROP-" sx={fieldSx} />
          </Box>

          {/* Suffix */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Suffix (optional)</Typography>
            <TextField fullWidth size="small" value={form.suffix} onChange={set('suffix')} placeholder="e.g. -DRAFT" sx={fieldSx} />
          </Box>

          {/* Padding Length */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Padding Length</Typography>
            <TextField fullWidth size="small" type="number" value={form.paddingLength}
              onChange={(e) => setForm((f) => ({ ...f, paddingLength: Number(e.target.value) }))}
              inputProps={{ min: 1, max: 10 }} sx={fieldSx} />
          </Box>

          {/* Next Sequence */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Next Sequence #</Typography>
            <TextField fullWidth size="small" type="number" value={form.nextSequence}
              onChange={(e) => setForm((f) => ({ ...f, nextSequence: Number(e.target.value) }))}
              inputProps={{ min: 1 }} sx={fieldSx} />
          </Box>

          {/* Current Year */}
          <Box>
            <Typography variant="caption" sx={labelStyle}>Current Year</Typography>
            <TextField fullWidth size="small" type="number" value={form.currentYear}
              onChange={(e) => setForm((f) => ({ ...f, currentYear: Number(e.target.value) }))}
              inputProps={{ min: 2000, max: 2100 }} sx={fieldSx} />
          </Box>

          {/* Toggles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={<Switch checked={form.resetYearly} onChange={toggle('resetYearly')} size="small" color="primary" />}
              label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>Reset Yearly</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={toggle('isActive')} size="small" color="success" />}
              label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>Active</Typography>}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(form)}
          disabled={loading || !form.entityType || !form.prefix}
          sx={{ backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, borderRadius: 2, fontWeight: 600, minWidth: 100 }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : mode === 'edit' ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export const DocumentSequencePage = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [sequences, setSequences]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [selectedSeq, setSelectedSeq] = useState(null);
  const [formMode, setFormMode]       = useState('create'); // 'create' | 'edit'
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchSequences = async () => {
    setLoading(true);
    try {
      const result = await documentSequenceService.getSequences({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });
      setSequences(result?.sequences || result?.data?.sequences || []);
      setTotalCount(result?.pagination?.total || result?.data?.pagination?.total || 0);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load document sequences', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSequences(); }, [page, rowsPerPage]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (page === 0) fetchSequences();
      else setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ─── CRUD handlers ────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setFormLoading(true);
    try {
      await documentSequenceService.createSequence({
        entityType:    form.entityType,
        prefix:        form.prefix,
        suffix:        form.suffix   || null,
        paddingLength: form.paddingLength,
        currentYear:   form.currentYear,
        resetYearly:   form.resetYearly,
        nextSequence:  form.nextSequence,
      });
      enqueueSnackbar('Sequence created successfully', { variant: 'success' });
      setFormOpen(false);
      fetchSequences();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to create sequence', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (form) => {
    if (!selectedSeq) return;
    setFormLoading(true);
    try {
      await documentSequenceService.updateSequence(selectedSeq.id, {
        prefix:        form.prefix,
        suffix:        form.suffix   || null,
        paddingLength: form.paddingLength,
        currentYear:   form.currentYear,
        resetYearly:   form.resetYearly,
        nextSequence:  form.nextSequence,
        isActive:      form.isActive,
      });
      enqueueSnackbar('Sequence updated successfully', { variant: 'success' });
      setFormOpen(false);
      fetchSequences();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update sequence', { variant: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSeq) return;
    setDeleteLoading(true);
    try {
      await documentSequenceService.deleteSequence(selectedSeq.id);
      enqueueSnackbar('Sequence deleted successfully', { variant: 'success' });
      setDeleteOpen(false);
      fetchSequences();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to delete sequence', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReset = async (id, year) => {
    try {
      const updated = await documentSequenceService.resetSequence(id, year);
      enqueueSnackbar(`Sequence reset to 1 for ${year}`, { variant: 'success' });
      // Refresh selected seq and list
      const fresh = await documentSequenceService.getSequenceById(id);
      setSelectedSeq(fresh?.data || fresh);
      fetchSequences();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to reset sequence', { variant: 'error' });
    }
  };

  const openEdit = (seq) => {
    setSelectedSeq(seq);
    setFormMode('edit');
    setDetailsOpen(false);
    setFormOpen(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Document Sequences
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Document Sequences
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setFormMode('create'); setSelectedSeq(null); setFormOpen(true); }}
          sx={{ fontWeight: 600, borderRadius: 2, backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, fontSize: '0.82rem' }}
        >
          New Sequence
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8rem' }}>
        Document sequences define how auto-generated document numbers are formatted (e.g. <strong>PROP-2026-0001</strong>). Each entity type has its own sequence counter.
      </Alert>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filters
          </Typography>
        </Box>
        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0' }} />
        <TextField
          size="small"
          placeholder="Search entity type or prefix…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment> }}
          sx={{ flex: '1 1 220px', maxWidth: 340, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }}
        />
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${totalCount} sequences`}
            size="small"
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          />
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 780 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Entity Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Format Preview</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Next #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Reset Yearly</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={34} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : sequences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                    No sequences found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sequences.map((seq) => {
                  const preview = previewNumber({
                    prefix: seq.prefix, suffix: seq.suffix, paddingLength: seq.padding_length,
                    currentYear: seq.current_year, resetYearly: seq.reset_yearly, nextSequence: seq.next_sequence,
                  });
                  return (
                    <TableRow key={seq.id} hover sx={{ '& td': { py: 0.9 } }}>
                      {/* Entity Type */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#eef2ff' }}>
                            <ConfigIcon sx={{ fontSize: 16, color: '#4f46e5' }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                            {seq.entity_type}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Preview */}
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', bgcolor: '#eef2ff', display: 'inline-block', px: 0.8, py: 0.2, borderRadius: 1 }}>
                          {preview}
                        </Typography>
                      </TableCell>

                      {/* Next # */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem' }}>
                          {seq.next_sequence}
                        </Typography>
                      </TableCell>

                      {/* Year */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
                          {seq.current_year || '—'}
                        </Typography>
                      </TableCell>

                      {/* Reset Yearly */}
                      <TableCell>
                        <Chip
                          label={seq.reset_yearly ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.7rem', fontWeight: 700,
                            backgroundColor: seq.reset_yearly ? '#dcfce7' : '#f1f5f9',
                            color: seq.reset_yearly ? '#16a34a' : '#64748b',
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={seq.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.7rem', fontWeight: 700,
                            backgroundColor: seq.is_active ? '#d1fae5' : '#fee2e2',
                            color: seq.is_active ? '#065f46' : '#991b1b',
                          }}
                        />
                      </TableCell>

                      {/* Updated */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {formatDate(seq.updated_at)}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ pr: 1 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details" arrow>
                            <IconButton size="small" onClick={() => { setSelectedSeq(seq); setDetailsOpen(true); }} sx={{ p: 0.5, color: '#6366f1' }}>
                              <ViewIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit" arrow>
                            <IconButton size="small" onClick={() => openEdit(seq)} sx={{ p: 0.5, color: '#64748b' }}>
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete" arrow>
                            <IconButton size="small" onClick={() => { setSelectedSeq(seq); setDeleteOpen(true); }} sx={{ p: 0.5, color: '#dc2626' }}>
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>

      {/* Details Dialog */}
      <DetailsDialog
        open={detailsOpen}
        seq={selectedSeq}
        onClose={() => setDetailsOpen(false)}
        onEdit={openEdit}
        onReset={handleReset}
      />

      {/* Create / Edit Dialog */}
      <SequenceFormDialog
        open={formOpen}
        mode={formMode}
        initial={selectedSeq}
        onClose={() => setFormOpen(false)}
        onSubmit={formMode === 'edit' ? handleUpdate : handleCreate}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={deleteOpen}
        title="Delete Document Sequence"
        message={`Are you sure you want to delete the sequence for "${selectedSeq?.entity_type}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
        loading={deleteLoading}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
};

export default DocumentSequencePage;
