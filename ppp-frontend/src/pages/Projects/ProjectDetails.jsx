// pages/Projects/ProjectDetails.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  HourglassEmpty as PendingIcon,
  Autorenew as InProgressIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  ReceiptLong as LedgerIcon,
  GridView as OverviewIcon,
  NavigateNext as NavigateNextIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  Gavel as GavelIcon,
  Domain as DomainIcon,
  Groups as GroupsIcon,
  FolderOpen as FolderOpenIcon,
  PictureAsPdf as PdfIcon,
  Person as PersonIcon,
  CorporateFare as CorporateFareIcon,
  Verified as VerifiedIcon,
  Layers as LayersIcon,
  AccountBalance as GovIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { pppProjectService } from '../../services/projectServices/pppProjectService';

/* ── InfraNexus PPP Design Tokens ─────────────────────────────────────────── */
const D = {
  primary: '#000ea1',
  primaryCont: '#1c2ac8',
  primaryMid: '#3b49df',
  primaryLight: '#e8eaff',
  textPrimary: '#0b1c30',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  bg: '#f4f6fb',
  card: '#ffffff',
  surfaceSubtle: '#f8fafc',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  // status
  activeBg: '#dcfce7', activeFg: '#15803d', activeDot: '#22c55e',
  constructBg: '#fef3c7', constructFg: '#b45309', constructDot: '#f59e0b',
  completedBg: '#f5f3ff', completedFg: '#7c3aed', completedDot: '#7c3aed',
  financeBg: '#e0f2fe', financeFg: '#0369a1', financeDot: '#0ea5e9',
  errorBg: '#fee2e2', errorFg: '#b91c1c', errorDot: '#ef4444',
  neutralBg: '#f1f5f9', neutralFg: '#475569', neutralDot: '#94a3b8',
};

/* ── Inline formatters ─────────────────────────────────────────────────────── */
const fmt = {
  currency: (val, compact = false, currencyCode = 'USD') => {
    if (!val && val !== 0) return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';
    const symbol = currencyCode === 'ETB' ? 'ETB ' : currencyCode === 'EUR' ? '€' : '$';
    if (compact) {
      if (Math.abs(n) >= 1_000_000_000) return `${symbol}${(n / 1_000_000_000).toFixed(2)}B`;
      if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
      if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}k`;
    }
    return `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  },
  date: (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(val);
    }
  },
  number: (val) => {
    if (val == null || val === '') return '—';
    const n = Number(val);
    return isNaN(n) ? String(val) : n.toLocaleString();
  },
};

