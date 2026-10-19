import React, { useState, useEffect, useCallback } from 'react';
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
  Stack,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  HowToReg as VerifyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationService } from '../../services/organizationService';
import { formatDate } from '../../utils/formatters';

// License expiry status helper: Expired / Expiring soon (<=30d) / Valid
const getLicenseExpiryInfo = (expiry) => {
  if (!expiry) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, color: 'error', value: 'expired' };
  if (daysLeft <= 30) return { label: `Expiring in ${daysLeft}d`, color: 'warning', value: 'expiring' };
  return { label: 'Valid', color: 'success', value: 'valid' };
};

export const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  // ── Organization Documents ──
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    setDocsLoading(true);
    try {
      const res = await organizationService.getOrganizationDocuments(id);
      setDocuments(res.organizationDocuments || []);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load organization documents', { variant: 'error' });
    } finally {
      setDocsLoading(false);
    }
  }, [id, enqueueSnackbar]);

  useEffect(() => {
    if (!loading && org) {
      fetchDocuments();
    }
  }, [loading, org, fetchDocuments]);

  const [verifyDocTarget, setVerifyDocTarget] = useState(null);
  const [verifyAction, setVerifyAction] = useState('approved'); // 'approved' | 'rejected'
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySaving, setVerifySaving] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleVerifyDocSubmit = async (action) => {
    setVerifyAction(action); // 'approved' | 'rejected'
    if (action === 'rejected' && !verifyNotes.trim()) {
      setVerifyError('Verification notes are required when rejecting a document.');
      return;
    }
    setVerifySaving(true);
    setVerifyError('');
    try {
      await organizationService.verifyOrganizationDocument(id, verifyDocTarget.id, {
        status: action,
        notes: verifyNotes.trim() || null,
      });
      enqueueSnackbar(action === 'approved' ? 'Document verified successfully' : 'Document rejected', { variant: 'success' });
      setVerifyDocTarget(null);
      setVerifyNotes('');
      fetchDocuments();
    } catch (err) {
      setVerifyError(err.message || 'Failed to verify document');
    } finally {
      setVerifySaving(false);
    }
  };

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
              {Array.isArray(org.organization_types) && org.organization_types.length > 0 ? (
                org.organization_types.map((type) => (
                  <Chip
                    key={type.id || type.name}
                    label={type.name}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      backgroundColor: '#eef2ff',
                      color: '#4f46e5',
                      border: '1px solid #c7d2fe',
                    }}
                  />
                ))
              ) : (
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
              )}
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
              {(() => {
                const info = getLicenseExpiryInfo(org.license_expiry_date);
                if (!info) return null;
                const sx = {
                  expired: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
                  expiring: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' },
                  valid: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
                }[info.value];
                return <Chip label={`License: ${info.label}`} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', ...sx }} />;
              })()}
            </Box>

            {/* Display Amharic and Oromo names */}
            {(org.amharic_org_name || org.oromo_org_name) && (
              <Box sx={{ mb: 1 }}>
                {org.amharic_org_name && (
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                    {org.amharic_org_name}
                  </Typography>
                )}
                {org.oromo_org_name && (
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                    {org.oromo_org_name}
                  </Typography>
                )}
              </Box>
            )}

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

              {[org.region_name, org.zone_name, org.woreda_name].filter(Boolean).length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LocationIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    {[org.region_name, org.zone_name, org.woreda_name].filter(Boolean).join(', ')}
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
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  Entity Types
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Array.isArray(org.organization_types) && org.organization_types.length > 0 ? (
                    org.organization_types.map((type) => (
                      <Chip
                        key={type.id || type.name}
                        label={type.name}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          backgroundColor: '#eef2ff',
                          color: '#3730a3',
                          border: '1px solid #c7d2fe',
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>
                      {org.organization_type_name || 'Unspecified'}
                    </Typography>
                  )}
                </Box>
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
                  Location
                </Typography>
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>
                  {org.country_name || org.region_name
                    ? [org.country_name, org.region_name, org.zone_name, org.woreda_name].filter(Boolean).join(' • ')
                    : '-'}
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
                  {org.business_sector_name || '-'}
                </Typography>
                {org.business_sector_amh_name && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.72rem' }}>
                    {org.business_sector_amh_name}
                  </Typography>
                )}
                {org.business_sector_oro_name && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.72rem' }}>
                    {org.business_sector_oro_name}
                  </Typography>
                )}
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
              <Divider light />

              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  License Expiry Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: getLicenseExpiryInfo(org.license_expiry_date)?.value === 'expired' ? '#dc2626' : '#0f172a',
                    }}
                  >
                    {org.license_expiry_date ? formatDate(org.license_expiry_date) : '-'}
                  </Typography>
                  {(() => {
                    const info = getLicenseExpiryInfo(org.license_expiry_date);
                    if (!info) return null;
                    const sx = {
                      expired: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
                      expiring: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' },
                      valid: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
                    }[info.value];
                    return <Chip label={info.label} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ...sx }} />;
                  })()}
                </Box>
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

      {/* ── Supporting Documents ── */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: '#1a237e', letterSpacing: '0.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}
          >
            Supporting Documents
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {docsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={26} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : documents.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#94a3b8', py: 2 }}>
            No documents attached yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {documents.map((doc) => (
              <Box
                key={doc.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  '&:hover': { borderColor: '#c7d2fe', backgroundColor: '#f5f7ff' },
                }}
              >
                <Box sx={{ color: '#4f46e5', display: 'flex', '& svg': { fontSize: 20 } }}>
                  <DescriptionIcon />
                </Box>
                <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                    {doc.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                    {doc.document_type?.name}
                    {doc.document_number ? ` • ${doc.document_number}` : ''}
                    {` • ${doc.original_filename}`}
                  </Typography>
                </Box>
                <Chip
                  label={doc.document_type?.requires_expiry ? `Exp: ${doc.expiry_date ? formatDate(doc.expiry_date) : '—'}` : 'No expiry'}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.68rem', fontWeight: 600,
                    backgroundColor: doc.is_expired ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9',
                    color: doc.is_expired ? '#dc2626' : '#64748b',
                  }}
                />
                <Chip
                  label={
                    doc.is_verified
                      ? 'Verified'
                      : doc.verified_at
                        ? 'Rejected'
                        : 'Not Verified'
                  }
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.68rem', fontWeight: 600,
                    backgroundColor: doc.is_verified
                      ? 'rgba(16, 185, 129, 0.1)'
                      : doc.verified_at
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                    color: doc.is_verified
                      ? '#059669'
                      : doc.verified_at
                        ? '#dc2626'
                        : '#b45309',
                  }}
                />
                <Button
                  size="small"
                  variant="text"
                  href={`http://localhost:5000/${doc.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#0284c7' }}
                >
                  Open
                </Button>
                {!doc.is_verified && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<VerifyIcon sx={{ fontSize: 15 }} />}
                    onClick={() => {
                      setVerifyDocTarget(doc);
                      setVerifyAction('approved');
                      setVerifyNotes('');
                      setVerifyError('');
                    }}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderColor: '#a7f3d0', color: '#059669', backgroundColor: '#ecfdf5', '&:hover': { backgroundColor: '#d1fae5', borderColor: '#059669' } }}
                  >
                    Verify Document
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        )}
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

      {/* Verify Document Modal (approve / reject with mandatory notes on reject) */}
      <Dialog
        open={Boolean(verifyDocTarget)}
        onClose={() => { setVerifyDocTarget(null); setVerifyError(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>Verify Document</DialogTitle>
        <Divider />
        <DialogContent>
          {verifyError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1.5, borderRadius: 2 }}>
              {verifyError}
            </Alert>
          )}
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
              Decide on{' '}
              <Box component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {verifyDocTarget?.title}
              </Box>
              : approve it as valid, or reject it — rejection requires mandatory notes.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label={verifyAction === 'rejected' ? 'Verification Notes (Required)' : 'Verification Notes'}
              required={verifyAction === 'rejected'}
              placeholder={verifyAction === 'rejected' ? 'Reason for rejecting this document…' : 'Optional remarks…'}
              value={verifyNotes}
              onChange={(e) => {
                setVerifyNotes(e.target.value);
                if (verifyError) setVerifyError('');
              }}
              disabled={verifySaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => { setVerifyDocTarget(null); setVerifyError(''); setVerifyNotes(''); }}
            disabled={verifySaving}
            sx={{ borderRadius: 2, fontWeight: 600, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleVerifyDocSubmit('rejected')}
            disabled={verifySaving}
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 90 }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleVerifyDocSubmit('approved')}
            disabled={verifySaving}
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 110 }}
          >
            {verifySaving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationDetails;
