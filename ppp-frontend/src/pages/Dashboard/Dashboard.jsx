/**
 * Public & Private Partnership (PPP) Dashboard
 *
 * Executive overview of the national PPP portfolio: projects, investment,
 * proposals, pending technical reviews, and partner organizations.
 * All figures are aggregated live from the PPP backend services.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AccountTree as ProjectsIcon,
  Payments as BudgetIcon,
  Description as ProposalIcon,
  RateReview as ReviewIcon,
  Business as OrgIcon,
  Handshake as HandshakeIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pppProjectService } from '../../services/projectServices/pppProjectService';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectReviewersService } from '../../services/projectServices/projectReviewersService';
import { organizationService } from '../../services/organizationService/organizationService';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* Design tokens — InfraNexus PPP design language                      */
/* ------------------------------------------------------------------ */

const D = {
  primary: '#000ea1',
  primaryCont: '#1c2ac8',
  primaryLight: '#e8eaff',
  accent: '#00a2ff',
  textPrimary: '#0b1c30',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  bg: '#f4f6fb',
  card: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  errorBg: '#fef2f2',
  errorText: '#dc2626',
};

const FONT = { fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif" };

/* Map a status name (projects, proposals, reviews) to colors. */
const resolveStatus = (name) => {
  const s = String(name || '').toLowerCase();
  if (s.includes('operational') || s.includes('active')) {
    return { dot: '#22c55e', bg: '#dcfce7', fg: '#15803d' };
  }
  if (s.includes('construct') || s.includes('epc') || s.includes('progress')) {
    return { dot: '#f59e0b', bg: '#fef3c7', fg: '#b45309' };
  }
  if (s.includes('complet') || s.includes('handed')) {
    return { dot: '#7c3aed', bg: '#f5f3ff', fg: '#6d28d9' };
  }
  if (s.includes('financ') || s.includes('close') || s.includes('sign')) {
    return { dot: '#0ea5e9', bg: '#e0f2fe', fg: '#0369a1' };
  }
  if (s.includes('cancel') || s.includes('terminat') || s.includes('suspend')) {
    return { dot: '#ef4444', bg: '#fee2e2', fg: '#b91c1c' };
  }
  if (s.includes('pend') || s.includes('review') || s.includes('draft') || s.includes('submit')) {
    return { dot: '#6366f1', bg: '#eef2ff', fg: '#4338ca' };
  }
  return { dot: '#94a3b8', bg: '#f1f5f9', fg: '#64748b' };
};

/* Fallback palette for statuses that don't match a known keyword. */
const STATUS_PALETTE = ['#22c55e', '#f59e0b', '#7c3aed', '#0ea5e9', '#ef4444', '#94a3b8', '#1c2ac8', '#f472b6'];

/* Indigo ramp for the budget bar chart. */
const BUDGET_COLORS = ['#000ea1', '#1c2ac8', '#3b49df', '#6366f1', '#818cf8'];

/* ------------------------------------------------------------------ */
/* Data helpers — backend response envelopes vary across services      */
/* ------------------------------------------------------------------ */

const extractList = (res, keys = []) => {
  if (!res) return [];
  const containers = [res, res.data];
  for (const container of containers) {
    if (!container) continue;
    if (Array.isArray(container)) return container;
    for (const key of keys) {
      if (Array.isArray(container[key])) return container[key];
    }
    if (Array.isArray(container.rows)) return container.rows;
  }
  return [];
};

const extractTotal = (res, fallback = 0) => {
  const candidates = [
    res?.pagination?.total,
    res?.total,
    res?.count,
    res?.data?.pagination?.total,
    res?.data?.total,
    res?.data?.count,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      const parsed = Number(candidate);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
};

const truncate = (text, max = 32) => {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

const KpiCard = ({ icon, tint, value, label, footer, loading }) => (
  <Card
    elevation={0}
    sx={{
      ...FONT,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
      p: '20px',
      borderRadius: '14px',
      border: `1px solid ${D.border}`,
      bgcolor: D.card,
      boxShadow: '0 1px 3px rgba(11, 28, 48, 0.04)',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      '&:hover': {
        boxShadow: '0 10px 28px rgba(11, 28, 48, 0.08)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '11px',
          bgcolor: tint.bg,
          color: tint.fg,
          border: `1px solid ${tint.fg}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    </Box>

    {loading ? (
      <Skeleton width="64%" height={38} />
    ) : (
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.7rem',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: D.textPrimary,
          fontVariantNumeric: 'tabular-nums',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    )}

    <Typography
      sx={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        color: D.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}
    >
      {label}
    </Typography>

    <Box
      sx={{
        mt: 'auto',
        pt: 1.25,
        borderTop: `1px solid ${D.borderSubtle}`,
        fontSize: '0.6875rem',
        lineHeight: 1.5,
        color: D.textMuted,
      }}
    >
      {footer}
    </Box>
  </Card>
);

const SectionCard = ({ title, subtitle, icon, action, children }) => (
  <Card
    elevation={0}
    sx={{
      ...FONT,
      height: '100%',
      borderRadius: '14px',
      border: `1px solid ${D.border}`,
      bgcolor: D.card,
      boxShadow: '0 1px 3px rgba(11, 28, 48, 0.04)',
    }}
  >
    <Box
      sx={{
        p: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: '10px',
            bgcolor: D.primaryLight,
            color: D.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: D.textPrimary }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: D.textMuted }}>{subtitle}</Typography>
        </Box>
      </Box>
      {action}
    </Box>
    <Box sx={{ px: '22px', pb: '22px' }}>{children}</Box>
  </Card>
);

const StatusPill = ({ name }) => {
  const status = resolveStatus(name);
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.1,
        py: 0.35,
        borderRadius: '6px',
        bgcolor: status.bg,
        color: status.fg,
        border: `1px solid ${status.dot}33`,
        fontSize: '0.6875rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.dot }} />
      {name || 'Unknown'}
    </Box>
  );
};

const EmptyState = ({ icon, title, message, actionLabel, onAction }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 5,
      gap: 1.5,
      textAlign: 'center',
    }}
  >
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        bgcolor: D.primaryLight,
        color: D.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: D.textPrimary }}>{title}</Typography>
    <Typography sx={{ fontSize: '0.78rem', color: D.textMuted, maxWidth: 320 }}>{message}</Typography>
    {actionLabel && (
      <Button
        variant="contained"
        size="small"
        onClick={onAction}
        sx={{ ...FONT, fontWeight: 700, borderRadius: '8px', textTransform: 'none', bgcolor: D.primaryCont }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);

const BudgetTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <Box
      sx={{
        ...FONT,
        bgcolor: D.textPrimary,
        color: '#fff',
        px: 1.25,
        py: 0.9,
        borderRadius: '8px',
        fontSize: 12,
        maxWidth: 280,
        boxShadow: '0 8px 24px rgba(11, 28, 48, 0.25)',
      }}
    >
      <Box sx={{ fontWeight: 700, mb: 0.25 }}>{data.full}</Box>
      <Box sx={{ opacity: 0.85 }}>{formatCurrency(data.budget)}</Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadErrors, setLoadErrors] = useState({});

  const [projects, setProjects] = useState([]);
  const [projectTotal, setProjectTotal] = useState(0);

  const [proposals, setProposals] = useState([]);
  const [proposalTotal, setProposalTotal] = useState(0);

  const [pendingReviews, setPendingReviews] = useState(0);
  const [reviewProposals, setReviewProposals] = useState(0);

  const [orgTotal, setOrgTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    const [projectsRes, proposalsRes, reviewsRes, orgsRes] = await Promise.allSettled([
      pppProjectService.getProjects({ page: 1, limit: 500 }),
      projectProposalService.getProposals({ page: 1, limit: 50 }),
      projectReviewersService.getReviewers({ page: 1, limit: 200, status: 'Pending' }),
      organizationService.getOrganizations({ page: 1, limit: 100 }),
    ]);

    const errors = {};

    /* Projects — the core portfolio dataset */
    if (projectsRes.status === 'fulfilled') {
      const list = extractList(projectsRes.value, ['projects']);
      setProjects(list);
      setProjectTotal(extractTotal(projectsRes.value, list.length));
    } else {
      errors.projects = true;
      setProjects([]);
      setProjectTotal(0);
    }

    /* Project proposals */
    if (proposalsRes.status === 'fulfilled') {
      const list = extractList(proposalsRes.value, ['proposals', 'rows']);
      setProposals(list);
      setProposalTotal(extractTotal(proposalsRes.value, list.length));
    } else {
      errors.proposals = true;
      setProposals([]);
      setProposalTotal(0);
    }

    /* Pending technical reviews */
    if (reviewsRes.status === 'fulfilled') {
      const list = extractList(reviewsRes.value, ['reviewers']);
      setPendingReviews(extractTotal(reviewsRes.value, list.length));
      setReviewProposals(new Set(list.map((r) => r.proposal_id ?? r.proposalId ?? r.proposal?.id).filter((v) => v != null)).size);
    } else {
      errors.reviews = true;
      setPendingReviews(0);
      setReviewProposals(0);
    }

    /* Partner organizations */
    if (orgsRes.status === 'fulfilled') {
      const list = extractList(orgsRes.value, ['organizations', 'rows']);
      setOrgTotal(extractTotal(orgsRes.value, list.length));
    } else {
      errors.organizations = true;
      setOrgTotal(0);
    }

    setLoadErrors(errors);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  /* ---------------- Derived figures ---------------- */

  const totalBudget = useMemo(
    () => projects.reduce((sum, p) => sum + (Number(p.estimated_budget_amount) || 0), 0),
    [projects]
  );

  const budgetedCount = useMemo(
    () => projects.filter((p) => (Number(p.estimated_budget_amount) || 0) > 0).length,
    [projects]
  );

  const statusCounts = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => {
      const name = p.status_name || p.status?.name || 'Unknown';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const operationalCount = useMemo(
    () => projects.filter((p) => /operational|active/i.test(p.status_name || p.status?.name || '')).length,
    [projects]
  );

  const constructionCount = useMemo(
    () => projects.filter((p) => /construct|epc|progress/i.test(p.status_name || p.status?.name || '')).length,
    [projects]
  );

  const topBudgetProjects = useMemo(
    () =>
      projects
        .map((p) => ({
          full: p.name || 'Untitled project',
          name: truncate(p.name || 'Untitled project', 26),
          budget: Number(p.estimated_budget_amount) || 0,
        }))
        .filter((p) => p.budget > 0)
        .sort((a, b) => b.budget - a.budget)
        .slice(0, 5),
    [projects]
  );

  const awaitingAction = useMemo(
    () =>
      proposals.filter((p) => /pend|review|draft|submit|under/i.test(p.status_name || p.status?.name || '')).length,
    [proposals]
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6),
    [projects]
  );

  const recentProposals = useMemo(
    () =>
      [...proposals]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6),
    [proposals]
  );

  const statusColors = useMemo(() => {
    const palette = {};
    statusCounts.forEach((entry, index) => {
      const status = resolveStatus(entry.name);
      const isDefault = status.dot === '#94a3b8';
      palette[entry.name] = isDefault ? STATUS_PALETTE[index % STATUS_PALETTE.length] : status.dot;
    });
    return palette;
  }, [statusCounts]);

  const chartStatusData = useMemo(
    () =>
      statusCounts.map((entry) => ({
        ...entry,
        color: statusColors[entry.name] || STATUS_PALETTE[0],
      })),
    [statusCounts, statusColors]
  );

  /* ---------------- Header copy ---------------- */

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.first_name || user?.display_name?.split?.(' ')?.[0] || user?.username || 'there';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const updatedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const hasErrors = Object.keys(loadErrors).length > 0;

  return (
    <Box sx={{ ...FONT, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ============================================================ */}
      {/* Hero header                                                   */}
      {/* ============================================================ */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          p: { xs: 2.5, md: 3.5 },
          background: 'linear-gradient(115deg, #000ea1 0%, #1c2ac8 60%, #3b49df 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5,
          boxShadow: '0 12px 32px -14px rgba(0, 14, 161, 0.5)',
        }}
      >
        {/* decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.07)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -90,
            right: 160,
            width: 180,
            height: 180,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', minWidth: 0 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.4,
              mb: 1.5,
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <HandshakeIcon sx={{ fontSize: 14 }} />
            National PPP Overview
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.45rem', md: '1.9rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Public &amp; Private Partnership Dashboard
          </Typography>

          <Typography sx={{ mt: 1, fontSize: { xs: '0.82rem', md: '0.9rem' }, opacity: 0.9 }}>
            {greeting}, {firstName}. Portfolio snapshot for {today}.
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Tooltip title="Refresh dashboard data">
            <span>
              <IconButton
                onClick={() => loadAll(true)}
                disabled={refreshing}
                sx={{
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: '10px',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                }}
              >
                {refreshing ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ============================================================ */}
      {/* Error banner                                                  */}
      {/* ============================================================ */}
      {hasErrors && !loading && (
        <Alert
          severity="error"
          variant="outlined"
          sx={{ ...FONT, borderRadius: '12px', bgcolor: D.errorBg, color: D.errorText, borderColor: '#fecaca' }}
          action={
            <Button color="inherit" size="small" onClick={() => loadAll(true)} sx={{ fontWeight: 700 }}>
              Retry
            </Button>
          }
        >
          Some dashboard data could not be loaded. Figures shown may be incomplete.
        </Alert>
      )}

      {/* ============================================================ */}
      {/* KPI row                                                       */}
      {/* ============================================================ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' },
          gap: 2,
        }}
      >
        <KpiCard
          loading={loading}
          icon={<ProjectsIcon fontSize="small" />}
          tint={{ bg: '#e8eaff', fg: '#1c2ac8' }}
          value={loadErrors.projects ? '—' : formatNumber(projectTotal)}
          label="Total PPP Projects"
          footer={
            loadErrors.projects
              ? 'Unavailable — try refreshing'
              : `${formatNumber(operationalCount)} operational · ${formatNumber(constructionCount)} under construction`
          }
        />
        <KpiCard
          loading={loading}
          icon={<BudgetIcon fontSize="small" />}
          tint={{ bg: '#dcfce7', fg: '#15803d' }}
          value={loadErrors.projects ? '—' : formatCurrency(totalBudget, true)}
          label="Estimated Investment"
          footer={`Estimated capital across ${formatNumber(budgetedCount)} projects`}
        />
        <KpiCard
          loading={loading}
          icon={<ProposalIcon fontSize="small" />}
          tint={{ bg: '#f5f3ff', fg: '#7c3aed' }}
          value={loadErrors.proposals ? '—' : formatNumber(proposalTotal)}
          label="Project Proposals"
          footer={loadErrors.proposals ? 'Unavailable — try refreshing' : `${formatNumber(awaitingAction)} awaiting action`}
        />
        <KpiCard
          loading={loading}
          icon={<ReviewIcon fontSize="small" />}
          tint={{ bg: '#fef3c7', fg: '#b45309' }}
          value={loadErrors.reviews ? '—' : formatNumber(pendingReviews)}
          label="Pending Reviews"
          footer={
            loadErrors.reviews
              ? 'Unavailable — try refreshing'
              : `Technical review queue · ${formatNumber(reviewProposals)} proposals`
          }
        />
        <KpiCard
          loading={loading}
          icon={<OrgIcon fontSize="small" />}
          tint={{ bg: '#e0f2fe', fg: '#0369a1' }}
          value={loadErrors.organizations ? '—' : formatNumber(orgTotal)}
          label="Partner Organizations"
          footer="Registered public and private sector partners"
        />
      </Box>

      {/* ============================================================ */}
      {/* Charts                                                        */}
      {/* ============================================================ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Projects by status — donut */}
        <SectionCard
          title="Projects by Status"
          subtitle="Current portfolio composition"
          icon={<ProjectsIcon fontSize="small" />}
          action={
            <Button
              size="small"
              endIcon={<ArrowIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/projects')}
              sx={{ ...FONT, fontWeight: 700, color: D.primaryCont, textTransform: 'none' }}
            >
              View all
            </Button>
          }
        >
          {loading ? (
            <Skeleton variant="rounded" height={250} />
          ) : chartStatusData.length === 0 ? (
            <EmptyState
              icon={<ProjectsIcon />}
              title="No projects yet"
              message="Once PPP projects are registered, their status breakdown will appear here."
              actionLabel="Create project"
              onAction={() => navigate('/projects/new')}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box sx={{ position: 'relative', width: { xs: '100%', sm: 220 }, height: 230, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {chartStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value, name) => [`${formatNumber(value)} project(s)`, name]}
                      contentStyle={{
                        ...FONT,
                        borderRadius: 8,
                        border: `1px solid ${D.border}`,
                        fontSize: 12,
                        boxShadow: '0 8px 24px rgba(11, 28, 48, 0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: D.textPrimary, lineHeight: 1 }}>
                    {formatNumber(projectTotal)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: D.textLight, letterSpacing: '0.1em' }}>
                    PROJECTS
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.1 }}>
                {chartStatusData.map((entry) => (
                  <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: entry.color, flexShrink: 0 }} />
                    <Typography
                      noWrap
                      sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 600, color: D.textPrimary }}
                    >
                      {entry.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: D.textPrimary,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.value}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.75rem', color: D.textLight, width: 40, textAlign: 'right', flexShrink: 0 }}
                    >
                      {projectTotal > 0 ? Math.round((entry.value / projectTotal) * 100) : 0}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </SectionCard>

        {/* Top projects by capital — horizontal bars */}
        <SectionCard
          title="Top Projects by Capital Allocation"
          subtitle="Five largest estimated investments in the portfolio"
          icon={<BudgetIcon fontSize="small" />}
        >
          {loading ? (
            <Skeleton variant="rounded" height={250} />
          ) : topBudgetProjects.length === 0 ? (
            <EmptyState
              icon={<BudgetIcon />}
              title="No budget data"
              message="Projects with an estimated budget will be ranked here automatically."
            />
          ) : (
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topBudgetProjects}
                  layout="vertical"
                  margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={D.borderSubtle} />
                  <XAxis
                    type="number"
                    tick={{ fill: D.textLight, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value, true).replace('ETB', '').trim()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={148}
                    tick={{ fill: D.textMuted, fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={<BudgetTooltip />}
                    cursor={{ fill: 'rgba(0, 14, 161, 0.04)' }}
                  />
                  <Bar dataKey="budget" radius={[0, 6, 6, 0]} barSize={18}>
                    {topBudgetProjects.map((entry, index) => (
                      <Cell key={entry.full} fill={BUDGET_COLORS[index % BUDGET_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ============================================================ */}
      {/* Projects table + proposals list                               */}
      {/* ============================================================ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Recent PPP projects */}
        <SectionCard
          title="Recent PPP Projects"
          subtitle="Latest entries in the partnership portfolio"
          icon={<ProjectsIcon fontSize="small" />}
          action={
            <Button
              size="small"
              endIcon={<ArrowIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/projects')}
              sx={{ ...FONT, fontWeight: 700, color: D.primaryCont, textTransform: 'none' }}
            >
              View all
            </Button>
          }
        >
          {loading ? (
            <Skeleton variant="rounded" height={280} />
          ) : recentProjects.length === 0 ? (
            <EmptyState
              icon={<ProjectsIcon />}
              title="No PPP projects registered"
              message="Start the pipeline by registering a new partnership project."
              actionLabel="New project"
              onAction={() => navigate('/projects/new')}
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Project', 'Status', 'Capital', 'Signed', ''].map((label, index) => (
                      <TableCell
                        key={index}
                        sx={{
                          borderBottom: `1px solid ${D.border}`,
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          color: D.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          pl: index === 0 ? 0 : 1.5,
                          pr: index === 4 ? 0 : 1.5,
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentProjects.map((project) => {
                    const statusName = project.status_name || project.status?.name || 'Unknown';
                    const budget = Number(project.estimated_budget_amount) || 0;
                    return (
                      <TableRow
                        key={project.id ?? project.name}
                        hover
                        onClick={() => navigate(`/projects/${project.id}`)}
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ borderBottom: `1px solid ${D.borderSubtle}`, pl: 0, maxWidth: 240 }}>
                          <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.8125rem', color: D.textPrimary }}>
                            {project.name || 'Untitled project'}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: '0.7rem', color: D.textLight }}>
                            {project.address || 'Location not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${D.borderSubtle}`, px: 1.5 }}>
                          <StatusPill name={statusName} />
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${D.borderSubtle}`,
                            px: 1.5,
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            color: D.textPrimary,
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {budget > 0 ? formatCurrency(budget, true) : '—'}
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${D.borderSubtle}`,
                            px: 1.5,
                            fontSize: '0.75rem',
                            color: D.textMuted,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDate(project.contract_signing_date)}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${D.borderSubtle}`, pr: 0, textAlign: 'right' }}>
                          <Tooltip title="View project">
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/projects/${project.id}`);
                              }}
                              sx={{ color: D.textLight, '&:hover': { color: D.primaryCont } }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {/* Recent proposals */}
        <SectionCard
          title="Recent Proposals"
          subtitle="Latest submissions from partner organizations"
          icon={<ProposalIcon fontSize="small" />}
          action={
            <Button
              size="small"
              endIcon={<ArrowIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/projects/proposals')}
              sx={{ ...FONT, fontWeight: 700, color: D.primaryCont, textTransform: 'none' }}
            >
              View all
            </Button>
          }
        >
          {loading ? (
            <Skeleton variant="rounded" height={280} />
          ) : recentProposals.length === 0 ? (
            <EmptyState
              icon={<ProposalIcon />}
              title="No proposals yet"
              message="Partner organizations have not submitted any project proposals."
              actionLabel="New proposal"
              onAction={() => navigate('/projects/proposals/new')}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {recentProposals.map((proposal, index) => {
                const statusName = proposal.status_name || proposal.status?.name || 'Unknown';
                return (
                  <Box
                    key={proposal.id ?? index}
                    onClick={() => navigate(`/projects/proposals/${proposal.id}`)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.6,
                      py: 1.4,
                      cursor: 'pointer',
                      borderTop: index === 0 ? 'none' : `1px solid ${D.borderSubtle}`,
                      px: 1,
                      mx: -1,
                      borderRadius: '8px',
                      transition: 'background-color 0.15s ease',
                      '&:hover': { bgcolor: '#f8f9ff' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          color: D.primaryCont,
                          bgcolor: D.primaryLight,
                          px: 0.9,
                          py: 0.2,
                          borderRadius: '5px',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {proposal.prop_number || '—'}
                      </Typography>
                      <StatusPill name={statusName} />
                    </Box>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.8125rem', color: D.textPrimary }}>
                      {proposal.proposed_project_name || 'Untitled proposal'}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.7rem', color: D.textMuted }}>
                      {proposal.organization_name || 'Organization not specified'} · {formatDate(proposal.created_at)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ============================================================ */}
      {/* Footer meta                                                   */}
      {/* ============================================================ */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: D.textLight }}>
          <TimeIcon sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: '0.72rem' }}>Dashboard data refreshed at {updatedTime}</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: D.textLight }}>
          Public &amp; Private Partnership Portal
        </Typography>
      </Box>
    </Box>
  );
};
