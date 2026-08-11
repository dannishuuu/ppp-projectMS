import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Breadcrumbs,
  Link,
  Avatar,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Badge as LicenseIcon,
  WorkHistory as ExperienceIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationService } from '../../services/organizationService';
import { formatDate } from '../../utils/formatters';

export const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getOrganizationById(id);
      setOrg(data);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load organization details', { variant: 'error' });
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!org) return;
    setToggleLoading(true);
    try {
      const res = await organizationService.toggleOrganizationStatus(org.id);
      enqueueSnackbar(res.message, { variant: 'success' });
      fetchDetails();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to toggle status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  if (!org) return null;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/organizations" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Organizations
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {org.name}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Organization Details
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/organizations')}
            sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
          >
            Back to Directory
          </Button>

          <Button
            variant="outlined"
            color={org.is_active ? 'warning' : 'success'}
            startIcon={org.is_active ? <DeactivateIcon /> : <ActivateIcon />}
            onClick={handleToggleStatus}
            disabled={toggleLoading}
            sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.82rem' }}
          >
            {org.is_active ? 'Deactivate' : 'Activate'}
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/organizations/${org.id}/edit`)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              fontSize: '0.82rem',
            }}
          >
            Edit Organization
          </Button>
        </Box>
      </Box>

      {/* Hero Header Banner Card (Full Width) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          mb: 3,
          width: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: '#4f46e5',
              fontSize: '1.6rem',
              fontWeight: 800,
              boxShadow: '0 6px 14px rgba(79, 70, 229, 0.2)',
            }}
          >
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.4rem' }}>
                {org.name}
              </Typography>
              <Chip
                label={org.organization_type_name || 'Organization'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  border: '1px solid #c7d2fe',
                }}
              />
              <Chip
                label={org.is_active ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  backgroundColor: org.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: org.is_active ? '#059669' : '#dc2626',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', color: '#64748b', fontSize: '0.85rem' }}>
              {org.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    {org.phone}
                  </Typography>
                </Box>
              )}

              {org.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    {org.email}
                  </Typography>
                </Box>
              )}

              {org.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LocationIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    {org.address}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Details Paper with 3-Column Equal Grid matching CreateUser */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4, md: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 4,
            alignItems: 'stretch',
          }}
        >
          {/* Column 1: General & Legal Specifications */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                letterSpacing: '0.5px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              General & Legal Specs
            </Typography>
            <Divider sx={{ mb: 0.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Organization ID
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  {org.id}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Entity Type
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>
                  {org.organization_type_name || 'Unspecified'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Phone Contact
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.phone || '-'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Email Address
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.email || '-'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Office Address
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.address || '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Column 2: Licensing & Business Profile */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                letterSpacing: '0.5px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              Licensing & Business Data
            </Typography>
            <Divider sx={{ mb: 0.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Primary Business Sector
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>
                  {org.business_sector || '-'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Trade License / Reg Number
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.license_number || '-'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Years of Experience
                </Typography>
                <Typography variant="body2" sx={{ color: '#4f46e5', fontWeight: 700, fontSize: '0.85rem' }}>
                  {org.years_of_experience !== null && org.years_of_experience !== undefined ? `${org.years_of_experience} Years` : '-'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Legal Registration Date
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.registration_date ? formatDate(org.registration_date) : '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Column 3: Executive Bio & Past Projects */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                letterSpacing: '0.5px',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              Qualifications & Track Record
            </Typography>
            <Divider sx={{ mb: 0.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Executive Bio & Overview
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {org.bio || 'No bio submitted.'}
                </Typography>
              </Box>
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Past Projects Summary
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {org.past_projects_summary || 'No past projects documented.'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Full Width Section: Developer Profile & EV Experience Text (Amharic) */}
      {org.profile_experience && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            mb: 3,
            width: '100%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#1a237e',
              letterSpacing: '0.5px',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              mb: 1.5,
            }}
          >
            Developer Profile & Experience (የአልሚው ፕሮፋይልና ልምድ)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              lineHeight: 1.7,
              fontSize: '0.88rem',
              whiteSpace: 'pre-line',
            }}
          >
            {org.profile_experience}
          </Paper>
        </Paper>
      )}

      {/* Audit Metadata Footer Row */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          width: '100%',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}
        >
          Audit & Record Metadata
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created By</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{org.created_by_name || 'System Admin'}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Created At</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{formatDate(org.created_at)}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated By</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{org.updated_by_name || 'System Admin'}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Last Updated At</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>{formatDate(org.updated_at)}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default OrganizationDetails;
