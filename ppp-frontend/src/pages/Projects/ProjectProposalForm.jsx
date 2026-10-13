import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Autocomplete,
  InputAdornment,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Schedule as ScheduleIcon,
  LockOutlined as LockIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectCategoryService } from '../../services/projectServices/projectCategoryService';
import { proposalStatusService, currencyService } from '../../services/foundationService';
import { organizationService } from '../../services/organizationService';
import { fileService } from '../../services/fileService';

// ─── Theme Colors matching Stitch Apex PPP Design ────────────────────────────
const COLORS = {
  background: '#f8f9ff',
  surface: '#ffffff',
  surfaceLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceHigh: '#dce9ff',
  surfaceHighest: '#d3e4fe',
  primary: '#1c2ac8',
  primaryContainer: '#3b49df',
  primaryFixed: '#e0e0ff',
  onPrimaryFixedVariant: '#1d2cc9',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#454655',
  secondary: '#565e74',
  secondaryContainer: '#dae2fd',
  tertiary: '#004972',
  tertiaryFixed: '#cce5ff',
  onTertiaryFixedVariant: '#004b73',
  border: '#dce9ff',
  borderLight: '#e2e8f0',
  error: '#ba1a1a',
};

const STEPS = [
  { id: 'identity', stepNumber: 'Step 01', title: 'Core Details', subtitle: 'Developer, categories & workflow' },
  { id: 'financials', stepNumber: 'Step 02', title: 'Financials & Resources', subtitle: 'Capital, currency & land parcel' },
  { id: 'dossier', stepNumber: 'Step 03', title: 'Description & Documents', subtitle: 'Scope, remarks & attachments' },
];

// Shared input styling used across all form fields
const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 2,
    fontSize: '0.88rem',
  },
};

const NUMERIC_SX = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 2,
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ─── Presentational helpers shared across sections ──────────────────────────
const SectionHeader = ({ accent, title, meta }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pb: 2,
      mb: 2.5,
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box sx={{ width: 6, height: 20, borderRadius: 1, backgroundColor: accent }} />
      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.1rem' }}>
        {title}
      </Typography>
    </Box>
    <Typography
      variant="caption"
      sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.onSurfaceVariant, fontSize: '0.7rem' }}
    >
      {meta}
    </Typography>
  </Box>
);

const FieldLabel = ({ children, required, caption }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8, gap: 1 }}>
    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem' }}>
      {children} {required && <span style={{ color: COLORS.error }}>*</span>}
    </Typography>
    {caption && (
      <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontSize: '0.72rem' }}>
        {caption}
      </Typography>
    )}
  </Box>
);

