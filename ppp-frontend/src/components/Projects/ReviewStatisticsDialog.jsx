import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Divider,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { proposalReviewService } from '../../services/projectServices/proposalReviewService';
import { proposalStatusService } from '../../services/foundationService';
import { useSnackbar } from 'notistack';

export const ReviewStatisticsDialog = ({ open, proposalId, proposalName, onClose, onSubmit, loading: submitLoading }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [requiresManualSelection, setRequiresManualSelection] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState('');

  useEffect(() => {
    if (open && proposalId) {
      fetchStatistics();
    }
  }, [open, proposalId]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await proposalReviewService.getReviewStatistics(proposalId);
      const data = response.data || response;
      const stats = data.statistics || [];
      setStatistics(stats);
      setTotal(data.total || 0);
      
      // Check if there's a tie
      if (stats.length > 0) {
        const hasTie = checkForTie(stats);
        setRequiresManualSelection(hasTie);
        if (hasTie) {
          await loadAvailableStatuses();
        }
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load review statistics', { variant: 'error' });
      setStatistics([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (requiresManualSelection && !selectedStatusId) {
      enqueueSnackbar('Please select a status to proceed', { variant: 'warning' });
      return;
    }
    
    if (onSubmit) {
      await onSubmit(selectedStatusId);
    }
  };

  // Get color based on decision weight
  const getColorByWeight = (weight) => {
    const w = parseInt(weight, 10);
    if (w === 1) {
      return {
        progress: '#10b981', // green
        chip: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
      };
    } else if (w === 0) {
      return {
        progress: '#f59e0b', // orange
        chip: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
      };
    } else if (w === -1) {
      return {
        progress: '#ef4444', // red
        chip: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
      };
    }
    // Default fallback
    return {
      progress: '#6366f1', // purple
      chip: { bg: '#eef2ff', color: '#3730a3', border: '#c7d2fe' },
    };
  };

  // Check if there's a tie and load available statuses
  const checkForTie = (stats) => {
    // Group by weight and calculate percentages
    const weightGroups = {
      positive: 0, // weight = 1
      neutral: 0,  // weight = 0
      negative: 0, // weight = -1
    };

    stats.forEach(stat => {
      const weight = parseInt(stat.decision_weight, 10);
      const percentage = parseFloat(stat.percentage || 0);

      if (weight === 1) weightGroups.positive += percentage;
      else if (weight === 0) weightGroups.neutral += percentage;
      else if (weight === -1) weightGroups.negative += percentage;
    });

    // Find max percentage
    const maxPercentage = Math.max(
      weightGroups.positive,
      weightGroups.neutral,
      weightGroups.negative
    );

    // Count how many groups have the max percentage
    const tiedCount = [
      weightGroups.positive,
      weightGroups.neutral,
      weightGroups.negative
    ].filter(p => p === maxPercentage).length;

    return tiedCount > 1;
  };

  // Load available statuses when needed
  const loadAvailableStatuses = async () => {
    try {
      const response = await proposalStatusService.getProposalStatuses({ limit: 100, status: 'active' });
      const allStatuses = response.proposalStatuses || response.rows || [];
      // Filter for steps 3, 4, and 5
      const filtered = allStatuses.filter(s => [3, 4, 5].includes(parseInt(s.step, 10)));
      setAvailableStatuses(filtered);
    } catch (error) {
      console.error('Failed to load statuses:', error);
      setAvailableStatuses([]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChartIcon sx={{ color: '#1e40af', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Review Decision Summary
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              {proposalName}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 0.5, color: '#64748b' }}
          disabled={submitLoading}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : (
          <Box>
            {/* Summary Header */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                Total Reviews Submitted
              </Typography>
              <Chip
                label={`${total} ${total === 1 ? 'Review' : 'Reviews'}`}
                sx={{
                  height: 32,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  backgroundColor: '#eef2ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Decision Breakdown */}
            {statistics && statistics.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                  Decision Breakdown
                </Typography>
                {statistics.map((stat) => {
                  const colors = getColorByWeight(stat.decision_weight);
                  return (
                    <Paper
                      key={stat.decision_id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {stat.decision_name}
                          </Typography>
                          {stat.decision_description && (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              ({stat.decision_description})
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={`${stat.count} vote${stat.count !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: colors.chip.bg,
                            color: colors.chip.color,
                            border: `1px solid ${colors.chip.border}`,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(stat.percentage || 0)}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colors.progress,
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: colors.progress,
                            minWidth: 50,
                            textAlign: 'right',
                          }}
                        >
                          {parseFloat(stat.percentage || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  No review data available
                </Typography>
              </Box>
            )}

            {/* Manual Selection UI (shown when there's a tie) */}
            {requiresManualSelection && availableStatuses.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Tie Detected - Manual Selection Required
                  </Typography>
                  <Typography variant="caption">
                    Multiple decisions have equal percentages. Please select the status to proceed.
                  </Typography>
                </Alert>
                <FormControl fullWidth>
                  <InputLabel shrink>Select Status</InputLabel>
                  <Select
                    value={selectedStatusId}
                    onChange={(e) => setSelectedStatusId(e.target.value)}
                    label="Select Status"
                    displayEmpty
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        Choose a status...
                      </Typography>
                    </MenuItem>
                    {availableStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {status.name}
                          </Typography>
                          {status.description && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              {status.description} (Step {status.step})
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitLoading}
          sx={{
            borderRadius: 2,
            borderColor: '#cbd5e1',
            color: '#475569',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || submitLoading || !statistics || statistics.length === 0 || (requiresManualSelection && !selectedStatusId)}
          startIcon={submitLoading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckIcon />}
          sx={{
            borderRadius: 2,
            backgroundColor: '#10b981',
            fontWeight: 700,
            '&:hover': {
              backgroundColor: '#059669',
            },
            '&:disabled': {
              backgroundColor: '#cbd5e1',
              color: '#94a3b8',
            },
          }}
        >
          {submitLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewStatisticsDialog;
