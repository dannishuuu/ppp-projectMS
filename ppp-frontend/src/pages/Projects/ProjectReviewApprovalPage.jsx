import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  Breadcrumbs,
  Link,
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as ApproveIcon,
  Gavel as DecisionIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  InsertDriveFile as FileIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectReviewersService } from '../../services/projectServices/projectReviewersService';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { reviewDecisionService } from '../../services/foundationService/reviewDecisionService';
import { proposalReviewService } from '../../services/projectServices/proposalReviewService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Approved: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const StatusChip = ({ status }) => {
  const style = STATUS_COLORS[status] || STATUS_COLORS.Pending;
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

export const ProjectReviewApprovalPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [reviewer, setReviewer] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState('');

  // Fetch reviewer and proposal data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const reviewerData = await projectReviewersService.getReviewerById(id);
        const reviewerRecord = reviewerData.data || reviewerData;

        if (user?.id && reviewerRecord.reviewer_id !== user.id) {
          enqueueSnackbar('You are not authorized to review this proposal', { variant: 'error' });
          navigate('/projects/reviews');
          return;
        }

        setReviewer(reviewerRecord);

        if (reviewerRecord.proposal_id) {
          const proposalData = await projectProposalService.getProposalById(reviewerRecord.proposal_id);
          setProposal(proposalData.data || proposalData);
        }

        // Fetch review decisions
        try {
          const decisionsData = await reviewDecisionService.getDecisions();
          console.log('Decisions API response:', decisionsData);
          // Handle different response formats
          let decisionsArray = [];
          if (Array.isArray(decisionsData)) {
            decisionsArray = decisionsData;
          } else if (decisionsData && Array.isArray(decisionsData.data)) {
            decisionsArray = decisionsData.data;
          } else if (decisionsData && Array.isArray(decisionsData.decisions)) {
            decisionsArray = decisionsData.decisions;
          }
          console.log('Decisions array:', decisionsArray);
          setDecisions(decisionsArray);
        } catch (err) {
          console.error('Failed to load decisions:', err);
        }
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to load review details', { variant: 'error' });
        navigate('/projects/reviews');
      } finally {
        setLoading(false);
      }
    };

    if (id && user?.id) fetchData();
  }, [id, user?.id]);

  const handleApprove = async () => {
    if (!selectedDecision) {
      enqueueSnackbar('Please select a decision', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // Submit review using the new proposal review service
      await proposalReviewService.submitReview(id, {
        decisionId: selectedDecision,
        comments: remarks,
      });
      enqueueSnackbar('Decision submitted successfully', { variant: 'success' });
      navigate('/projects/reviews');
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to submit decision', { variant: 'error' });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  if (!reviewer) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Review not found</Typography>
        <Button onClick={() => navigate('/projects/reviews')} sx={{ mt: 2 }}>
          Back to Reviews
        </Button>
      </Box>
    );
  }

  const isPending = reviewer.status === 'Pending';
  const canAction = isPending;

  // Define grid item component for consistent styling
  const GridItem = ({ label, value, highlight = false }) => (
    <Box>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600, color: '#334155', mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/projects/reviews')}
          sx={{ color: '#64748b' }}
        >
          Back
        </Button>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" component={RouterLink} to="/projects/reviews" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Reviewers
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Review Approval
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Proposal Details
              </Typography>
              <StatusChip status={proposal?.status_name || 'Unknown'} />
            </Box>

            {/* Basic Info */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: '1.1rem' }}>
              {proposal?.proposed_project_name || 'Untitled Proposal'}
            </Typography>

            <Typography variant="body2" sx={{ color: '#475569', mb: 3, lineHeight: 1.7 }}>
              {proposal?.description || 'No description provided'}
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
              <GridItem label="Organization" value={proposal?.organization_name || '-'} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                  Categories
                </Typography>
                {proposal?.categories && Array.isArray(proposal.categories) && proposal.categories.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {proposal.categories.map((cat) => (
                      <Chip
                        key={cat.id}
                        label={cat.category_name}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mt: 0.5, fontStyle: 'italic' }}>
                    -
                  </Typography>
                )}
              </Box>
              <GridItem label="Capital Amount" value={`${proposal?.proposed_capital_amount ? Number(proposal.proposed_capital_amount).toLocaleString() : '-'} ${proposal?.currency_code || ''}`} highlight />
              <GridItem label="Land Requested" value={proposal?.land_requested || '-'} />
              <GridItem label="Current Status" value={proposal?.status_name || '-'} />
              <GridItem label="Created By" value={proposal?.created_by_name || '-'} />
              <GridItem label="Created Date" value={proposal?.created_at ? formatDate(proposal.created_at) : '-'} />
              <GridItem label="Submitted Date" value={proposal?.submitted_at ? formatDate(proposal.submitted_at) : 'Not submitted'} />
            </Box>

            {/* Remarks */}
            {proposal?.remarks && (
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

            {/* Attached Documents */}
            {proposal?.attached_documents && Array.isArray(proposal.attached_documents) && proposal.attached_documents.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                  Attached Documents
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {proposal.attached_documents.map((doc) => (
                    <ListItem
                      key={doc.id}
                      sx={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: '#fafafa',
                        px: 2,
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => window.open(`http://localhost:5000/uploads/proposals/${doc.filename}`, '_blank')}
                          sx={{ color: '#4f46e5' }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <FileIcon sx={{ color: '#6366f1' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.originalName || doc.original_name}
                        secondary={doc.size ? formatFileSize(doc.size) : ''}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: '0.85rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>

          {/* Right Column - Reviewer Details & Actions (25%) */}
          <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
            {/* Reviewer Details */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  Reviewer Details
                </Typography>
                <StatusChip status={reviewer.status} />
              </Box>

              {/* Reviewer Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PersonIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {reviewer.reviewer_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {reviewer.reviewer_email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Assignment Details */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                <GridItem label="Assigned By" value={reviewer.assigned_by_name || '-'} />
                <GridItem label="Assigned Date" value={formatDate(reviewer.assigned_at) || '-'} />
                <GridItem label="Due Date" value={reviewer.due_date ? formatDateTime(reviewer.due_date) : 'Not set'} />
                <GridItem label="Status" value={reviewer.status || '-'} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block' }}>
                    Approvers
                  </Typography>
                  <Chip
                    icon={<GroupIcon sx={{ fontSize: 16 }} />}
                    label={`${reviewer.total_approvers ?? reviewer.totalApprovers ?? 0}/${reviewer.total_revieweers ?? reviewer.totalRevieweers ?? 0}`}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#eef2ff',
                      color: '#3730a3',
                      border: '1px solid #c7d2fe',
                      '& .MuiChip-icon': { color: '#6366f1' },
                    }}
                  />
                </Box>
              </Box>

              {/* Reviewer Remarks */}
              {reviewer.remarks && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    Remarks
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    {reviewer.remarks}
                  </Typography>
                </>
              )}
            </Box>

            {/* Action Panel */}
            {canAction && (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', mb: 2 }}>
                  Take Action
                </Typography>

                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 1 }}>
                  Decision
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <Select
                    value={selectedDecision}
                    onChange={(e) => setSelectedDecision(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        Select a decision...
                      </Typography>
                    </MenuItem>
                    {decisions.map((decision) => (
                      <MenuItem key={decision.id} value={decision.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {decision.name}
                          </Typography>
                          {decision.description && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              {decision.description}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DecisionIcon />}
                  onClick={handleApprove}
                  disabled={submitting || !selectedDecision}
                  sx={{
                    py: 1.2,
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' },
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  Submit Decision
                </Button>
                {submitting && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            )}

            {!isPending && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This review has already been {reviewer.status.toLowerCase()}.
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectReviewApprovalPage;