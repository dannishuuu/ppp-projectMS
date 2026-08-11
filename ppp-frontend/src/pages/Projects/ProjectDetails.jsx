import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Stack,
  Avatar,
  Fade,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Description as DocIcon,
  CheckCircle as SuccessIcon,
  HourglassEmpty as PendingIcon,
  Autorenew as InProgressIcon,
  Apartment as HousingIcon,
  Business as CommercialIcon,
  LocalParking as ParkingIcon,
  CalendarToday as DateIcon,
  AccountBalance as GovIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  FolderZip as FolderIcon,
  Timeline as TimelineIcon,
  ReceiptLong as LedgerIcon,
  GridView as OverviewIcon,
  NavigateNext as NavigateNextIcon,
  VerifiedUser as SecurityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { mockApi } from '../../services/mockApi';
import { formatCurrency, formatDate, formatNumber, getStatusColor } from '../../utils/formatters';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`details-tabpanel-${index}`}>
      {value === index && (
        <Fade in timeout={300}>
          <Box sx={{ pt: 2.5 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await mockApi.getProjectById(id);
        setProject(data);
      } catch (err) {
        enqueueSnackbar(`Failed to load project details for ID ${id}`, { variant: 'error' });
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate, enqueueSnackbar]);

  const handleDownloadDoc = (docName) => {
    enqueueSnackbar(`Downloading "${docName}"...`, { variant: 'info' });
  };

  if (loading || !project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 480 }}>
        <CircularProgress size={40} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const statusInfo = getStatusColor(project.status);
  const totalFinancialsSum = (project.financials || []).reduce((acc, f) => acc + (f.amount || 0), 0);
  const milestonesList = project.milestones || [];
  const documentsList = project.documents || [];
  const financialsList = project.financials || [];

  const completedMilestonesCount = milestonesList.filter((m) => m.status === 'Completed').length;
  const milestoneProgressPct = milestonesList.length > 0
    ? Math.round((completedMilestonesCount / milestonesList.length) * 100)
    : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', pb: 8 }}>
      
      {/* ── BREADCRUMBS & TOP BAR ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: '#94a3b8' }} />}
            aria-label="breadcrumb"
            sx={{ mb: 0.5 }}
          >
            <Link
              component={RouterLink}
              to="/projects"
              underline="hover"
              sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'baseline', gap: 0.5 }}
            >
              Projects
            </Link>
            <Typography sx={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 700 }}>
              {project.code}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Project Details
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/projects')}
            sx={{
              fontWeight: 600,
              borderRadius: 2.25,
              px: 2.5,
              py: 0.9,
              borderColor: '#cbd5e1',
              color: '#475569',
              backgroundColor: '#ffffff',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc', color: '#0f172a' },
            }}
          >
            Back to Directory
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
            sx={{
              fontWeight: 700,
              borderRadius: 2.25,
              px: 3,
              py: 0.9,
              backgroundColor: '#4f46e5',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              '&:hover': { backgroundColor: '#4338ca', boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)' },
            }}
          >
            Edit Project
          </Button>
        </Stack>
      </Box>

      {/* ── HERO BANNER CARD ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        <Box sx={{ height: 6, backgroundColor: statusInfo.text || '#4f46e5' }} />

        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={3} alignItems="center">
            
            {/* Title & Metadata Header */}
            <Grid item xs={12} lg={8}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5, gap: 1 }}>
                <Chip
                  label={project.code}
                  size="small"
                  sx={{ fontWeight: 800, backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
                />
                <Chip
                  label={statusInfo.label}
                  size="small"
                  sx={{ backgroundColor: statusInfo.bg, color: statusInfo.text, fontWeight: 800 }}
                />
                <Chip
                  label={project.type}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700, borderColor: '#cbd5e1', color: '#475569' }}
                />
                {project.subCategory && (
                  <Chip
                    label={project.subCategory}
                    size="small"
                    sx={{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 600, border: '1px solid #e2e8f0' }}
                  />
                )}
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', md: '1.85rem' } }}>
                {project.name}
              </Typography>

              <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.6, maxWidth: '95%' }}>
                {project.description}
              </Typography>
            </Grid>

            {/* Overall Completion Gauge Card */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: '#f8fafc',
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Project Progress
                  </Typography>
                  <Chip
                    label={`${project.completionPercentage || 0}% Complete`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#e0e7ff', color: '#3730a3' }}
                  />
                </Box>

                <Box sx={{ my: 1.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={project.completionPercentage || 0}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                      },
                    }}
                  />
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                      Start Date
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {formatDate(project.projectStartDate)}
                    </Typography>
                  </Box>
                  <Box align="right">
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                      Target Completion
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#4f46e5' }}>
                      {formatDate(project.projectEndDate)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

          </Grid>

          {/* Key Executive KPI Cards Grid */}
          <Grid container spacing={2} sx={{ mt: 2, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <Avatar sx={{ width: 42, height: 42, backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>
                    Approved Budget
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669', noWrap: true }}>
                    {formatCurrency(project.preliminaryBudget, true)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <Avatar sx={{ width: 42, height: 42, backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: 2 }}>
                  <GovIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>
                    Developer / SPV
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', noWrap: true }}>
                    {project.developer}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <Avatar sx={{ width: 42, height: 42, backgroundColor: '#ecfeff', color: '#06b6d4', borderRadius: 2 }}>
                  <LocationIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>
                    Location
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', noWrap: true }}>
                    {project.subCity}, {project.woreda ? `W. ${project.woreda}` : project.address}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <Avatar sx={{ width: 42, height: 42, backgroundColor: '#fff7ed', color: '#f59e0b', borderRadius: 2 }}>
                  <DateIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>
                    Signing Date
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', noWrap: true }}>
                    {formatDate(project.contractSigningDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Dynamic Navigation Tabs */}
        <Divider />
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: { xs: 2, md: 3 },
            backgroundColor: '#ffffff',
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: '#4f46e5' },
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              py: 2,
              minHeight: 52,
              mr: 2,
              color: '#64748b',
              '&.Mui-selected': { color: '#4f46e5' },
            },
          }}
        >
          <Tab icon={<OverviewIcon fontSize="small" />} iconPosition="start" label="Overview Specs" />
          <Tab
            icon={<LedgerIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Financial Ledger</span>
                <Chip label={financialsList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#eef2ff', color: '#4f46e5' }} />
              </Box>
            }
          />
          <Tab
            icon={<TimelineIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Milestones</span>
                <Chip label={milestonesList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#eef2ff', color: '#4f46e5' }} />
              </Box>
            }
          />
          <Tab
            icon={<FolderIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Documents</span>
                <Chip label={documentsList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#eef2ff', color: '#4f46e5' }} />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ── TAB PANELS ── */}

      {/* TAB 1: OVERVIEW SPECS */}
      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              
              {/* General & Legal Info Card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                    <SecurityIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                    General & Concession Details
                  </Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Project Code</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.code}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Category & Sub-Type</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {project.type} • {project.subCategory || 'General Infrastructure'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Concessionaire / Developer</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.developer}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Contracting Authority</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.authority}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Special Purpose Vehicle (SPV)</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.spvName || 'N/A'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Location & Site Metrics Card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: '#ecfeff', color: '#06b6d4' }}>
                    <LocationIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                    Location & Site Parameters
                  </Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Sub-City Jurisdiction</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.subCity}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Woreda Sector</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.woreda || 'N/A'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Total Plot Site Area</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(project.siteArea)} m²</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>Full Physical Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>{project.address}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Capacity & Metrics Container */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                <Avatar sx={{ width: 32, height: 32, backgroundColor: '#fff7ed', color: '#f59e0b' }}>
                  <AssessmentIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  Capacity & Output Metrics
                </Typography>
              </Box>

              {project.type === 'Housing' ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    backgroundColor: 'rgba(79, 70, 229, 0.04)',
                    border: '1px dashed rgba(79, 70, 229, 0.25)',
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  <Avatar sx={{ width: 56, height: 56, backgroundColor: '#4f46e5', color: '#ffffff', mx: 'auto', mb: 2 }}>
                    <HousingIcon fontSize="medium" />
                  </Avatar>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#4338ca', letterSpacing: '-0.02em' }}>
                    {formatNumber(project.housingUnits)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3730a3', mt: 0.5 }}>
                    Residential Housing Units
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(6, 182, 212, 0.04)',
                      border: '1px dashed rgba(6, 182, 212, 0.25)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ width: 44, height: 44, backgroundColor: '#06b6d4', color: '#ffffff', borderRadius: 2 }}>
                      <CommercialIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0891b2' }}>
                        {formatNumber(project.commercialSpaces)} m²
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0e7490' }}>
                        Commercial & Retail Area
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(16, 185, 129, 0.04)',
                      border: '1px dashed rgba(16, 185, 129, 0.25)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ width: 44, height: 44, backgroundColor: '#10b981', color: '#ffffff', borderRadius: 2 }}>
                      <ParkingIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                        {formatNumber(project.parkingCapacity)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857' }}>
                        Vehicular Parking Capacity
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TAB 2: FINANCIAL LEDGER */}
      <TabPanel value={tabIndex} index={1}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Financial Ledger & Disbursements
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Audited transactions, concession fee payments, and financial disbursements.
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                px: 2.5,
                py: 1.25,
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 2.5,
              }}
            >
              <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, display: 'block' }}>
                Total Allocated Financial Sum
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669' }}>
                {formatCurrency(totalFinancialsSum)}
              </Typography>
            </Paper>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Transaction Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Amount (ETB)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {financialsList.length > 0 ? (
                  financialsList.map((f) => (
                    <TableRow key={f.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{formatDate(f.date)}</TableCell>
                      <TableCell>
                        <Chip label={f.type} size="small" sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{f.description}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#4f46e5' }}>
                        {formatCurrency(f.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                      No financial transactions recorded for this project yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* TAB 3: MILESTONES SCHEDULE */}
      <TabPanel value={tabIndex} index={2}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Key Milestone Schedule & Phasing
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Track implementation progress against baseline project targets.
              </Typography>
            </Box>

            <Box sx={{ minWidth: 200 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Milestones Completed
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#4f46e5' }}>
                  {completedMilestonesCount} / {milestonesList.length} ({milestoneProgressPct}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={milestoneProgressPct}
                sx={{ height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }}
              />
            </Box>
          </Box>

          <Stack spacing={2}>
            {milestonesList.length > 0 ? (
              milestonesList.map((m, idx) => {
                const isCompleted = m.status === 'Completed';
                const isInProgress = m.status === 'In Progress';

                return (
                  <Paper
                    key={m.id || idx}
                    elevation={0}
                    sx={{
                      p: 2.25,
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.02)' : isInProgress ? 'rgba(245, 158, 11, 0.02)' : '#ffffff',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: isCompleted
                            ? '#ecfdf5'
                            : isInProgress
                              ? '#fff7ed'
                              : '#f1f5f9',
                          color: isCompleted ? '#10b981' : isInProgress ? '#f59e0b' : '#94a3b8',
                          borderRadius: 2,
                        }}
                      >
                        {isCompleted ? <SuccessIcon /> : isInProgress ? <InProgressIcon /> : <PendingIcon />}
                      </Avatar>

                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {m.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Target Deadline: <strong>{formatDate(m.targetDate)}</strong>
                          {m.actualDate && ` • Completed: ${formatDate(m.actualDate)}`}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={m.status}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isInProgress ? 'rgba(245, 158, 11, 0.1)' : '#f1f5f9',
                        color: isCompleted ? '#059669' : isInProgress ? '#d97706' : '#64748b',
                      }}
                    />
                  </Paper>
                );
              })
            ) : (
              <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>No milestone records currently available.</Box>
            )}
          </Stack>
        </Paper>
      </TabPanel>

      {/* TAB 4: DOCUMENT REPOSITORY */}
      <TabPanel value={tabIndex} index={3}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            Legal Contracts & Technical Repository
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Access PPP concession agreements, environmental audits, and technical designs.
          </Typography>

          <Grid container spacing={2.5}>
            {documentsList.length > 0 ? (
              documentsList.map((doc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id || idx}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#4f46e5', boxShadow: '0 6px 16px rgba(79, 70, 229, 0.08)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 42, height: 42, backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: 2 }}>
                        <DocIcon />
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {doc.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          {doc.type} • {doc.size || '3.5 MB'}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadDoc(doc.name)}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        '&:hover': { borderColor: '#4f46e5', color: '#4f46e5', backgroundColor: '#eef2ff' },
                      }}
                    >
                      Download Document
                    </Button>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>No official documents submitted yet.</Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default ProjectDetails;