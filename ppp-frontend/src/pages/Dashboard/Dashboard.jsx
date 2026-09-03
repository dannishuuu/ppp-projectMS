import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Apartment as BuildingIcon,
  MeetingRoom as UnitIcon,
  Key as RentedIcon,
  CheckCircle as AvailableIcon,
  Business as TypeIcon,
  Layers as FloorsIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Storefront as ShopIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { buildingsService } from '../../services/buildingServices/buildingsService';

// ── Helper ──────────────────────────────────────────────────────────────────
const extractArray = (res, key) => {
  if (!res) return [];
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (d?.[key] && Array.isArray(d[key])) return d[key];
  if (d?.rows && Array.isArray(d.rows)) return d.rows;
  return [];
};

// ── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon, gradient, iconBg, loading }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid rgba(255,255,255,0.15)',
      background: gradient,
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25)' },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 110,
        height: 110,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }}
    />
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.7rem',
              display: 'block',
            }}
          >
            {label}
          </Typography>
          {loading ? (
            <CircularProgress size={20} sx={{ color: '#fff', mt: 1 }} />
          ) : (
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.1,
                mt: 0.5,
                fontSize: { xs: '1.8rem', sm: '2.1rem' },
              }}
            >
              {value ?? 0}
            </Typography>
          )}
          {sub && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 500,
                fontSize: '0.72rem',
                mt: 0.5,
                display: 'block',
              }}
            >
              {sub}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            backgroundColor: iconBg || 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ── Type Breakdown Card ──────────────────────────────────────────────────────
const TypeBreakdownCard = ({ typeMap, total, loading }) => {
  const COLORS = [
    '#6366f1',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
  ];
  const entries = Object.entries(typeMap);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, backgroundColor: '#eef2ff' }}>
            <TypeIcon sx={{ fontSize: 20, color: '#6366f1' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
              Buildings by Building Type
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
              Distribution across registered property classifications
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#6366f1' }} />
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', textAlign: 'center', py: 4 }}>
            No buildings registered yet
          </Typography>
        ) : (
          <Stack spacing={1.75}>
            {entries.map(([type, count], idx) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const color = COLORS[idx % COLORS.length];
              return (
                <Box key={type}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.78rem' }}>
                      {type || 'Unspecified'}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.8rem' }}>
                        {count} {count === 1 ? 'Building' : 'Buildings'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        ({pct}%)
                      </Typography>
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3.5 },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// ── Rental Overview Card ──────────────────────────────────────────────────────
const RentalOverviewCard = ({ totalUnits, rented, available, notForRent, loading }) => {
  const rentedPct = totalUnits > 0 ? Math.round((rented / totalUnits) * 100) : 0;
  const availPct = totalUnits > 0 ? Math.round((available / totalUnits) * 100) : 0;
  const notForRentPct = totalUnits > 0 ? Math.max(0, 100 - rentedPct - availPct) : 0;

  const segments = [
    { label: 'Rented Shops / Spaces', value: rented, pct: rentedPct, color: '#8b5cf6', bg: '#f5f3ff', desc: 'Occupied by active tenants' },
    { label: 'Available (Unrented)', value: available, pct: availPct, color: '#10b981', bg: '#f0fdf4', desc: 'Open and available for rent' },
    { label: 'Not For Rent (Reserved/Service)', value: notForRent, pct: notForRentPct, color: '#64748b', bg: '#f8fafc', desc: 'Off-market / internal utility' },
  ];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, backgroundColor: '#f0fdf4' }}>
            <RentedIcon sx={{ fontSize: 20, color: '#10b981' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
              Shops & Spaces Rental Status
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
              {totalUnits} total spaces tracked across all buildings
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#10b981' }} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {segments.map((s) => (
              <Box key={s.label} sx={{ p: 1.75, borderRadius: 2, backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                      {s.desc}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: s.color, fontSize: '1.05rem' }}>
                      {s.value}
                    </Typography>
                    <Chip
                      label={`${s.pct}%`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: `${s.color}22`,
                        color: s.color,
                        '& .MuiChip-label': { px: 0.85 },
                      }}
                    />
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(s.pct, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: `${s.color}22`,
                    '& .MuiLinearProgress-bar': { backgroundColor: s.color, borderRadius: 3 },
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// ── Main Dashboard Component ─────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await buildingsService.getBuildings({ limit: 500, status: 'all' });
      setBuildings(extractArray(res, 'buildings'));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // ── Aggregated Statistics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBuildings = buildings.length;
    const activeBuildings = buildings.filter((b) => b.is_active).length;
    const totalFloors = buildings.reduce((acc, b) => acc + (b.floors_count || 0), 0);
    const totalUnits = buildings.reduce((acc, b) => acc + (b.units_count || 0), 0);
    const totalRented = buildings.reduce((acc, b) => acc + (b.rented_units_count || 0), 0);
    const totalAvailable = buildings.reduce((acc, b) => acc + (b.available_units_count || 0), 0);
    const notForRent = Math.max(0, totalUnits - totalRented - totalAvailable);

    // Distribution by building type
    const typeMap = {};
    buildings.forEach((b) => {
      const t = b.building_type_name || 'Unspecified';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });

    return {
      totalBuildings,
      activeBuildings,
      totalFloors,
      totalUnits,
      totalRented,
      totalAvailable,
      notForRent,
      typeMap,
    };
  }, [buildings]);

  // ── Filtered Buildings ─────────────────────────────────────────────────────
  const filteredBuildings = useMemo(() => {
    if (!search.trim()) return buildings;
    const q = search.toLowerCase();
    return buildings.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.building_type_name?.toLowerCase().includes(q) ||
        b.region_name?.toLowerCase().includes(q) ||
        b.woreda_name?.toLowerCase().includes(q)
    );
  }, [buildings, search]);

  // ── KPI Cards Setup ────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Buildings',
      value: stats.totalBuildings,
      sub: `${stats.activeBuildings} active • ${stats.totalBuildings - stats.activeBuildings} inactive`,
      icon: <BuildingIcon sx={{ fontSize: 24, color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)',
    },
    {
      label: 'Total Floors',
      value: stats.totalFloors,
      sub: 'Across all registered buildings',
      icon: <FloorsIcon sx={{ fontSize: 24, color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)',
    },
    {
      label: 'Total Shops & Units',
      value: stats.totalUnits,
      sub: 'Commercial, retail & offices',
      icon: <ShopIcon sx={{ fontSize: 24, color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
    },
    {
      label: 'Rented Shops',
      value: stats.totalRented,
      sub: stats.totalUnits > 0 ? `${Math.round((stats.totalRented / stats.totalUnits) * 100)}% occupancy rate` : '0% occupied',
      icon: <RentedIcon sx={{ fontSize: 24, color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)',
    },
    {
      label: 'Available (Unrented)',
      value: stats.totalAvailable,
      sub: 'Ready for lease / tenant',
      icon: <AvailableIcon sx={{ fontSize: 24, color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: '100%', boxSizing: 'border-box', pb: 4 }}>

      {/* ── Top Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, width: '100%' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
            Building Portfolio Dashboard
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.78rem' }}>
            Comprehensive analytics of buildings, building types, shop capacity, and occupancy status
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh Dashboard">
            <IconButton
              size="small"
              onClick={fetchBuildings}
              disabled={loading}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 0.75,
                color: '#64748b',
                backgroundColor: '#ffffff',
                '&:hover': { backgroundColor: '#f1f5f9' },
              }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<BuildingIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/buildings')}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}
          >
            Buildings Directory
          </Button>
        </Stack>
      </Box>

      {/* ── Summary KPI Cards (100% Full Width CSS Grid) ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
          width: '100%',
        }}
      >
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} loading={loading} />
        ))}
      </Box>

      {/* ── Breakdown & Charts Row (100% Full Width CSS Grid) ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 2,
          width: '100%',
        }}
      >
        {/* Buildings per Building Type */}
        <TypeBreakdownCard typeMap={stats.typeMap} total={stats.totalBuildings} loading={loading} />

        {/* Shops & Rental Overview */}
        <RentalOverviewCard
          totalUnits={stats.totalUnits}
          rented={stats.totalRented}
          available={stats.totalAvailable}
          notForRent={stats.notForRent}
          loading={loading}
        />
      </Box>

      {/* ── Buildings Registry Table (100% Full Width) ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px -2px rgba(0,0,0,0.04)',
          width: '100%',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          {/* Table Header Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Building Directory Overview
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Showing {filteredBuildings.length} of {buildings.length} registered buildings
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                size="small"
                placeholder="Search building, type, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: '100%', sm: 260 },
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
                onClick={() => navigate('/buildings')}
                sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.8rem', textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                Manage All
              </Button>
            </Stack>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2, width: '100%', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Building</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Location</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Floors</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Total Shops</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Rented</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Available</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', minWidth: 120 }}>Occupancy</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
                    </TableCell>
                  </TableRow>
                ) : filteredBuildings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <BuildingIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        {search ? `No buildings matching "${search}"` : 'No buildings registered yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuildings.map((b) => {
                    const units = b.units_count || 0;
                    const rented = b.rented_units_count || 0;
                    const avail = b.available_units_count || 0;
                    const occupancyPct = units > 0 ? Math.round((rented / units) * 100) : 0;
                    const occColor = occupancyPct >= 80 ? '#10b981' : occupancyPct >= 50 ? '#6366f1' : occupancyPct >= 25 ? '#f59e0b' : '#94a3b8';

                    return (
                      <TableRow
                        key={b.id}
                        sx={{
                          '&:last-child td': { border: 0 },
                          '&:hover': { backgroundColor: '#f8fafc' },
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/buildings/${b.id}`)}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                backgroundColor: '#eef2ff',
                                color: '#4f46e5',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {(b.name || '?')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                {b.name}
                              </Typography>
                              {b.year_built && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                                  Built {b.year_built}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={b.building_type_name || '—'}
                            size="small"
                            sx={{
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5',
                              fontWeight: 700,
                              fontSize: '0.67rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <LocationIcon sx={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {[b.woreda_name, b.zone_name, b.region_name].filter(Boolean).join(', ') || '—'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem' }}>
                            {b.floors_count || 0}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem' }}>
                            {units}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={rented}
                            size="small"
                            sx={{
                              backgroundColor: '#f5f3ff',
                              color: '#7c3aed',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 20,
                              borderRadius: '4px',
                              minWidth: 32,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={avail}
                            size="small"
                            sx={{
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 20,
                              borderRadius: '4px',
                              minWidth: 32,
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                {occupancyPct}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={occupancyPct}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': { backgroundColor: occColor, borderRadius: 3 },
                              }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={b.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              backgroundColor: b.is_active ? '#dcfce7' : '#fee2e2',
                              color: b.is_active ? '#15803d' : '#b91c1c',
                              fontWeight: 700,
                              fontSize: '0.67rem',
                              height: 20,
                              borderRadius: '4px',
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                            <Tooltip title="View Building Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/buildings/${b.id}`)}
                                sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Building">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/buildings/${b.id}/edit`)}
                                sx={{ color: '#64748b', p: 0.5, '&:hover': { color: '#0ea5e9', backgroundColor: '#e0f2fe' } }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
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