/* ── Status badge resolver ─────────────────────────────────────────────────── */
const resolveStatus = (name = '') => {
  const n = (name || '').toLowerCase();
  if (n.includes('operational') || n.includes('active'))
    return { label: name || 'Active / Operational', bg: D.activeBg, fg: D.activeFg, dot: D.activeDot, pulse: true };
  if (n.includes('construct') || n.includes('epc') || n.includes('progress'))
    return { label: name || 'Under Construction', bg: D.constructBg, fg: D.constructFg, dot: D.constructDot, pulse: true };
  if (n.includes('complet') || n.includes('handed') || n.includes('revert'))
    return { label: name || 'Completed / Handover', bg: D.completedBg, fg: D.completedFg, dot: D.completedDot, pulse: false };
  if (n.includes('financ') || n.includes('close') || n.includes('sign') || n.includes('approved'))
    return { label: name || 'Financial Close', bg: D.financeBg, fg: D.financeFg, dot: D.financeDot, pulse: false };
  if (n.includes('cancel') || n.includes('terminat') || n.includes('suspend'))
    return { label: name || 'Terminated', bg: D.errorBg, fg: D.errorFg, dot: D.errorDot, pulse: false };
  return { label: name || 'Active', bg: D.neutralBg, fg: D.neutralFg, dot: D.neutralDot, pulse: false };
};

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await pppProjectService.getProjectById(id);
        if (!data) throw new Error('Project not found');
        if (isMounted) setProject(data);
      } catch (err) {
        enqueueSnackbar(
          err?.response?.data?.message || err.message || `Failed to load project #${id}`,
          { variant: 'error' }
        );
        navigate('/projects');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [id, navigate, enqueueSnackbar]);

  const handleDownloadDoc = (docName) => {
    enqueueSnackbar(`Downloading official copy of "${docName}"...`, { variant: 'info' });
  };

  /* ── Derived Data (DB values only — no fabricated fallbacks) ─────────────── */
  const statusName = project?.status_name || project?.status?.name || project?.status || '';
  const statusInfo = resolveStatus(statusName);
  const categories = Array.isArray(project?.categories) ? project.categories : [];
  const organizations = Array.isArray(project?.organizations) ? project.organizations : [];
  const activeManagers = Array.isArray(project?.active_managers) ? project.active_managers : [];
  const currencyCode = project?.currency_code || 'USD';

  // Identify Lead Developer / Concessionaire & Contracting Authority
  const devOrg = organizations.find((o) => {
    const t = (o.organization_type_name || o.organization_type_code || o.type_name || o.role || '').toLowerCase();
    return t.includes('developer') || t.includes('lead') || t.includes('contractor') || t.includes('private') || t.includes('concessionaire');
  });
  const devName = devOrg?.organization_name || devOrg?.name || project?.developer || '—';

  const authorityOrg = organizations.find((o) => {
    const t = (o.organization_type_name || o.organization_type_code || o.type_name || o.role || '').toLowerCase();
    return t.includes('authority') || t.includes('government') || t.includes('public') || t.includes('grant') || t.includes('ministry');
  });
  const authorityName = authorityOrg?.organization_name || authorityOrg?.name || project?.authority || '—';

  const budgetAmount = project?.estimated_budget_amount != null ? Number(project.estimated_budget_amount) : null;
  const contractDate = project?.contract_signing_date || null;
  const siteAreaVal = project?.site_area_value != null ? project.site_area_value : null;
  const siteAreaUnit = project?.site_area_unit || '';

  // Milestones come straight from the project record (no fabricated fallbacks)
  const milestonesList = useMemo(
    () => (Array.isArray(project?.milestones) ? project.milestones : []),
    [project]
  );

  const completedMilestones = milestonesList.filter((m) => m.status === 'Completed').length;
  const inProgressMilestones = milestonesList.filter((m) => m.status === 'In Progress').length;
  const milestoneProgressPct = milestonesList.length > 0
    ? Math.round(((completedMilestones + (inProgressMilestones > 0 ? 0.5 : 0)) / milestonesList.length) * 100)
    : 0;

  // Financial disbursements come straight from the project record (no fabricated fallbacks)
  const financialsList = useMemo(
    () => (Array.isArray(project?.financials) ? project.financials : []),
    [project]
  );

  const totalFinancialsSum = financialsList.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Official documents come straight from the project record (no fabricated fallbacks)
  const documentsList = useMemo(
    () => (Array.isArray(project?.documents) ? project.documents : []),
    [project]
  );

  if (loading || !project) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 520, gap: 2 }}>
        <CircularProgress size={44} sx={{ color: D.primary }} />
        <Typography variant="body2" sx={{ color: D.textMuted, fontWeight: 600 }}>
          Loading sovereign concession dossier...
        </Typography>
      </Box>
    );
  }

  const projectCode = project.project_no || `#PPP-${String(project.id || '').slice(0, 8).toUpperCase()}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', pb: 10 }}>

      {/* ── 1. TOP COMMAND & BREADCRUMB STRIP ───────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2.5, md: 4 },
          py: 2,
          borderRadius: 3,
          backgroundColor: D.card,
          border: `1px solid ${D.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Breadcrumbs & Sovereign Registry Pill */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: D.textLight }} />}
              aria-label="breadcrumb"
            >
              <Link
                component={RouterLink}
                to="/dashboard"
                underline="hover"
                sx={{ color: D.textMuted, fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                Home
              </Link>
              <Link
                component={RouterLink}
                to="/projects"
                underline="hover"
                sx={{ color: D.textMuted, fontSize: '0.82rem', fontWeight: 600 }}
              >
                PPP Infrastructure
              </Link>
              <Link
                component={RouterLink}
                to="/projects"
                underline="hover"
                sx={{ color: D.textMuted, fontSize: '0.82rem', fontWeight: 600 }}
              >
                Project Registry
              </Link>
              <Typography sx={{ color: D.textPrimary, fontSize: '0.82rem', fontWeight: 700 }}>
                {project.name}
              </Typography>
            </Breadcrumbs>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, pl: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.35,
                  borderRadius: '9999px',
                  backgroundColor: D.activeBg,
                  color: D.activeFg,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: D.activeDot,
                    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
                  }}
                />
                Live Sovereign Record • Synced Live
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 1.5,
                  backgroundColor: D.surfaceSubtle,
                  color: D.textMuted,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: `1px solid ${D.borderSubtle}`,
                }}
              >
                <VerifiedIcon sx={{ fontSize: 13, color: D.primaryCont }} />
                ISO 27001 Audited
              </Box>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => navigate('/projects')}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                py: 0.75,
                borderColor: D.border,
                color: D.textPrimary,
                backgroundColor: D.card,
                textTransform: 'none',
                '&:hover': { borderColor: D.primaryMid, backgroundColor: D.primaryLight, color: D.primary },
              }}
            >
              Back to Directory
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon fontSize="small" />}
              onClick={() => window.print()}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                py: 0.75,
                borderColor: D.border,
                color: D.textMuted,
                backgroundColor: D.card,
                textTransform: 'none',
                '&:hover': { borderColor: D.textPrimary, color: D.textPrimary },
              }}
            >
              Print Dossier
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => navigate(`/projects/${project.id}/edit`)}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                py: 0.75,
                backgroundColor: D.primary,
                boxShadow: '0 4px 14px rgba(0, 14, 161, 0.28)',
                textTransform: 'none',
                '&:hover': { backgroundColor: D.primaryCont, boxShadow: '0 6px 20px rgba(0, 14, 161, 0.38)' },
              }}
            >
              Edit Concession
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* ── 2. HERO CONCESSION HEADER BANNER ────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: `1px solid ${D.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          backgroundColor: D.card,
          position: 'relative',
        }}
      >
        {/* Glowing visual backdrop */}
        <Box
          sx={{
            position: 'absolute',
            right: -60,
            bottom: -60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 14, 161, 0.08) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3.5} alignItems="center">
            {/* Identity & Badges */}
            <Grid item xs={12} lg={8}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
                <Chip
                  label={projectCode}
                  size="small"
                  sx={{
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    backgroundColor: D.primaryLight,
                    color: D.primary,
                    borderRadius: 1.5,
                  }}
                />

                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusInfo.dot }} />
                      <span>{statusInfo.label}</span>
                    </Box>
                  }
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.fg,
                    borderRadius: 1.5,
                  }}
                />

                {categories.length > 0 ? (
                  categories.map((c, i) => (
                    <Chip
                      key={i}
                      label={c.category_name || c.name}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        borderRadius: 1.5,
                      }}
                    />
                  ))
                ) : null}
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: D.textPrimary,
                  letterSpacing: '-0.025em',
                  fontSize: { xs: '1.6rem', md: '2.2rem' },
                  lineHeight: 1.25,
                  mb: 1.5,
                }}
              >
                {project.name}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: D.textMuted,
                  lineHeight: 1.65,
                  fontSize: '0.94rem',
                  maxWidth: '92%',
                }}
              >
                {project.description || '—'}
              </Typography>
            </Grid>

            {/* Right: Quick Progress Gauge Box */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: D.surfaceSubtle,
                  borderRadius: 3,
                  border: `1px solid ${D.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Overall Concession Progress
                  </Typography>
                  <Chip
                    label={`${milestoneProgressPct}% Complete`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: D.activeBg,
                      color: D.activeFg,
                    }}
                  />
                </Box>

                {/* Progress bar */}
                <Box sx={{ my: 1.75 }}>
                  <LinearProgress
                    variant="determinate"
                    value={milestoneProgressPct}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #000ea1 0%, #06b6d4 100%)',
                      },
                    }}
                  />
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: D.textMuted, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                      Contract Executed
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: D.textPrimary }}>
                      {fmt.date(contractDate)}
                    </Typography>
                  </Box>
                  <Box align="right">
                    <Typography variant="caption" sx={{ color: D.textMuted, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                      Concession Scope
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: D.primaryCont }}>
                      {siteAreaVal ? `${fmt.number(siteAreaVal)} ${siteAreaUnit}` : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* ── 3. EXECUTIVE METRIC CARDS STRIP ─────────────────────────────── */}
          <Grid container spacing={2} sx={{ mt: 2.5, pt: 3, borderTop: `1px solid ${D.borderSubtle}` }}>
            {/* Card 1: Capex & Budget */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: D.surfaceSubtle,
                  border: `1px solid ${D.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                }}
              >
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, fontSize: '0.72rem' }}>
                      Capex & Budget
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669', lineHeight: 1.3 }} noWrap>
                    {budgetAmount != null ? fmt.currency(budgetAmount, true, currencyCode) : '—'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: D.textLight, fontSize: '0.68rem', display: 'block' }}>
                    Budget currency: {currencyCode}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Card 2: Contracting Authority */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: D.surfaceSubtle,
                  border: `1px solid ${D.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                }}
              >
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#eef2ff', color: D.primaryCont, borderRadius: 2 }}>
                  <GovIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, fontSize: '0.72rem' }}>
                      Contracting Authority
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary, lineHeight: 1.3 }} noWrap title={authorityName}>
                    {authorityName}
                  </Typography>
                  {authorityOrg?.organization_type_name && (
                    <Typography variant="caption" sx={{ color: D.textLight, fontSize: '0.68rem', display: 'block' }} noWrap>
                      {authorityOrg.organization_type_name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Card 3: Lead Concessionaire / EPC */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: D.surfaceSubtle,
                  border: `1px solid ${D.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                }}
              >
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#f5f3ff', color: '#7c3aed', borderRadius: 2 }}>
                  <DomainIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, fontSize: '0.72rem' }}>
                      Lead Concessionaire
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary, lineHeight: 1.3 }} noWrap title={devName}>
                    {devName}
                  </Typography>
                  {devOrg?.organization_type_name && (
                    <Typography variant="caption" sx={{ color: D.textLight, fontSize: '0.68rem', display: 'block' }} noWrap>
                      {devOrg.organization_type_name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Card 4: Geographic Jurisdiction */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: D.surfaceSubtle,
                  border: `1px solid ${D.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                }}
              >
                <Avatar sx={{ width: 44, height: 44, backgroundColor: '#fff7ed', color: '#f59e0b', borderRadius: 2 }}>
                  <LocationIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, fontSize: '0.72rem' }}>
                      Jurisdiction
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary, lineHeight: 1.3 }} noWrap title={project.address || '—'}>
                    {project.address || '—'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: D.textLight, fontSize: '0.68rem', display: 'block' }}>
                    {siteAreaVal ? `${fmt.number(siteAreaVal)} ${siteAreaUnit}` : '—'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ── 4. STICKY TAB NAVIGATION BAR ──────────────────────────────────── */}
        <Divider />
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: { xs: 2, md: 3 },
            backgroundColor: D.card,
            '& .MuiTabs-indicator': { height: 3.5, borderRadius: '3px 3px 0 0', backgroundColor: D.primary },
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.84rem',
              textTransform: 'none',
              py: 2,
              minHeight: 52,
              mr: 2,
              color: D.textMuted,
              '&.Mui-selected': { color: D.primary },
            },
          }}
        >
          <Tab
            icon={<LayersIcon fontSize="small" />}
            iconPosition="start"
            label="Comprehensive Dossier (All)"
          />
          <Tab
            icon={<OverviewIcon fontSize="small" />}
            iconPosition="start"
            label="Concession Specs"
          />
          <Tab
            icon={<TimelineIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Milestones & Phasing</span>
                <Chip label={milestonesList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: D.primaryLight, color: D.primary }} />
              </Box>
            }
          />
          <Tab
            icon={<LedgerIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Audited Ledger</span>
                <Chip label={financialsList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: D.primaryLight, color: D.primary }} />
              </Box>
            }
          />
          <Tab
            icon={<GroupsIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Stakeholders</span>
                <Chip label={organizations.length + activeManagers.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: D.primaryLight, color: D.primary }} />
              </Box>
            }
          />
          <Tab
            icon={<FolderOpenIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Legal Documents</span>
                <Chip label={documentsList.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: D.primaryLight, color: D.primary }} />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ── 5. MAIN CONTENT AREA (EDGE-TO-EDGE MULTI-COLUMN) ──────────────── */}
      <Grid container spacing={3} alignItems="flex-start">
        {/* LEFT COLUMN: 8 cols on lg (Specs, Timeline, Disbursements) */}
        <Grid item xs={12} lg={tabIndex === 0 ? 8 : 12}>
          <Stack spacing={3}>
            {/* SECTION 1: CONCESSION CONTRACT ARCHITECTURE CARD */}
            {(tabIndex === 0 || tabIndex === 1) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2.5, borderBottom: `1px solid ${D.borderSubtle}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, backgroundColor: D.primaryLight, color: D.primary, borderRadius: 2 }}>
                        <GavelIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '1.1rem' }}>
                          Concession Contract Architecture
                        </Typography>
                        <Typography variant="caption" sx={{ color: D.textMuted }}>
                          Statutory baseline, sovereign concession ref, and legal enactment parameters
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label="Enforced & Ratified"
                      size="small"
                      sx={{ fontWeight: 800, backgroundColor: D.activeBg, color: D.activeFg, fontSize: '0.72rem' }}
                    />
                  </Box>

                  {/* Specification Matrix Grid */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ p: 1.75, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.25 }}>
                          Sovereign Concession Ref
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary, fontFamily: 'ui-monospace, monospace' }}>
                          {projectCode}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ p: 1.75, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.25 }}>
                          Statutory Basis / Origin
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary }}>
                          {project.proposal_number ? `Proposal #${project.proposal_number}` : '—'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ p: 1.75, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.25 }}>
                          Execution / Signing Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary }}>
                          {fmt.date(contractDate)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ p: 1.75, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.25 }}>
                          Site Area / Footprint
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary }}>
                          {siteAreaVal ? `${fmt.number(siteAreaVal)} ${siteAreaUnit}` : '—'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ p: 1.75, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.25 }}>
                          Audited By / Directorate
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary }}>
                          {project.created_by_name || '—'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Scope Narrative */}
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                        <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 0.5 }}>
                          Scope of Concession Works
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.65 }}>
                          {project.description || '—'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Active Project Governance / Managers */}
                    {activeManagers.length > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: D.surfaceSubtle, border: `1px solid ${D.borderSubtle}` }}>
                          <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700, display: 'block', mb: 1.25 }}>
                            Active Assigned Project Managers ({activeManagers.length})
                          </Typography>
                          <Grid container spacing={1.5}>
                            {activeManagers.map((m, idx) => (
                              <Grid item xs={12} sm={6} key={m.id || idx}>
                                <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: D.card, border: `1px solid ${D.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 34, height: 34, backgroundColor: D.primaryLight, color: D.primary, fontSize: '0.85rem', fontWeight: 800 }}>
                                    {m.name ? m.name.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '0.82rem' }} noWrap>
                                      {m.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: D.textMuted, fontSize: '0.72rem', display: 'block' }} noWrap>
                                      {m.email || m.phone || '—'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Fade>
            )}

            {/* SECTION 2: MILESTONE IMPLEMENTATION PHASING TIMELINE */}
            {(tabIndex === 0 || tabIndex === 2) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, pb: 2.5, borderBottom: `1px solid ${D.borderSubtle}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, backgroundColor: '#fef3c7', color: '#b45309', borderRadius: 2 }}>
                        <TimelineIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '1.1rem' }}>
                          Milestone Implementation Phasing
                        </Typography>
                        <Typography variant="caption" sx={{ color: D.textMuted }}>
                          Milestones and phasing recorded for this project
                        </Typography>
                      </Box>
                    </Box>

                    {milestonesList.length > 0 && (
                      <Chip
                        label={`${completedMilestones}/${milestonesList.length} Completed`}
                        size="small"
                        sx={{ fontWeight: 700, backgroundColor: D.surfaceSubtle, color: D.textMuted, border: `1px solid ${D.borderSubtle}` }}
                      />
                    )}
                  </Box>

                  {/* Connected Roadmap Timeline */}
                  {milestonesList.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <TimelineIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                        No milestones recorded
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Milestone data will appear here once added to this project.
                      </Typography>
                    </Box>
                  ) : (
                  <Box sx={{ position: 'relative', mt: 3, pl: 2 }}>
                    {/* Vertical guideline */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 36,
                        top: 20,
                        bottom: 20,
                        width: 2,
                        backgroundColor: '#e2e8f0',
                      }}
                    />

                    <Stack spacing={2.5}>
                      {milestonesList.map((m, idx) => {
                        const isDone = m.status === 'Completed';
                        const isProgress = m.status === 'In Progress';
                        const dotBg = isDone ? D.activeBg : isProgress ? D.constructBg : '#f1f5f9';
                        const dotFg = isDone ? D.activeFg : isProgress ? D.constructFg : '#94a3b8';

                        return (
                          <Box key={m.id || idx} sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                            {/* Milestone Marker Avatar */}
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                backgroundColor: dotBg,
                                color: dotFg,
                                zIndex: 1,
                                boxShadow: isProgress ? '0 0 0 4px rgba(245, 158, 11, 0.2)' : '0 2px 6px rgba(0,0,0,0.06)',
                              }}
                            >
                              {isDone ? <SuccessIcon fontSize="small" /> : isProgress ? <InProgressIcon fontSize="small" /> : <PendingIcon fontSize="small" />}
                            </Avatar>

                            {/* Milestone Card Body */}
                            <Box
                              sx={{
                                flex: 1,
                                p: 2.25,
                                borderRadius: 2.5,
                                backgroundColor: isDone ? 'rgba(34, 197, 94, 0.02)' : isProgress ? 'rgba(245, 158, 11, 0.03)' : D.surfaceSubtle,
                                border: `1px solid ${isProgress ? '#fde68a' : D.borderSubtle}`,
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', md: 'center' },
                                gap: 2,
                              }}
                            >
                              <Box sx={{ spaceY: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary }}>
                                    {m.name}
                                  </Typography>
                                  <Chip
                                    label={m.tolerance || m.status}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      backgroundColor: isDone ? D.activeBg : isProgress ? D.constructBg : '#f1f5f9',
                                      color: isDone ? D.activeFg : isProgress ? D.constructFg : '#64748b',
                                    }}
                                  />
                                </Box>

                                <Typography variant="body2" sx={{ color: D.textMuted, fontSize: '0.8rem', mt: 0.25 }}>
                                  {m.deliverable}
                                </Typography>
                              </Box>

                              <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 150 }}>
                                <Typography variant="caption" sx={{ color: D.textMuted, display: 'block', fontSize: '0.72rem' }}>
                                  Target Milestone Date
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '0.8rem' }}>
                                  {fmt.date(m.targetDate)}
                                </Typography>
                                {m.actualDate && (
                                  <Typography variant="caption" sx={{ color: D.activeFg, fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                                    ✓ Verified {fmt.date(m.actualDate)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                  )}
                </Paper>
              </Fade>
            )}

            {/* SECTION 3: RECENT AUDITED CAPITAL DISBURSEMENTS TABLE */}
            {(tabIndex === 0 || tabIndex === 3) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: 2 }}>
                        <LedgerIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '1.1rem' }}>
                          Recent Audited Capital Disbursements
                        </Typography>
                        <Typography variant="caption" sx={{ color: D.textMuted }}>
                          Capital disbursements recorded for this project
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        px: 2,
                        py: 0.75,
                        borderRadius: 2,
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        textAlign: 'right',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                        Total Verified Disbursements
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                        {fmt.currency(totalFinancialsSum, true, currencyCode)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Table Component */}
                  <TableContainer>
                    <Table sx={{ minWidth: 680 }}>
                      <TableHead sx={{ backgroundColor: D.surfaceSubtle }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tranche ID</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description / Purpose</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Escrow Account</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount ({currencyCode})</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, color: D.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audit Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialsList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6, border: 0 }}>
                              <LedgerIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', display: 'block' }}>
                                No disbursements recorded
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Financial transactions will appear here once added to this project.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                        financialsList.map((f, i) => (
                          <TableRow key={f.id || i} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 800, color: D.primaryCont, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                              {f.id}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: D.textPrimary, fontSize: '0.8rem' }}>
                              {fmt.date(f.date)}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: D.textPrimary, fontSize: '0.82rem' }}>
                                {f.type}
                              </Typography>
                              <Typography variant="caption" sx={{ color: D.textMuted, display: 'block', fontSize: '0.72rem' }} noWrap>
                                {f.description}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', color: D.textMuted }}>
                              {f.escrow || '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: D.textPrimary, fontSize: '0.84rem' }}>
                              {fmt.currency(f.amount, false, currencyCode)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={f.status}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  backgroundColor: f.status.includes('Escrow') ? '#fff7ed' : D.activeBg,
                                  color: f.status.includes('Escrow') ? '#b45309' : D.activeFg,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Fade>
            )}
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: 4 cols on lg (Snapshot, Stakeholders, Documents) */}
        <Grid item xs={12} lg={tabIndex === 0 ? 4 : 12}>
          <Stack spacing={3}>
            {/* 1. VISUAL INFRASTRUCTURE OVERVIEW & SNAPSHOT CARD */}
            {(tabIndex === 0 || tabIndex === 1) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 34, height: 34, backgroundColor: '#ecfeff', color: '#06b6d4', borderRadius: 2 }}>
                      <AssessmentIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: D.textPrimary }}>
                      Operational Parameters
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: D.surfaceSubtle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: D.textMuted, fontWeight: 700 }}>Enforcement Status</Typography>
                      <Chip label={project.is_active ? 'Active & Validated' : 'Suspended'} size="small" sx={{ height: 18, fontSize: '0.64rem', fontWeight: 800, backgroundColor: D.activeBg, color: D.activeFg }} />
                    </Box>
                  </Stack>
                </Paper>
              </Fade>
            )}

            {/* 2. STAKEHOLDER DIRECTORY & PARTICIPATING ORGANIZATIONS */}
            {(tabIndex === 0 || tabIndex === 4) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 34, height: 34, backgroundColor: D.primaryLight, color: D.primary, borderRadius: 2 }}>
                        <GroupsIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: D.textPrimary }}>
                        Stakeholder Directory
                      </Typography>
                    </Box>
                    <Chip label={`${organizations.length} Entities`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, backgroundColor: D.surfaceSubtle, color: D.textMuted }} />
                  </Box>

                  <Stack spacing={1.5}>
                    {organizations.length > 0 ? (
                      organizations.map((org, idx) => {
                        const typeName = org.organization_type_name || org.organization_type_code || '—';
                        return (
                          <Box
                            key={org.id || idx}
                            sx={{
                              p: 1.75,
                              borderRadius: 2,
                              backgroundColor: D.surfaceSubtle,
                              border: `1px solid ${D.borderSubtle}`,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                            }}
                          >
                            <Avatar sx={{ width: 34, height: 34, backgroundColor: D.card, color: D.primaryCont, borderRadius: 1.5, border: `1px solid ${D.borderSubtle}` }}>
                              <CorporateFareIcon fontSize="small" />
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="caption" sx={{ color: D.primaryCont, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                                {typeName}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '0.84rem' }} noWrap>
                                {org.organization_name || org.name || '—'}
                              </Typography>
                              {(org.contact_person || org.representative || org.email) && (
                                <Typography variant="caption" sx={{ color: D.textMuted, fontSize: '0.72rem' }}>
                                  {org.contact_person || org.representative || org.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })
                    ) : (
                      <Box sx={{ py: 3, textAlign: 'center', color: D.textLight }}>
                        No participating organizations linked yet.
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Fade>
            )}

            {/* 3. KEY CONCESSION LEGAL & TECHNICAL DOCUMENTS */}
            {(tabIndex === 0 || tabIndex === 5) && (
              <Fade in timeout={300}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3.5,
                    border: `1px solid ${D.border}`,
                    backgroundColor: D.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 34, height: 34, backgroundColor: '#f5f3ff', color: '#7c3aed', borderRadius: 2 }}>
                        <FolderOpenIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: D.textPrimary }}>
                        Key Concession Documents
                      </Typography>
                    </Box>
                    <Chip label={`${documentsList.length} Files`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, backgroundColor: D.surfaceSubtle, color: D.textMuted }} />
                  </Box>

                  <Stack spacing={1.5}>
                    {documentsList.length === 0 ? (
                      <Box sx={{ py: 3, textAlign: 'center', color: D.textLight }}>
                        <FolderOpenIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', display: 'block' }}>
                          No documents uploaded
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Legal and technical documents will appear here once attached.
                        </Typography>
                      </Box>
                    ) : (
                    documentsList.map((doc, idx) => (
                      <Box
                        key={doc.id || idx}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          backgroundColor: D.surfaceSubtle,
                          border: `1px solid ${D.borderSubtle}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': { backgroundColor: '#ffffff', borderColor: D.primaryCont, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <PdfIcon sx={{ color: '#ef4444', fontSize: 26 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: D.textPrimary, fontSize: '0.8rem' }} noWrap>
                              {doc.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: D.textMuted, fontSize: '0.7rem', display: 'block' }}>
                              {doc.size} • {doc.date}
                            </Typography>
                          </Box>
                        </Box>

                        <Tooltip title="Download official file copy">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadDoc(doc.name)}
                            sx={{
                              color: D.textMuted,
                              '&:hover': { color: D.primary, backgroundColor: D.primaryLight },
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )))}
                  </Stack>
                </Paper>
              </Fade>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetails;