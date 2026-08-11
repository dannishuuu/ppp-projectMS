import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  CircularProgress,
  Stack,
  Avatar,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  AccountBalance as GovIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  FiberManualRecord as LiveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { SummaryCards } from '../../components/Dashboard/SummaryCards';
import { ProjectCharts } from '../../components/Dashboard/ProjectCharts';
import { formatCurrency, getStatusColor } from '../../utils/formatters';
import { downloadProjectsCSV } from '../../utils/exportToCsv';

export const Dashboard = () => {
  const { projects, loading, setSelectedProject } = useProjects();
  const { canAdd, canEdit } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const list = projects.slice(0, 5);
    if (!searchQuery.trim()) return list;

    return list.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.developer?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const handleExportCSV = () => {
    downloadProjectsCSV(projects, `PPP_Portfolio_Summary_${Date.now()}.csv`);
  };

  const getProgressColor = (value) => {
    if (value >= 80) return '#10b981';
    if (value >= 50) return '#3b82f6';
    if (value >= 25) return '#f59e0b';
    return '#64748b';
  };

  if (loading && projects.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} thickness={4} sx={{ color: '#0f172a' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
          Loading Portfolio Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', pb: 4 }}>

      {/* Summary KPI Cards */}
      <SummaryCards projects={projects} />

      {/* Analytics & Charts */}
      <ProjectCharts projects={projects} />

      {/* Recent Projects Activity Table */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px -2px rgba(0,0,0,0.03)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Recent Portfolio Activity
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Monitoring recent concession updates and milestones
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Quick filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: '100%', sm: 200 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    backgroundColor: '#f8fafc',
                    '& fieldset': { borderColor: '#e2e8f0' },
                  },
                }}
              />

              <Button
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => navigate('/projects')}
                sx={{
                  fontWeight: 700,
                  color: '#6366f1',
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View Directory ({projects.length})
              </Button>
            </Stack>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: 2,
              overflowX: 'auto',
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sub-City</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Developer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Budget (ETB)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', minWidth: 120 }}>Progress</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        No project updates found matching "{searchQuery}"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((p) => {
                    const statusInfo = getStatusColor(p.status);
                    const progressVal = p.completionPercentage || 0;
                    return (
                      <TableRow
                        key={p.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': { backgroundColor: '#f8fafc' },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.8rem' }}>
                          {p.code}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                          {p.name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.type}
                            size="small"
                            sx={{
                              backgroundColor: p.type === 'Housing' ? '#e0e7ff' : '#ccfbf1',
                              color: p.type === 'Housing' ? '#3730a3' : '#115e59',
                              fontWeight: 700,
                              fontSize: '0.675rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontSize: '0.8rem' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                            <span>{p.subCity}</span>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontSize: '0.8rem' }}>
                          {p.developer}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.text,
                              fontWeight: 700,
                              fontSize: '0.675rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                          {formatCurrency(p.preliminaryBudget, true)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.7rem' }}>
                                {progressVal}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={progressVal}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getProgressColor(progressVal),
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedProject(p);
                                  navigate(`/projects/${p.id}`);
                                }}
                                sx={{ color: '#475569', p: 0.5 }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Edit Concession">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/projects/${p.id}/edit`)}
                                  sx={{ color: '#475569', p: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};