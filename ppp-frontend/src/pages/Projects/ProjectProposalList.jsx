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
  CircularProgress,
  Avatar,
  Divider,
  MenuItem,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  FilePresent as ProposalIcon,
  Publish as SubmitIcon,
  MonetizationOn as MoneyIcon,
  Business as OrgIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectCategoryService } from '../../services/projectServices/projectCategoryService';
import { proposalStatusService, currencyService } from '../../services/foundationService';
import { organizationService } from '../../services/organizationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';
import { SubmitProposalDialog } from '../../components/Projects/SubmitProposalDialog';

export const ProjectProposalList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // Data list
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  // Lookups
  const [statuses, setStatuses] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Confirmation Modals
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load Filter Lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [statusRes, orgRes, catRes] = await Promise.all([
          proposalStatusService.getProposalStatuses({ limit: 100, status: 'active' }),
          organizationService.getOrganizations({ limit: 100 }),
          projectCategoryService.getProjectCategories({ limit: 100, status: 'active' }),
        ]);
        setStatuses(statusRes.proposalStatuses || statusRes.rows || []);
        setOrganizations(orgRes.organizations || orgRes.rows || []);
        setCategories(catRes.projectCategories || catRes.rows || []);
      } catch (err) {
        console.error('Failed to load filter lookup options:', err);
      }
    };
    loadLookups();
  }, []);

  // Fetch Proposals
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const statusId = statusFilter === 'all' ? '' : statusFilter;
      const organizationId = orgFilter === 'all' ? '' : orgFilter;
      const categoryId = catFilter === 'all' ? '' : catFilter;

      const result = await projectProposalService.getProposals({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        statusId,
        organizationId,
        categoryId,
      });

      setProposals(result.proposals || result.rows || []);
      setTotalCount(result.pagination?.total || result.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load project proposals', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [page, rowsPerPage, statusFilter, orgFilter, catFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) fetchProposals();
      else setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const isDraftProposal = (prop) => {
    if (prop.status_step != null) return Number(prop.status_step) === 0;
    const status = statuses.find((s) => s.id === prop.status_id);
    return Number(status?.step) === 0;
  };

  // Submit Proposal action
  const handleSubmitConfirm = async (reviewerIds, dueDate) => {
    if (!selectedProposal) return;
    setSubmitLoading(true);
    try {
      await projectProposalService.submitProposal(selectedProposal.id, reviewerIds, dueDate);
      enqueueSnackbar('Proposal submitted successfully and reviewers assigned', { variant: 'success' });
      setSubmitOpen(false);
      fetchProposals();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to submit proposal', { variant: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Proposal action
  const handleDeleteConfirm = async () => {
    if (!selectedProposal) return;
    setDeleteLoading(true);
    try {
      const res = await projectProposalService.deleteProposal(selectedProposal.id);
      enqueueSnackbar(res.message || 'Proposal deleted successfully', { variant: 'success' });
      setDeleteOpen(false);
      fetchProposals();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete proposal', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
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
              Proposals
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Project Proposals List
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/proposals/new')}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            fontSize: '0.82rem',
          }}
        >
          New Proposal
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
          placeholder="Search proposal name..."
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

        {/* Organization Filter */}
        <TextField
          select
          size="small"
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          label="Developer"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: '1 1 150px',
            maxWidth: 200,
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
          }}
        >
          <MenuItem value="all">All Developers</MenuItem>
          {organizations.map((org) => (
            <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
          ))}
        </TextField>

        {/* Category Filter */}
        <TextField
          select
          size="small"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          label="Category"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: '1 1 150px',
            maxWidth: 200,
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
          }}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </TextField>

        {/* Status Filter */}
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          label="Status"
          InputLabelProps={{ shrink: true }}
          sx={{
            flex: '0 0 130px',
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
          }}
        >
          <MenuItem value="all">All Status</MenuItem>
          {statuses.map((st) => (
            <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>
          ))}
        </TextField>

        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${totalCount} proposals`}
            size="small"
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          />
        </Box>
      </Paper>

      {/* Proposals Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Proposal Details</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Developer</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Capital Requirement</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Submission</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No proposals found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((prop) => (
                  <TableRow key={prop.id} hover sx={{ '& td': { py: 0.8 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: '#c7d2fe', color: '#4338ca' }}>
                          <ProposalIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            onClick={() => navigate(`/projects/proposals/${prop.id}`)}
                            sx={{
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                            }}
                          >
                            {prop.proposed_project_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            Created: {formatDate(prop.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <OrgIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', fontWeight: 600 }}>
                          {prop.organization_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {prop.project_category_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', fontWeight: 700 }}>
                          {prop.proposed_capital_amount ? Number(prop.proposed_capital_amount).toLocaleString() : 'N/A'} {prop.currency_code || ''}
                        </Typography>
                      </Box>
                      {prop.land_requested && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                          Land: {prop.land_requested}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prop.status_name}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {prop.submitted_at ? (
                        <Chip
                          label={`Submitted ${formatDate(prop.submitted_at)}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          label="Draft"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        {!prop.submitted_at && (
                          <Tooltip title="Submit Proposal" arrow>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedProposal(prop); setSubmitOpen(true); }}
                              sx={{ p: 0.5, color: '#10b981' }}
                            >
                              <SubmitIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/projects/proposals/${prop.id}`)}
                            sx={{ p: 0.5, color: '#6366f1' }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        {isDraftProposal(prop) && (
                          <Tooltip title="Edit Proposal" arrow>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/projects/proposals/${prop.id}/edit`)}
                              sx={{ p: 0.5, color: '#64748b' }}
                            >
                              <EditIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isDraftProposal(prop) && (
                          <Tooltip title="Delete Proposal" arrow>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedProposal(prop); setDeleteOpen(true); }}
                              sx={{ p: 0.5, color: '#dc2626' }}
                            >
                              <DeleteIcon sx={{ fontSize: 17 }} />
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

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={deleteOpen}
        title="Delete Project Proposal"
        message={`Are you sure you want to delete the proposal "${selectedProposal?.proposed_project_name}"?`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
        loading={deleteLoading}
        confirmText="Delete Proposal"
        confirmColor="error"
      />

      <SubmitProposalDialog
        open={submitOpen}
        proposal={selectedProposal}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmitConfirm}
        loading={submitLoading}
      />
    </Box>
  );
};

export default ProjectProposalList;
