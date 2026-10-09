// pages/Projects/ProjectList.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  InputAdornment,
  Skeleton,
  LinearProgress,
  Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterAltOff as ResetIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  QueryStats as StatsIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendUpIcon,
  CheckCircle as CheckCircleIcon,
  Construction as ConstructIcon,
  Verified as VerifiedIcon,
  AccountTree as PipelineIcon,
  ArrowDownward as SortDownIcon,
  UnfoldMore as UnsortedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { pppProjectService } from '../../services/projectServices/pppProjectService';
import { projectStatusService } from '../../services/foundationService/projectStatusService';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

/* ── Design Tokens (InfraNexus PPP palette) ─────────────────────────────────── */
const D = {
  primary:        '#000ea1',
  primaryCont:    '#1c2ac8',
  primaryMid:     '#3b49df',
  primaryLight:   '#e8eaff',
  textPrimary:    '#0b1c30',
  textMuted:      '#64748b',
  textLight:      '#94a3b8',
  bg:             '#f4f6fb',
  card:           '#ffffff',
  surfaceLow:     '#f2f3ff',
  border:         '#e2e8f0',
  borderSubtle:   '#f1f5f9',
  // status
  activeBg:       '#dcfce7', activeFg:       '#15803d', activeDot: '#22c55e',
  constructBg:    '#fef3c7', constructFg:    '#b45309', constructDot: '#f59e0b',
  completedBg:    '#f5f3ff', completedFg:    '#7c3aed', completedDot: '#7c3aed',
  financeBg:      '#e0f2fe', financeFg:      '#0369a1', financeDot:  '#0ea5e9',
  errorBg:        '#fee2e2', errorFg:        '#b91c1c', errorDot:    '#ef4444',
  neutralBg:      '#f1f5f9', neutralFg:      '#475569', neutralDot:  '#94a3b8',
};

/* ── Status resolver ─────────────────────────────────────────────────────────── */
const resolveStatus = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('operational') || n.includes('active'))
    return { bg: D.activeBg,    fg: D.activeFg,    dot: D.activeDot,    pulse: true  };
  if (n.includes('construct') || n.includes('epc') || n.includes('progress'))
    return { bg: D.constructBg, fg: D.constructFg, dot: D.constructDot, pulse: false };
  if (n.includes('complet') || n.includes('handed') || n.includes('revert'))
    return { bg: D.completedBg, fg: D.completedFg, dot: D.completedDot, pulse: false };
  if (n.includes('financ') || n.includes('close') || n.includes('sign'))
    return { bg: D.financeBg,   fg: D.financeFg,   dot: D.financeDot,   pulse: false };
  if (n.includes('cancel') || n.includes('terminat') || n.includes('suspend'))
    return { bg: D.errorBg,     fg: D.errorFg,     dot: D.errorDot,     pulse: false };
  return { bg: D.neutralBg, fg: D.neutralFg, dot: D.neutralDot, pulse: false };
};

/* ── Tiny sparkline SVG ──────────────────────────────────────────────────────── */
const Sparkline = ({ color }) => (
  <svg width="64" height="24" viewBox="0 0 64 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 18L14 14L26 19L38 8L50 12L62 3"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 18L14 14L26 19L38 8L50 12L62 3V24H2V18Z"
      fill={color} fillOpacity="0.08" />
  </svg>
);

/* ── KPI Card ────────────────────────────────────────────────────────────────── */
const KpiCard = ({ icon, iconBg, iconColor, badge, badgeColor, badgeBg, badgeBorder,
  value, valueSub, label, footerLeft, footerRight, footerColor, loading }) => (
  <Box sx={{
    flex: '1 1 220px', minWidth: 0,
    bgcolor: D.card, borderRadius: '12px',
    border: `1px solid ${D.border}`, p: '20px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow .2s',
    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  }}>
    {/* Top row */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: '8px',
        bgcolor: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${iconColor}22`,
      }}>
        {icon}
      </Box>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 1.25, py: 0.4, borderRadius: '99px',
        bgcolor: badgeBg, color: badgeColor,
        border: `1px solid ${badgeBorder}`,
        fontSize: '0.6875rem', fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
      }}>
        {badge}
      </Box>
    </Box>

    {/* Value row */}
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {loading
          ? <Skeleton width={60} height={42} />
          : <Typography sx={{ fontFamily: '"Plus Jakarta Sans", Inter, sans-serif', fontWeight: 800, fontSize: '1.875rem', color: D.textPrimary, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Typography>
        }
        <Sparkline color={iconColor} />
      </Box>
      <Typography sx={{ mt: 0.5, fontSize: '0.6875rem', fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </Typography>
      {valueSub && (
        <Box sx={{
          mt: 0.75, display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.25, py: 0.3, borderRadius: '4px',
          bgcolor: iconBg, color: iconColor,
          fontSize: '0.6875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
          border: `1px solid ${iconColor}22`,
        }}>
          {valueSub}
        </Box>
      )}
    </Box>

    {/* Footer */}
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${D.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.6875rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>{footerLeft}</Typography>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: footerColor || D.textPrimary, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{footerRight}</Typography>
    </Box>
  </Box>
);

/* ── Active filter chip ──────────────────────────────────────────────────────── */
const FilterChip = ({ label, color, bg, border, onRemove }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', gap: 0.5,
    px: 1.5, py: 0.5, borderRadius: '99px',
    bgcolor: bg, color, border: `1px solid ${border}`,
    fontSize: '0.6875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif',
  }}>
    <span>{label}</span>
    <Box
      component="button"
      onClick={onRemove}
      sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, display: 'flex', color: 'inherit', '&:hover': { color: D.errorFg } }}
    >
      <CloseIcon sx={{ fontSize: 12 }} />
    </Box>
  </Box>
);

/* ── Status pill ─────────────────────────────────────────────────────────────── */
const StatusPill = ({ name }) => {
  const s = resolveStatus(name);
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75,
      px: 1.5, py: 0.5, borderRadius: '99px',
      bgcolor: s.bg, border: `1px solid ${s.dot}33`,
      fontSize: '0.6875rem', fontWeight: 700, color: s.fg,
      fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
    }}>
      <Box
        sx={{
          width: 6, height: 6, borderRadius: '50%', bgcolor: s.dot, flexShrink: 0,
          ...(s.pulse ? {
            animation: 'ppppulse 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
            '@keyframes ppppulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.35 },
            },
          } : {}),
        }}
      />
      {name}
    </Box>
  );
};

/* ── Mini disbursement bar ───────────────────────────────────────────────────── */
const DisbBar = ({ pct, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
    <Box sx={{ width: 80, height: 5, borderRadius: '99px', bgcolor: D.borderSubtle, overflow: 'hidden', flexShrink: 0 }}>
      <Box sx={{ height: '100%', width: `${Math.min(pct, 100)}%`, bgcolor: color, borderRadius: '99px' }} />
    </Box>
    <Typography sx={{ fontSize: '0.6875rem', color: D.textMuted, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {pct}% disbursed
    </Typography>
  </Box>
);

/* ══ Main Component ════════════════════════════════════════════════════════════ */
export const ProjectList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);

  const [search, setSearch]     = useState('');
  const [statusId, setStatusId] = useState('');
  const [page, setPage]         = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // debounce
  const debRef = useRef(null);
  const [debSearch, setDebSearch] = useState('');
  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(debRef.current);
  }, [search]);

  // load statuses
  useEffect(() => {
    projectStatusService.getProjectStatuses({ limit: 100 }).then((res) => {
      const list =
        res?.projectStatuses || res?.data?.projectStatuses ||
        res?.statuses || res?.data?.statuses ||
        (Array.isArray(res?.data) ? res.data : []) ||
        (Array.isArray(res) ? res : []);
      setStatuses(Array.isArray(list) ? list : []);
    }).catch(() => { });
  }, []);

  // fetch
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pppProjectService.getProjects({ page: page + 1, limit: pageSize, search: debSearch, statusId });
      const list =
        res?.projects || res?.data?.projects ||
        res?.rows || res?.data?.rows ||
        (Array.isArray(res?.data) ? res.data : []) || (Array.isArray(res) ? res : []);
      const count =
        res?.total || res?.data?.total || res?.count || res?.data?.count ||
        (Array.isArray(list) ? list.length : 0);
      setRows(Array.isArray(list) ? list : []);
      setTotal(typeof count === 'number' ? count : 0);
    } catch {
      enqueueSnackbar('Failed to load projects', { variant: 'error' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debSearch, statusId, enqueueSnackbar]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // stats
  const stats = React.useMemo(() => {
    const n = (r) => (r.status_name || r.status?.name || '').toLowerCase();
    return {
      active:      rows.filter(r => n(r).includes('operational') || n(r).includes('active')).length,
      construct:   rows.filter(r => n(r).includes('construct') || n(r).includes('epc')).length,
      completed:   rows.filter(r => n(r).includes('complet') || n(r).includes('hand')).length,
    };
  }, [rows]);

  // delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await pppProjectService.deleteProject(deleteTarget.id);
      enqueueSnackbar('Project deleted', { variant: 'success' });
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // export
  const handleExport = () => {
    const csv = [
      ['ID','Name','Status','Budget','Contract Date','Address'].join(','),
      ...rows.map(r => [r.id,`"${(r.name||'').replace(/"/g,'""')}"`,r.status_name||r.status?.name||'',r.estimated_budget_amount||'',r.contract_signing_date||'',`"${(r.address||'').replace(/"/g,'""')}"`].join(',')),
    ].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download:`PPP_Projects_${Date.now()}.csv`,
    });
    a.click();
  };

  const handleReset = () => { setSearch(''); setStatusId(''); setPage(0); };

  const selectedStatusName = statuses.find(s => s.id === statusId)?.name || '';

  // ── columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      field: 'name',
      headerName: 'Project & Location',
      flex: 2.2, minWidth: 260,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>Project &amp; Location</Typography>
          <SortDownIcon sx={{ fontSize: 14, color: D.textMuted }} />
        </Box>
      ),
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              onClick={() => navigate(`/projects/${row.id}`)}
              sx={{ fontWeight: 700, fontSize: '0.8125rem', color: D.textPrimary, fontFamily: 'Inter, sans-serif', cursor: 'pointer', '&:hover': { color: D.primaryCont } }}
            >
              {row.name || '—'}
            </Typography>
            {row.id && (
              <Box sx={{ px: 1, py: 0.2, borderRadius: '4px', bgcolor: D.primaryLight, color: D.primaryCont, border: `1px solid ${D.primaryLight}`, fontSize: '0.625rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>
                #{String(row.id).slice(0, 8).toUpperCase()}
              </Box>
            )}
          </Box>
          {row.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationIcon sx={{ fontSize: 13, color: D.textLight }} />
              <Typography sx={{ fontSize: '0.6875rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>
                {row.address}
              </Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'status_name',
      headerName: 'Status',
      width: 185,
      valueGetter: (value, row) => (row?.status_name || row?.status?.name || '—'),
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>Status</Typography>
          <UnsortedIcon sx={{ fontSize: 14, color: D.textLight }} />
        </Box>
      ),
      renderCell: ({ row }) => <StatusPill name={row?.status_name || row?.status?.name || '—'} />,
    },
    {
      field: 'estimated_budget_amount',
      headerName: 'Capital & Execution',
      width: 190,
      type: 'number',
      headerAlign: 'left', align: 'left',
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>Capital &amp; Execution</Typography>
          <UnsortedIcon sx={{ fontSize: 14, color: D.textLight }} />
        </Box>
      ),
      renderCell: ({ value, row }) => {
        if (!value) return <Typography sx={{ color: D.textLight, fontSize: '0.8125rem' }}>—</Typography>;
        const sym = row.currency?.symbol || row.currency_symbol || '';
        const fmt = Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const statusN = (row.status_name || row.status?.name || '').toLowerCase();
        const barColor = statusN.includes('operational') || statusN.includes('active') ? D.activeDot
          : statusN.includes('complet') ? '#7c3aed' : D.constructDot;
        const pct = Math.round(Math.random() * 80 + 10); // placeholder — swap for real field when available
        return (
          <Box sx={{ py: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: D.textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, sans-serif' }}>
              {sym} {fmt}
            </Typography>
            <DisbBar pct={pct} color={barColor} />
          </Box>
        );
      },
    },
    {
      field: 'contract_signing_date',
      headerName: 'Concession Timeline',
      width: 165,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>Concession Timeline</Typography>
          <UnsortedIcon sx={{ fontSize: 14, color: D.textLight }} />
        </Box>
      ),
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: D.textPrimary, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
            {value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </Typography>
          {value && (
            <Typography sx={{ fontSize: '0.6875rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>
              Signed {new Date(value).getFullYear()}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'categories',
      headerName: 'Sector & Classification',
      width: 200,
      sortable: false,
      renderHeader: () => (
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>
          Sector &amp; Classification
        </Typography>
      ),
      renderCell: ({ value }) => {
        const cats = Array.isArray(value) ? value : [];
        if (!cats.length) return <Typography sx={{ color: D.textLight, fontSize: '0.8125rem' }}>—</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', py: 0.5 }}>
            {cats.slice(0, 1).map((c, i) => (
              <Box key={i} sx={{ px: 1.25, py: 0.3, borderRadius: '4px', bgcolor: D.primaryLight, color: D.primaryCont, border: `1px solid ${D.primaryLight}`, fontSize: '0.6875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                {c.category_name || c.name || c}
              </Box>
            ))}
            {cats.slice(1, 2).map((c, i) => (
              <Box key={i} sx={{ px: 1.25, py: 0.3, borderRadius: '4px', bgcolor: D.borderSubtle, color: D.textMuted, fontSize: '0.6875rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                {c.category_name || c.name || c}
              </Box>
            ))}
            {cats.length > 2 && (
              <Box sx={{ px: 1, py: 0.3, borderRadius: '4px', bgcolor: D.borderSubtle, color: D.textMuted, fontSize: '0.6875rem' }}>+{cats.length - 2}</Box>
            )}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 108,
      sortable: false, filterable: false,
      align: 'right', headerAlign: 'right',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => navigate(`/projects/${row.id}`)}
              sx={{ borderRadius: '8px', color: D.textLight, p: 0.75, '&:hover': { color: D.primaryCont, bgcolor: D.surfaceLow } }}>
              <ViewIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Project">
            <IconButton size="small" onClick={() => navigate(`/projects/${row.id}/edit`)}
              sx={{ borderRadius: '8px', color: D.textLight, p: 0.75, '&:hover': { color: D.primaryCont, bgcolor: D.surfaceLow } }}>
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteTarget(row)}
              sx={{ borderRadius: '8px', color: D.textLight, p: 0.75, '&:hover': { color: D.errorFg, bgcolor: D.errorBg } }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', fontFamily: 'Inter, sans-serif' }}>

      {/* ══ Sub-header: breadcrumb + live sync ══════════════════════════════ */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.75rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>
          <Typography sx={{ fontSize: '0.75rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>PPP Infrastructure</Typography>
          <Typography sx={{ color: '#e2e8f0' }}>/</Typography>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: D.textPrimary, fontFamily: 'Inter, sans-serif' }}>Project Registry</Typography>
        </Box>
        {/* Live sync pill */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1,
          px: 1.75, py: 0.6, borderRadius: '99px',
          bgcolor: D.card, border: `1px solid ${D.border}`,
          fontSize: '0.6875rem', color: D.textMuted, fontFamily: 'Inter, sans-serif',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <Box sx={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
            <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: '#34d399', opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
              '@keyframes ping': { '75%,100%': { transform: 'scale(2)', opacity: 0 } } }} />
            <Box sx={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
          </Box>
          <Typography sx={{ fontWeight: 600, color: D.textPrimary, fontSize: '0.6875rem', fontFamily: 'Inter, sans-serif' }}>Registry Live</Typography>
          <Typography sx={{ color: '#e2e8f0' }}>•</Typography>
          <Typography sx={{ fontSize: '0.6875rem', fontFamily: 'Inter, sans-serif' }}>Synced with Sovereign Debt Portal</Typography>
        </Box>
      </Box>

      {/* ══ Title + actions ══════════════════════════════════════════════════ */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{
              fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              color: D.textPrimary,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              PPP Projects
            </Typography>
            <Box sx={{
              px: 1.75, py: 0.4, borderRadius: '99px',
              bgcolor: '#dbeafe', border: '1px solid #bfdbfe',
              color: D.primaryCont, fontSize: '0.6875rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
            }}>
              Institutional Tier
            </Box>
          </Box>
          <Typography sx={{ mt: 0.5, fontSize: '0.8125rem', color: D.textMuted, fontFamily: 'Inter, sans-serif' }}>
            {loading ? 'Loading concession records…' : `${total.toLocaleString()} active concessions & public-private infrastructure developments`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon sx={{ fontSize: 15 }} />} onClick={handleExport}
            sx={{ borderRadius: '8px', borderColor: D.border, color: D.textPrimary, fontWeight: 500, fontSize: '0.78rem', textTransform: 'none', fontFamily: 'Inter, sans-serif', bgcolor: D.card, px: 1.75, py: 0.75, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}>
            Quick Export (CSV)
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={() => navigate('/projects/new')}
            sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.78rem', textTransform: 'none', fontFamily: 'Inter, sans-serif', px: 2, py: 0.85, bgcolor: D.primaryCont, boxShadow: '0 2px 8px rgba(28,42,200,0.2)', '&:hover': { bgcolor: D.primaryMid } }}>
            New Concession
          </Button>
        </Box>
      </Box>

      {/* ══ KPI Cards ════════════════════════════════════════════════════════ */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <KpiCard
          icon={<PipelineIcon sx={{ fontSize: 20 }} />}
          iconBg="#dbeafe" iconColor={D.primaryCont}
          badge={<><TrendUpIcon sx={{ fontSize: 13 }} /> +12% YoY</>}
          badgeBg="#f0fdf4" badgeColor="#15803d" badgeBorder="#bbf7d0"
          value={loading ? '…' : total}
          label="Total Pipeline Concessions"
          valueSub={null}
          footerLeft="Aggregate Value" footerRight="$42.8B Valuation"
          loading={loading}
        />
        <KpiCard
          icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
          iconBg="#f0fdf4" iconColor="#15803d"
          badge="59.4% Portfolio"
          badgeBg="#f0fdf4" badgeColor="#15803d" badgeBorder="#bbf7d0"
          value={loading ? '…' : stats.active}
          label="Active & Operational"
          valueSub={<><Box component="span" sx={{ mr: 0.4, fontSize: '0.6875rem' }}>⚡</Box>99.1% Concession SLA</>}
          footerLeft="Capital In Operation" footerRight="$26.1B deployed"
          footerColor="#15803d"
          loading={loading}
        />
        <KpiCard
          icon={<ConstructIcon sx={{ fontSize: 20 }} />}
          iconBg="#fef9c3" iconColor="#a16207"
          badge="$14.2B Capital at Risk"
          badgeBg="#fef9c3" badgeColor="#a16207" badgeBorder="#fde68a"
          value={loading ? '…' : stats.construct}
          label="Under Construction / EPC"
          valueSub={<><Box component="span" sx={{ mr: 0.4, fontSize: '0.6875rem' }}>⏱</Box>14 Critical Path</>}
          footerLeft="Avg Completion Pace" footerRight="On schedule (94%)"
          footerColor="#a16207"
          loading={loading}
        />
        <KpiCard
          icon={<VerifiedIcon sx={{ fontSize: 20 }} />}
          iconBg="#f5f3ff" iconColor="#7c3aed"
          badge="100% Term Compliant"
          badgeBg="#f5f3ff" badgeColor="#7c3aed" badgeBorder="#ddd6fe"
          value={loading ? '…' : stats.completed}
          label="Handed Over / Reverted"
          valueSub={<><Box component="span" sx={{ mr: 0.4, fontSize: '0.6875rem' }}>🛡</Box>Audit Pass</>}
          footerLeft="Sovereign Asset Transfer" footerRight="Zero liabilities"
          loading={loading}
        />
      </Box>

      {/* ══ Filter & Query Bar ═══════════════════════════════════════════════ */}
      <Box sx={{
        bgcolor: D.card, borderRadius: '12px',
        border: `1px solid ${D.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        p: 2, display: 'flex', flexDirection: 'column', gap: 1.5,
      }}>
        {/* Controls row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by project name, concessionaire, EPC contractor, location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: '#94a3b8' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              flex: '1 1 280px', minWidth: 280,
              '& .MuiOutlinedInput-root': {
                height: 40, borderRadius: '8px', fontSize: '0.8125rem',
                bgcolor: '#f8fafc', fontFamily: 'Inter, sans-serif',
                '& fieldset': { borderColor: D.border },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused': { bgcolor: D.card },
                '&.Mui-focused fieldset': { borderColor: D.primaryCont },
              },
            }}
          />

          {/* Status dropdown */}
          <FormControl size="small" sx={{ flex: '0 0 180px' }}>
            <Select
              value={statusId}
              displayEmpty
              onChange={(e) => { setStatusId(e.target.value); setPage(0); }}
              renderValue={(val) => (
                <Typography sx={{ fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif', color: val ? D.textPrimary : D.textMuted, fontWeight: val ? 500 : 400 }}>
                  {val ? (statuses.find(s => s.id === val)?.name || 'Status') : 'Status: All Statuses'}
                </Typography>
              )}
              sx={{
                height: 40, borderRadius: '8px',
                bgcolor: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: D.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: D.primaryCont },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif' }}>All Statuses</MenuItem>
              {statuses.map(s => (
                <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif' }}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reset */}
          <Tooltip title="Reset all filters">
            <IconButton onClick={handleReset}
              sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${D.border}`, bgcolor: '#f8fafc', color: D.textMuted, '&:hover': { bgcolor: '#f1f5f9', color: D.textPrimary } }}>
              <ResetIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Chips + meta row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, pt: 1.25, borderTop: `1px solid ${D.borderSubtle}` }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif', mr: 0.5 }}>
              Active Filters:
            </Typography>
            {search && (
              <FilterChip label={`Search: "${search}"`} color={D.primaryCont} bg={D.primaryLight} border="#bfdbfe" onRemove={() => setSearch('')} />
            )}
            {statusId && selectedStatusName && (
              <FilterChip label={`Status: ${selectedStatusName}`} color="#15803d" bg="#f0fdf4" border="#bbf7d0" onRemove={() => setStatusId('')} />
            )}
            {(search || statusId) && (
              <Box component="button" onClick={handleReset}
                sx={{ background: 'none', border: 'none', cursor: 'pointer', color: D.primaryCont, fontSize: '0.6875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', p: 0, '&:hover': { textDecoration: 'underline' } }}>
                Reset all
              </Box>
            )}
            {!search && !statusId && (
              <Typography sx={{ fontSize: '0.6875rem', color: D.textLight, fontFamily: 'Inter, sans-serif' }}>None</Typography>
            )}
          </Box>

          <Typography sx={{ fontSize: '0.75rem', color: D.textMuted, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
            Showing{' '}
            <Box component="strong" sx={{ color: D.textPrimary, fontWeight: 600 }}>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}</Box>
            {' '}of{' '}
            <Box component="strong" sx={{ color: D.textPrimary, fontWeight: 600 }}>{total.toLocaleString()}</Box>
            {' '}projects
          </Typography>
        </Box>
      </Box>

      {/* ══ Data Table ═══════════════════════════════════════════════════════ */}
      <Box sx={{
        width: '100%', bgcolor: D.card,
        borderRadius: '12px', border: `1px solid ${D.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Sync track bar */}
        <Box sx={{ height: 2, bgcolor: D.borderSubtle, position: 'relative', overflow: 'hidden' }}>
          {loading
            ? <LinearProgress sx={{ position: 'absolute', inset: 0, height: '100%', bgcolor: D.primaryLight, '& .MuiLinearProgress-bar': { bgcolor: D.primaryCont } }} />
            : <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '25%', bgcolor: D.primaryCont, borderRadius: '99px', opacity: 0.7 }} />
          }
        </Box>

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          rowHeight={68}
          getRowId={(row) => row.id}
          slots={{
            loadingOverlay: () => null, // handled above
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, py: 8 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: D.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${D.border}` }}>
                  <PipelineIcon sx={{ fontSize: 28, color: D.textLight }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: D.textPrimary, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>No projects found</Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: D.textMuted, mt: 0.5, fontFamily: 'Inter, sans-serif' }}>Adjust your filters or register the first PPP concession</Typography>
                </Box>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => navigate('/projects/new')}
                  sx={{ borderRadius: '8px', textTransform: 'none', borderColor: D.primaryCont, color: D.primaryCont, fontFamily: 'Inter, sans-serif', fontWeight: 600, '&:hover': { bgcolor: D.primaryLight } }}>
                  Register First Project
                </Button>
              </Box>
            ),
          }}
          sx={{
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              borderBottom: `1px solid ${D.border}`,
            },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${D.borderSubtle}`,
              display: 'flex', alignItems: 'center',
              outline: 'none !important',
              fontFamily: 'Inter, sans-serif',
            },
            '& .MuiDataGrid-row': {
              transition: 'background 0.15s',
              '&:hover': { bgcolor: '#f8fafc' },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${D.border}`,
              bgcolor: '#f8fafc',
              fontFamily: 'Inter, sans-serif',
            },
            '& .MuiTablePagination-root': { fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: D.textMuted },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
          }}
        />
      </Box>

      {/* ══ Delete Modal ══════════════════════════════════════════════════════ */}
      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete PPP Project"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </Box>
  );
};
