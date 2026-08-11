import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Avatar,
  MenuItem,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelledIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectReviewersService } from '../../services/projectServices/projectReviewersService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Approved: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  Cancelled: { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' },
};

const StatusChip = ({ status }) => {
  const style = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.7rem',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    />
  );
};

export const ProjectReviewPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  // Data list
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [proposalFilter, setProposalFilter] = useState('all');

  // Lookups
  const [proposals, setProposals] = useState([]);

  // Load proposal lookups from the logged-in user's assignments only
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const result = await projectReviewersService.getReviewers({ limit: 200 });
        const unique = new Map();
        (result.reviewers || []).forEach((r) => {
          if (r.proposal_id && !unique.has(r.proposal_id)) {
            unique.set(r.proposal_id, {
              id: r.proposal_id,
              proposed_project_name: r.proposal_name || r.proposal_id,
            });
          }
        });
        setProposals(Array.from(unique.values()));
      } catch (err) {
        console.error('Failed to load assigned proposals:', err);
      }
    };
    if (user?.id) loadLookups();
  }, [user?.id]);

  // Fetch reviewers
  const fetchReviewers = async () => {
    setLoading(true);
    try {
      const result = await projectReviewersService.getReviewers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        proposalId: proposalFilter === 'all' ? '' : proposalFilter,
        status: statusFilter,
      });

      setReviewers(result.reviewers || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load reviewers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
  }, [page, rowsPerPage, statusFilter, proposalFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) fetchReviewers();
      else setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />;
      case 'Rejected': return <CancelledIcon sx={{ fontSize: 14, color: '#dc2626' }} />;
      default: return <PendingIcon sx={{ fontSize: 14, color: '#d97706' }} />;
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
            <Link underline="hover" color="inherit" component={RouterLink} to="/projects/proposals" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Proposals
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              My Reviews
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            My Review Assignments
          </Typography>
        </Box>
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
          <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
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

        {/* Proposal Filter */}
        <FormControl size="small" sx={{ flex: '1 1 200px', maxWidth: 280 }}>
          <InputLabel shrink>Proposal</InputLabel>
          <Select
            value={proposalFilter}
            onChange={(e) => setProposalFilter(e.target.value)}
            label="Proposal"
            sx={{ borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' }}
          >
            <MenuItem value="all">All Proposals</MenuItem>
            {proposals.map((prop) => (
              <MenuItem key={prop.id} value={prop.id}>
                {prop.proposed_project_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl size="small" sx={{ flex: '0 0 130px' }}>
          <InputLabel shrink>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            sx={{ borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${totalCount} assignments`}
            size="small"
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          />
        </Box>
      </Paper>

      {/* Reviewers Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Reviewer</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Proposal</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem', textAlign: 'center' }}>Approvers</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Assigned</TableCell>
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
              ) : reviewers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No review assignments found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                reviewers.map((reviewer) => (
                  <TableRow key={reviewer.id} hover sx={{ '& td': { py: 0.8 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                            {reviewer.reviewer_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            {reviewer.reviewer_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        onClick={() => navigate(`/projects/reviews/${reviewer.id}`)}
                        sx={{
                          fontWeight: 600,
                          color: '#4f46e5',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {reviewer.proposal_name || reviewer.proposal_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        icon={<GroupIcon sx={{ fontSize: 14 }} />}
                        label={`${reviewer.total_approvers ?? reviewer.totalApprovers ?? 0}/${reviewer.total_revieweers ?? reviewer.totalRevieweers ?? 0}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#eef2ff',
                          color: '#3730a3',
                          border: '1px solid #c7d2fe',
                          '& .MuiChip-icon': { color: '#6366f1' },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {reviewer.due_date ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 14, color: '#d97706' }} />
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
                            {formatDateTime(reviewer.due_date)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          No due date
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusIcon(reviewer.status)}
                        <StatusChip status={reviewer.status} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {formatDate(reviewer.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/projects/reviews/${reviewer.id}`)}
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          borderColor: '#4f46e5',
                          color: '#4f46e5',
                          borderRadius: 1.5,
                          py: 0.4,
                          px: 1.5,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#eef2ff',
                            borderColor: '#4f46e5',
                          },
                        }}
                      >
                        Approve Proposal
                      </Button>
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
    </Box>
  );
};

export default ProjectReviewPage;