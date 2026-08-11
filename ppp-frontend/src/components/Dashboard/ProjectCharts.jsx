import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Stack, Chip } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, getStatusColor } from '../../utils/formatters';

const PIE_COLORS = ['#6366f1', '#06b6d4'];

export const ProjectCharts = ({ projects = [] }) => {
  // Chart 1: Project Type Ratio
  const housingCount = projects.filter((p) => p.type === 'Housing').length;
  const nonHousingCount = projects.filter((p) => p.type === 'Non-Housing').length;

  const pieData = [
    { name: 'Housing Projects', value: housingCount },
    { name: 'Non-Housing Projects', value: nonHousingCount },
  ];

  // Chart 2: Top 5 Projects by Budget Allocation
  const top5Projects = [...projects]
    .sort((a, b) => (b.preliminaryBudget || 0) - (a.preliminaryBudget || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 25 ? `${p.name.substring(0, 23)}...` : p.name,
      fullName: p.name,
      budgetBillions: Number(((p.preliminaryBudget || 0) / 1000000000).toFixed(2)),
      code: p.code,
      status: p.status,
    }));

  // Chart 3: Stage Breakdown Analytics (5 stages)
  const statuses = ['Under Construction', 'Operational', 'Signed', 'Procurement', 'Feasibility'];
  const statusCounts = statuses.map((st) => {
    const count = projects.filter((p) => p.status === st).length;
    const totalBudget = projects
      .filter((p) => p.status === st)
      .reduce((acc, p) => acc + (p.preliminaryBudget || 0), 0);
    return {
      status: st,
      count,
      pct: projects.length ? Math.round((count / projects.length) * 100) : 0,
      budgetB: Number((totalBudget / 1000000000).toFixed(1)),
    };
  });

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = projects.length ? Math.round((data.value / projects.length) * 100) : 0;
      return (
        <Box
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            p: 1.5,
            borderRadius: 2,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Count: <strong>{data.value} Projects</strong> ({pct}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            p: 1.5,
            borderRadius: 2,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            maxWidth: 280,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
            {data.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            Code: <strong>{data.code}</strong> • Status: <strong>{data.status}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: '#6366f1' }}>
            Budget Allocation: ETB {data.budgetBillions} Billion
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={2.5}>
      {/* Chart 1: Donut Ratio */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
              Project Ratio
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Housing ({housingCount}) vs Non-Housing ({nonHousingCount})
            </Typography>

            <Box sx={{ width: '100%', height: 230, position: 'relative', mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {projects.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                  Total Projects
                </Typography>
              </Box>
            </Box>

            {/* Custom Legend */}
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS[0] }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>Housing</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS[1] }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>Non-Housing</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Chart 2: Top 5 Concessions (Horizontal Bar Layout for readability) */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: '100%', borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                  Top 5 Capital Allocations
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Largest infrastructural investments
                </Typography>
              </Box>
              <Chip label="Billions (ETB)" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569' }} />
            </Box>

            <Box sx={{ width: '100%', height: 240, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Projects} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}B`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={140} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="budgetBillions" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Chart 3: Single-Row Lifecycle Stage Cards (All 5 in one row) */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
              Lifecycle Status Analytics
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
              Project stage breakdown across the 5 lifecycle phases
            </Typography>

            <Grid container spacing={2}>
              {statusCounts.map((sc) => {
                const info = getStatusColor(sc.status);
                return (
                  <Grid item xs={12} sm={6} md={2.4} key={sc.status}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${info.text}`,
                        height: '100%',
                        transition: 'transform 0.15s ease',
                        '&:hover': { transform: 'translateY(-2px)' },
                      }}
                    >
                      <Chip
                        label={info.label}
                        size="small"
                        sx={{
                          backgroundColor: info.bg,
                          color: info.text,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                          mb: 1,
                        }}
                      />
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.5rem' }}>
                        {sc.count}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mt: 0.5 }}>
                        {sc.pct}% of total ({sc.budgetB}B ETB)
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};