import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, LinearProgress, Chip, Stack } from '@mui/material';
import {
  Assignment as TotalIcon,
  AttachMoney as BudgetIcon,
  HomeWork as HousingIcon,
  TrendingUp as TrendUpIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const SummaryCards = ({ projects = [] }) => {
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.preliminaryBudget || 0), 0);

  const housingProjects = projects.filter((p) => p.type === 'Housing');
  const nonHousingProjects = projects.filter((p) => p.type === 'Non-Housing');
  const housingUnitsTotal = housingProjects.reduce((acc, p) => acc + (p.housingUnits || 0), 0);

  const underConstCount = projects.filter((p) => p.status === 'Under Construction').length;
  const signedCount = projects.filter((p) => p.status === 'Signed').length;
  const operationalCount = projects.filter((p) => p.status === 'Operational').length;
  const pipelineCount = projects.filter((p) => p.status === 'Procurement' || p.status === 'Feasibility').length;

  const housingPct = totalProjects ? Math.round((housingProjects.length / totalProjects) * 100) : 0;
  const avgCompletion = totalProjects
    ? Math.round(projects.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / totalProjects)
    : 0;

  const cardData = [
    {
      title: 'Total Portfolio Budget',
      value: formatCurrency(totalBudget, true),
      subtext: `Full Valuation: ${formatCurrency(totalBudget)}`,
      badge: '+14.2% YoY Growth',
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      icon: <BudgetIcon sx={{ color: '#10b981', fontSize: 22 }} />,
      bg: 'rgba(16, 185, 129, 0.08)',
      borderColor: '#10b981',
    },
    {
      title: 'Active PPP Projects',
      value: formatNumber(totalProjects),
      subtext: `${underConstCount} Const. • ${signedCount} Signed`,
      badge: `${avgCompletion}% Avg Completion`,
      badgeColor: '#6366f1',
      badgeBg: 'rgba(99, 102, 241, 0.1)',
      icon: <TotalIcon sx={{ color: '#6366f1', fontSize: 22 }} />,
      bg: 'rgba(99, 102, 241, 0.08)',
      borderColor: '#6366f1',
    },
    {
      title: 'Housing Projects Share',
      value: `${housingProjects.length} Projects`,
      subtext: `${formatNumber(housingUnitsTotal)} Total Units`,
      badge: `${housingPct}% Housing Share`,
      badgeColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      icon: <HousingIcon sx={{ color: '#f59e0b', fontSize: 22 }} />,
      bg: 'rgba(245, 158, 11, 0.08)',
      borderColor: '#f59e0b',
      progress: housingPct,
    },
    {
      title: 'Operational & Completed',
      value: `${operationalCount} Projects`,
      subtext: `${pipelineCount} In Pipeline`,
      badge: '100% Operational',
      badgeColor: '#06b6d4',
      badgeBg: 'rgba(6, 182, 212, 0.1)',
      icon: <DoneIcon sx={{ color: '#06b6d4', fontSize: 22 }} />,
      bg: 'rgba(6, 182, 212, 0.08)',
      borderColor: '#06b6d4',
    },
  ];

  return (
    <Grid container spacing={2.5} justifyContent="center" alignItems="center">
      {cardData.map((card, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3.5,
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.08)',
                borderColor: card.borderColor,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: card.borderColor,
              },
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                '&:last-child': { pb: 2.5 },
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar sx={{ backgroundColor: card.bg, width: 48, height: 48, borderRadius: '12px', mb: 1.5 }}>
                {card.icon}
              </Avatar>

              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                {card.title}
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 1.5, color: '#0f172a', fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
                {card.value}
              </Typography>

              {card.progress !== undefined ? (
                <Box sx={{ width: '100%', mt: 0.5 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.725rem' }}>
                      Housing ({housingProjects.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.725rem' }}>
                      Non-Housing ({nonHousingProjects.length})
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={card.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: card.borderColor,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ) : (
                <Stack direction="column" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 0.5, width: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.subtext}
                  </Typography>
                  <Chip
                    label={card.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: card.badgeBg,
                      color: card.badgeColor,
                      border: `1px solid ${card.badgeBg}`,
                    }}
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};