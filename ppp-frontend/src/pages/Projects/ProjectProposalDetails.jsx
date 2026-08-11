import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as SubmitIcon,
  Business as OrgIcon,
  Category as CatIcon,
  MonetizationOn as MoneyIcon,
  Terrain as LandIcon,
  CalendarToday as DateIcon,
  InsertDriveFile as FileIcon,
  CloudDownload as DownloadIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectReviewersService } from '../../services/projectServices/projectReviewersService';
import { proposalReviewService } from '../../services/projectServices/proposalReviewService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';
import { SubmitProposalDialog } from '../../components/Projects/SubmitProposalDialog';
import { ReviewStatisticsDialog } from '../../components/Projects/ReviewStatisticsDialog';

const STATUS_COLORS = {
  Draft: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  Pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  'Under Review': { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Approved: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const StatusChip = ({ status }) => {
  const style = STATUS_COLORS[status] || STATUS_COLORS.Draft;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 24,
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    />
  );
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Define grid item component for consistent styling
const GridItem = ({ label, value, highlight = false, icon: Icon }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      {Icon && <Icon sx={{ color: '#6366f1', fontSize: 18 }} />}
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600, color: '#334155' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export const ProjectProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [proposal, setProposal] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirmation Modals
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await projectProposalService.getProposalById(id);
      setProposal(data);
      
      // Fetch reviewers if proposal is submitted
      if (data.submitted_at) {
        try {
          const reviewersData = await projectReviewersService.getReviewersByProposalId(id);
          setReviewers(reviewersData.data || reviewersData || []);
        } catch (err) {
          console.error('Failed to load reviewers:', err);
        }
      }
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load proposal details', { variant: 'error' });
      navigate('/projects/proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSubmitConfirm = async (reviewerIds, dueDate) => {
    setSubmitLoading(true);
    try {
      await projectProposalService.submitProposal(id, reviewerIds, dueDate);
      enqueueSnackbar('Proposal submitted to review successfully', { variant: 'success' });
      setSubmitOpen(false);
      fetchDetails();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to submit proposal', { variant: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await projectProposalService.deleteProposal(id);
      enqueueSnackbar(res.message || 'Proposal deleted successfully', { variant: 'success' });
      setDeleteOpen(false);
      navigate('/projects/proposals');
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to delete proposal', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Check & Proceed
  const handleCheckAndProceed = () => {
    setStatisticsOpen(true);
  };

  // Handle Statistics Submit
  const handleStatisticsSubmit = async (manualStatusId = null) => {
    setStatisticsLoading(true);
    try {
      const result = await proposalReviewService.proceedProposal(id, manualStatusId);
      const data = result.data || result;
      
      if (data.wasManual) {
        enqueueSnackbar('Proposal status updated with your selection', { variant: 'success' });
      } else {
        enqueueSnackbar(`Proposal status automatically updated to: ${data.statusName}`, { variant: 'success' });
      }
      
      setStatisticsOpen(false);
      fetchDetails();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to proceed', { variant: 'error' });
    } finally {
      setStatisticsLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  if (!proposal) return null;

  const isDraft = !proposal.submitted_at;
  const canEdit = Number(proposal.status_step) === 0;

  // Check if proposal is in step 2 and all reviewers completed
  const canCheckAndProceed = () => {
    if (proposal.status_step == null) return false;
    const step = Number(proposal.status_step);
    if (step !== 2) return false;
    
    // Check if all reviewers have completed
    const allCompleted = reviewers.length > 0 && reviewers.every(r => r.status === 'Completed');
    return allCompleted;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects/proposals')}
          sx={{ color: '#64748b' }}
        >
          Back
        </Button>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" component={RouterLink} to="/projects/proposals" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Proposals
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Proposal Details
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Content - CSS Grid Layout */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr',
            gap: 0,
            alignItems: 'stretch',
            minHeight: 600,
          }}
        >
          {/* Left Column - Proposal Details (75%) */}
          <Box sx={{ p: 3, borderRight: isMobile ? 'none' : '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Proposal Details
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isDraft && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/projects/proposals/${proposal.id}/edit`)}
                    sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
                  >
                    Edit
                  </Button>
                )}
                {isDraft && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.82rem' }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>

            {/* Basic Info */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: '1.1rem' }}>
              {proposal.proposed_project_name || 'Untitled Proposal'}
            </Typography>

            <Typography variant="body2" sx={{ color: '#475569', mb: 3, lineHeight: 1.7 }}>
              {proposal.description || 'No description provided'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Details Grid - 4 columns */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 2,
                mb: 3,
              }}
            >
              <GridItem label="Organization" value={proposal.organization_name || '-'} icon={OrgIcon} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                  Categories
                </Typography>
                {proposal.categories && Array.isArray(proposal.categories) && proposal.categories.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {proposal.categories.map((cat) => (
                      <Chip
                        key={cat.id}
                        label={cat.category_name}
                        size="small"
                        icon={<CatIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mt: 0.5, fontStyle: 'italic' }}>
                    No categories
                  </Typography>
                )}
              </Box>
              <GridItem label="Capital Amount" value={`${proposal.proposed_capital_amount ? Number(proposal.proposed_capital_amount).toLocaleString() : '-'} ${proposal.currency_code || ''}`} highlight icon={MoneyIcon} />
              <GridItem label="Land Requested" value={proposal.land_requested || '-'} icon={LandIcon} />
              <GridItem label="Current Status" value={proposal.status_name || '-'} />
              <GridItem label="Created By" value={proposal.created_by_name || '-'} />
              <GridItem label="Created Date" value={proposal.created_at ? formatDate(proposal.created_at) : '-'} />
              <GridItem label="Submitted Date" value={proposal.submitted_at ? formatDate(proposal.submitted_at) : 'Not submitted'} icon={DateIcon} />
            </Box>

            {/* Attached Documents */}
            {(proposal.attached_documents && proposal.attached_documents.length > 0) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                  Attached Documents
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {proposal.attached_documents.map((doc) => (
                    <Box
                      key={doc.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                            {doc.originalName || doc.original_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {doc.size ? formatFileSize(doc.size) : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => window.open(`http://localhost:5000/uploads/proposals/${doc.filename}`, '_blank')}
                        sx={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Download
                      </Button>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Remarks */}
            {proposal.remarks && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                  Remarks
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {proposal.remarks}
                </Typography>
              </>
            )}

            {/* Audit Information */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: '0.9rem' }}>
              Audit Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
              }}
            >
              <GridItem label="Last Updated By" value={proposal.updated_by_name || 'System'} />
              <GridItem label="Last Updated At" value={proposal.updated_at ? formatDateTime(proposal.updated_at) : '-'} />
            </Box>
          </Box>

          {/* Right Column - Actions (25%) */}
          <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
            {/* Status Card */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', mb: 2 }}>
                Proposal Status
              </Typography>
              <StatusChip status={proposal.status_name || 'Draft'} />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Submit Action */}
            {isDraft && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', mb: 2 }}>
                  Actions
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<SubmitIcon />}
                  onClick={() => setSubmitOpen(true)}
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700,
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#059669' },
                  }}
                >
                  Submit for Review
                </Button>
              </Box>
            )}

            {/* Check & Proceed Button */}
            {canCheckAndProceed() && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', mb: 2 }}>
                  Next Step
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={handleCheckAndProceed}
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 700,
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#059669' },
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Check & Proceed
                </Button>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b', textAlign: 'center' }}>
                  All reviewers have completed their reviews
                </Typography>
              </Box>
            )}

            {/* Already Submitted Message */}
            {!isDraft && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', mb: 2 }}>
                  Submission Info
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DateIcon sx={{ color: '#059669', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                    Submitted
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                  This proposal was submitted for review on {formatDate(proposal.submitted_at)}.
                </Typography>
              </Box>
            )}

            {/* Reviewers List - Show for submitted proposals */}
            {!isDraft && reviewers.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    Reviewers ({reviewers.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {reviewers.map((reviewer) => (
                    <Box
                      key={reviewer.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonIcon sx={{ color: '#7c3aed', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                            {reviewer.reviewer_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            {reviewer.reviewer_email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusChip status={reviewer.status} />
                        {reviewer.due_date && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Due: {formatDate(reviewer.due_date)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={deleteOpen}
        title="Delete Proposal"
        message={`Are you sure you want to delete proposal "${proposal?.proposed_project_name}"? This action is irreversible.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
        loading={deleteLoading}
        confirmText="Delete Proposal"
        confirmColor="error"
      />

      <SubmitProposalDialog
        open={submitOpen}
        proposal={proposal}
        onClose={() => setSubmitOpen(false)}
        onConfirm={handleSubmitConfirm}
        loading={submitLoading}
      />

      <ReviewStatisticsDialog
        open={statisticsOpen}
        proposalId={proposal?.id}
        proposalName={proposal?.proposed_project_name}
        onClose={() => setStatisticsOpen(false)}
        onSubmit={handleStatisticsSubmit}
        loading={statisticsLoading}
      />
    </Box>
  );
};

export default ProjectProposalDetails;