export const ProjectProposalForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    proposedProjectName: '',
    organizationId: '',
    categoryIds: [],
    statusId: '',
    description: '',
    landRequested: '',
    proposedCapitalAmount: '',
    currencyId: '',
    remarks: '',
  });

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [orgs, cats, stats, currs] = await Promise.all([
          organizationService.getOrganizations({ limit: 100 }),
          projectCategoryService.getProjectCategories({ limit: 100, status: 'active' }),
          proposalStatusService.getProposalStatuses({ limit: 100, status: 'active' }),
          currencyService.getCurrencies({ limit: 100, status: 'active' }),
        ]);

        const loadedOrgs = orgs.organizations || orgs.rows || [];
        const loadedCats = cats.projectCategories || cats.rows || [];
        const loadedStatuses = stats.proposalStatuses || stats.rows || [];
        const loadedCurrs = currs.currencies || currs.rows || [];

        setOrganizations(loadedOrgs);
        setCategories(loadedCats);
        setStatuses(loadedStatuses);
        setCurrencies(loadedCurrs);

        const draftStatus = loadedStatuses.find(
          (s) => s.name.toLowerCase() === 'draft' || s.step === 0
        );
        if (draftStatus) {
          setFormData((prev) => ({ ...prev, statusId: draftStatus.id }));
        }
      } catch (err) {
        enqueueSnackbar('Failed to load form lookup data', { variant: 'error' });
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      enqueueSnackbar('Maximum 5 files allowed', { variant: 'warning' });
      return;
    }

    setUploading(true);
    try {
      const result = await fileService.uploadFiles(files);
      if (result.success) {
        setUploadedFiles((prev) => [...prev, ...result.data]);
        enqueueSnackbar(`${result.data.length} file(s) uploaded successfully`, { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(err.message || 'File upload failed', { variant: 'error' });
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  const handleRemoveFile = async (file) => {
    try {
      await fileService.deleteFile(file.filename);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
      enqueueSnackbar('File removed', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to remove file', { variant: 'error' });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.proposedProjectName.trim()) {
      setErrorMsg('Proposed Project Name is required.');
      return;
    }
    if (!formData.organizationId) {
      setErrorMsg('Please select a Developer Organization.');
      return;
    }
    if (!formData.statusId) {
      setErrorMsg('Please select a Proposal Status.');
      return;
    }

    setSaving(true);
    try {
      const hasOnLand = categories
        .filter((cat) => formData.categoryIds.includes(cat.id))
        .some((cat) => cat.is_onland === true);

      const payload = {
        ...formData,
        proposedCapitalAmount: formData.proposedCapitalAmount !== '' ? parseFloat(formData.proposedCapitalAmount) : null,
        landRequested: hasOnLand ? (formData.landRequested || null) : null,
        categoryIds: formData.categoryIds && formData.categoryIds.length > 0 ? formData.categoryIds : [],
        currencyId: formData.currencyId || null,
        attachedDocuments: uploadedFiles.length > 0 ? uploadedFiles : null,
      };

      await projectProposalService.createProposal(payload);
      enqueueSnackbar('Project proposal created successfully', { variant: 'success' });
      navigate('/projects/proposals');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create project proposal.');
    } finally {
      setSaving(false);
    }
  };

  // ── Real field-completion percentage ─────────────────────────────────────
  const progressPercent = useMemo(() => {
    const checks = [
      !!formData.proposedProjectName.trim(),
      !!formData.organizationId,
      formData.categoryIds.length > 0,
      !!formData.statusId,
      formData.proposedCapitalAmount !== '' && Number(formData.proposedCapitalAmount) > 0,
      !!formData.currencyId,
      !!formData.description.trim(),
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [formData]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const isAnyCategoryOnLand = categories
    .filter((cat) => formData.categoryIds.includes(cat.id))
    .some((cat) => cat.is_onland === true);

  if (loadingLookups) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', width: '100%' }}>
        <CircularProgress size={36} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        py: { xs: 2.5, md: 3.5 },
        boxSizing: 'border-box',
      }}
    >
      {/* ── TOP ACTION BAR & PAGE HEADER ── */}
      <Box sx={{ width: '100%', mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/projects/proposals')}
            sx={{
              color: COLORS.secondary,
              fontWeight: 600,
              fontSize: '0.8rem',
              p: 0,
              textTransform: 'none',
              '&:hover': { background: 'transparent', color: COLORS.onSurface },
            }}
          >
            Back to Proposals Registry
          </Button>

          {/* Status meta preview pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.5,
                py: 0.4,
                borderRadius: 5,
                backgroundColor: COLORS.secondaryContainer,
                color: COLORS.onSurface,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.secondary }} />
              Draft Mode
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1.5,
                py: 0.4,
                borderRadius: 5,
                backgroundColor: COLORS.surfaceHigh,
                color: COLORS.onSurfaceVariant,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <ScheduleIcon sx={{ fontSize: 14 }} />
              Active Workspace
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.4,
                borderRadius: 5,
                backgroundColor: COLORS.surfaceHighest,
                color: COLORS.primary,
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              REF: PROP-{new Date().getFullYear()}-NEW
            </Box>
          </Box>
        </Box>

        {/* Header row with title & meta chips */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', lg: 'center' },
            gap: 2,
            pt: 0.5,
          }}
        >
          <Box sx={{ maxWidth: 850 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: COLORS.onSurface,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.2,
              }}
            >
              Submit Project Proposal
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.9rem' }}>
              Capture the developer consortium, concession economics, and supporting dossier for a new PPP proposal.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<LockIcon sx={{ fontSize: '13px !important' }} />}
              label="Status: Draft (Auto)"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: COLORS.surfaceHighest,
                color: COLORS.primary,
                '& .MuiChip-icon': { color: COLORS.primary },
              }}
            />
            <Chip
              size="small"
              label={`${uploadedFiles.length} / 5 Documents Attached`}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: COLORS.secondaryContainer,
                color: COLORS.onSurface,
              }}
            />
          </Box>
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}
      {/* ── STEPPER NAVIGATION BAR (3 CARDS + LINEAR PROGRESS BAR) ── */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: 2,
          mb: 3,
          borderRadius: 3,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {STEPS.map((step, idx) => {
            const isCompleted = activeStep > idx;
            const isActive = activeStep === idx;

            return (
              <Box
                key={step.id}
                onClick={() => setActiveStep(idx)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.8,
                  p: 1.5,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive
                    ? COLORS.surfaceHigh
                    : isCompleted
                    ? COLORS.surfaceLow
                    : 'transparent',
                  border: isActive
                    ? `1.5px solid ${COLORS.primaryContainer}`
                    : '1.5px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive ? COLORS.surfaceHigh : COLORS.surfaceLow,
                  },
                }}
              >
                {/* Step Avatar Badge */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    backgroundColor: isActive
                      ? COLORS.primaryContainer
                      : isCompleted
                      ? COLORS.tertiaryFixed
                      : COLORS.surfaceHighest,
                    color: isActive ? '#ffffff' : isCompleted ? COLORS.tertiary : COLORS.onSurfaceVariant,
                  }}
                >
                  {isCompleted ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : `0${idx + 1}`}
                </Box>

                {/* Step Info */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isActive ? COLORS.primary : COLORS.secondary,
                    }}
                  >
                    {step.stepNumber} {isActive && '• Active'}
                  </Typography>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: isActive ? 700 : 600, fontSize: '0.86rem', color: COLORS.onSurface }}
                  >
                    {step.title}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ display: 'block', color: COLORS.onSurfaceVariant, fontSize: '0.72rem' }}>
                    {idx === 0 && `${formData.categoryIds.length} Category Tags Selected`}
                    {idx === 1 &&
                      (formData.proposedCapitalAmount
                        ? `${Number(formData.proposedCapitalAmount).toLocaleString()} ${
                            currencies.find((c) => String(c.id) === String(formData.currencyId))?.code || ''
                          }`
                        : 'Capital expenditure & land parcel')}
                    {idx === 2 && `${uploadedFiles.length} Documents Attached`}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Linear progress bar */}
        <Box sx={{ width: '100%', mt: 2, height: 4, borderRadius: 2, backgroundColor: COLORS.surfaceHighest, overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: COLORS.primary,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Paper>

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* ── SECTION 1: CORE DETAILS ── */}
          {(isMobile || activeStep === 0) && (
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
              }}
            >
              <SectionHeader accent={COLORS.primary} title="Core Details" meta="Section 1 of 3" />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                {/* Proposed Project Name */}
                <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                  <FieldLabel required>Proposed Project Name</FieldLabel>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    placeholder="e.g. Addis Light Rail Extension Phase II"
                    value={formData.proposedProjectName}
                    onChange={handleChange('proposedProjectName')}
                    sx={INPUT_SX}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    The working title used across review memos and approval packages.
                  </Typography>
                </Box>

                {/* Developer Organization */}
                <Box>
                  <FieldLabel required>Developer (Organization)</FieldLabel>
                  <TextField
                    required
                    select
                    fullWidth
                    size="small"
                    value={formData.organizationId}
                    onChange={handleChange('organizationId')}
                    sx={INPUT_SX}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select developer…
                    </MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Lead sponsor submitting this proposal for appraisal.
                  </Typography>
                </Box>
                {/* Proposal Workflow Status (locked) */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8, gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem' }}>
                      Proposal Workflow Status <span style={{ color: COLORS.error }}>*</span>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: COLORS.onSurfaceVariant, fontSize: '0.72rem', fontWeight: 600 }}>
                      <LockIcon sx={{ fontSize: 13 }} />
                      Locked
                    </Box>
                  </Box>
                  <TextField
                    required
                    select
                    fullWidth
                    size="small"
                    disabled
                    value={formData.statusId}
                    onChange={handleChange('statusId')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.88rem',
                        backgroundColor: COLORS.surfaceHighest,
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                      '& .MuiSelect-select': { fontWeight: 700, color: COLORS.primary },
                      '&.Mui-disabled .MuiSelect-select': { fontWeight: 700, color: COLORS.primary, WebkitTextFillColor: COLORS.primary },
                      '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                      '& .MuiSelect-icon': { color: COLORS.primary },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select status…
                    </MenuItem>
                    {statuses.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Auto-assigned to Draft; advanced by the approvals pipeline.
                  </Typography>
                </Box>

                {/* Project Categories */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <FieldLabel required caption={`${formData.categoryIds.length} selected`}>
                    Project Categories
                  </FieldLabel>
                  <Autocomplete
                    multiple
                    fullWidth
                    size="small"
                    options={categories}
                    getOptionLabel={(option) => option.name || ''}
                    value={categories.filter((cat) => formData.categoryIds.includes(cat.id))}
                    onChange={(e, newValue) => {
                      setFormData((prev) => ({ ...prev, categoryIds: newValue.map((cat) => cat.id) }));
                      if (errorMsg) setErrorMsg('');
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={option.name}
                          size="small"
                          sx={{
                            backgroundColor: COLORS.secondaryContainer,
                            color: COLORS.onSurface,
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            borderRadius: 5,
                            height: 24,
                          }}
                        />
                      ))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': { backgroundColor: COLORS.surfaceLow, borderRadius: 2, fontSize: '0.88rem' },
                    }}
                    renderInput={(params) => <TextField {...params} placeholder="Select one or more categories…" />}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Asset classes this proposal falls under; on-land categories unlock the land request field.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
          {/* ── SECTION 2: FINANCIALS & RESOURCES ── */}
          {(isMobile || activeStep === 1) && (
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
              }}
            >
              <SectionHeader accent={COLORS.tertiary} title="Financials & Resources" meta="Section 2 of 3" />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                {/* Capital amount + currency */}
                <Box>
                  <FieldLabel caption="Required for appraisal thresholds">Proposed Capital Amount</FieldLabel>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={formData.proposedCapitalAmount}
                      onChange={handleChange('proposedCapitalAmount')}
                      sx={NUMERIC_SX}
                      inputProps={{ min: 0, step: 'any' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={formData.currencyId}
                      onChange={handleChange('currencyId')}
                      sx={INPUT_SX}
                    >
                      <MenuItem value="" disabled>
                        Currency…
                      </MenuItem>
                      {currencies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.code ? `${c.name} (${c.code})` : c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Total investment value and its denomination for the feasibility review.
                  </Typography>
                </Box>

                {/* Land request */}
                <Box>
                  <FieldLabel caption={isAnyCategoryOnLand ? 'On-land category detected' : undefined}>
                    Land Requested (m²)
                  </FieldLabel>
                  {isAnyCategoryOnLand ? (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="e.g. 12500"
                        value={formData.landRequested}
                        onChange={handleChange('landRequested')}
                        sx={NUMERIC_SX}
                        inputProps={{ min: 0, step: 'any' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                        Total parcel area requested from the public land bank.
                      </Typography>
                    </>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.2,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: COLORS.surfaceLow,
                        border: `1px dashed ${COLORS.border}`,
                      }}
                    >
                      <InfoIcon sx={{ color: COLORS.secondary, fontSize: 18, mt: '2px' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.onSurface }}>
                          Not applicable yet
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontSize: '0.74rem' }}>
                          The land request field appears automatically when an on-land category is selected in Section 1.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          )}
          {/* ── SECTION 3: DESCRIPTION & DOCUMENTS ── */}
          {(isMobile || activeStep === 2) && (
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 3,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
              }}
            >
              <SectionHeader accent={COLORS.primaryContainer} title="Description & Documents" meta="Section 3 of 3" />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                {/* Description */}
                <Box>
                  <FieldLabel caption={`${formData.description.length} characters`}>Description / Scope</FieldLabel>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Describe the project scope, service delivery model, and expected public benefit…"
                    value={formData.description}
                    onChange={handleChange('description')}
                    sx={INPUT_SX}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Executive summary carried into the feasibility review memorandum.
                  </Typography>
                </Box>

                {/* Remarks */}
                <Box>
                  <FieldLabel caption="Optional">Internal Remarks</FieldLabel>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Reviewer notes, open questions, or coordination details…"
                    value={formData.remarks}
                    onChange={handleChange('remarks')}
                    sx={INPUT_SX}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.74rem' }}>
                    Visible to the review team only; never part of the public dossier.
                  </Typography>
                </Box>
              </Box>

              {/* Attached documents subheader */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 1,
                  pt: 2.5,
                  borderTop: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box sx={{ width: 6, height: 20, borderRadius: 1, backgroundColor: COLORS.secondary }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.05rem' }}>
                    Attached Documents
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${uploadedFiles.length} / 5 files`}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: COLORS.secondaryContainer,
                    color: COLORS.onSurface,
                  }}
                />
              </Box>

              {/* Upload dropzone */}
              <Box
                sx={{
                  mt: 2,
                  border: `1.5px dashed ${COLORS.border}`,
                  borderRadius: 2.5,
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: COLORS.surfaceLow,
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
                }}
              >
                <input
                  id="proposal-file-upload"
                  hidden
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                />
                <label htmlFor="proposal-file-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                    disabled={uploading || uploadedFiles.length >= 5}
                    sx={{
                      borderRadius: 2,
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                      fontWeight: 700,
                      textTransform: 'none',
                      mb: 1,
                      '&:hover': { backgroundColor: COLORS.primaryFixed, borderColor: COLORS.primary },
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Upload Files'}
                  </Button>
                </label>
                <Typography variant="caption" sx={{ display: 'block', color: COLORS.onSurfaceVariant, fontSize: '0.74rem' }}>
                  PDF, Word, Excel, PowerPoint, or images — max 5 files, 10MB each.
                </Typography>
              </Box>
              {/* Uploaded file list */}
              {uploadedFiles.length > 0 && (
                <List disablePadding sx={{ mt: 2 }}>
                  {uploadedFiles.map((file) => (
                    <ListItem
                      key={file.id}
                      sx={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 2,
                        mb: 1,
                        py: 0.5,
                        backgroundColor: COLORS.surface,
                        '&:hover': { backgroundColor: COLORS.surfaceLow },
                      }}
                      secondaryAction={
                        <Tooltip title="Remove file">
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFile(file)}
                            sx={{ color: COLORS.error, '&:hover': { backgroundColor: '#ffdad6' } }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 46 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 1.5,
                            backgroundColor: COLORS.secondaryContainer,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={file.originalName}
                        secondary={formatFileSize(file.size)}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: COLORS.onSurface,
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{ fontSize: '0.72rem', color: COLORS.onSurfaceVariant }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}
          {/* ── STICKY BOTTOM ACTION BAR ── */}
          <Paper
            elevation={3}
            sx={{
              position: 'sticky',
              bottom: 16,
              zIndex: 40,
              width: '100%',
              p: 2,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 10px 30px rgba(11, 28, 48, 0.1)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/projects/proposals')}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 0.7,
                  borderColor: COLORS.border,
                  color: COLORS.secondary,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: COLORS.secondary, backgroundColor: COLORS.surfaceLow },
                }}
              >
                Cancel
              </Button>

              <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 170 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: COLORS.onSurfaceVariant,
                    }}
                  >
                    Completion
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: COLORS.primary }}>
                    {progressPercent}%
                  </Typography>
                </Box>
                <Box sx={{ height: 5, borderRadius: 3, backgroundColor: COLORS.surfaceHighest, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: COLORS.primary,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end' } }}>
              {!isMobile && activeStep > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<PrevIcon />}
                  onClick={handleBack}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 0.7,
                    borderColor: COLORS.border,
                    color: COLORS.secondary,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { borderColor: COLORS.secondary, backgroundColor: COLORS.surfaceLow },
                  }}
                >
                  Back
                </Button>
              )}

              {!isMobile && activeStep < STEPS.length - 1 && (
                <Button
                  variant="contained"
                  endIcon={<NextIcon />}
                  onClick={handleNext}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 0.7,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: COLORS.primaryContainer,
                    boxShadow: '0 4px 12px rgba(59, 73, 223, 0.3)',
                    '&:hover': { backgroundColor: COLORS.primary },
                  }}
                >
                  Next Step
                </Button>
              )}

              {(isMobile || activeStep === STEPS.length - 1) && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 3.5,
                    py: 0.7,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: COLORS.primaryContainer,
                    boxShadow: '0 4px 12px rgba(59, 73, 223, 0.3)',
                    '&:hover': { backgroundColor: COLORS.primary },
                  }}
                >
                  {saving ? 'Creating…' : 'Create Proposal'}
                </Button>
              )}
            </Box>
          </Paper>
        </Stack>
      </form>
    </Box>
  );
};

export default ProjectProposalForm;










