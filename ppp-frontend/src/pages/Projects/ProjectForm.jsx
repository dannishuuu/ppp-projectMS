// pages/Projects/ProjectForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  Stack,
  InputAdornment,
  Chip,
  Autocomplete,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  AddCircleOutlined as AddIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  InfoOutlined as InfoIcon,
  Delete as DeleteIcon,
  Apartment as ApartmentIcon,
  AccountBalance as GovIcon,
  Schedule as ScheduleIcon,
  Layers as LayersIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { pppProjectService } from '../../services/projectServices/pppProjectService';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectCategoryService } from '../../services/projectServices/projectCategoryService';
import { projectStatusService } from '../../services/foundationService/projectStatusService';
import { currencyService } from '../../services/foundationService/currencyService';
import { organizationService } from '../../services/organizationService/organizationService';
import { organizationTypeService } from '../../services/organizationService/organizationTypeService';

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
  tertiaryContainer: '#006296',
  tertiaryFixed: '#cce5ff',
  onTertiaryFixedVariant: '#004b73',
  border: '#dce9ff',
  borderLight: '#e2e8f0',
  error: '#ba1a1a',
};

// ─── Validation schema ────────────────────────────────────────────────────────
const buildSchema = (mode) =>
  yup.object().shape({
    proposalId:
      mode === 'from_proposal'
        ? yup.string().required('Please select an approved proposal to convert')
        : yup.string().nullable(),

    name: yup.string().required('Project name is required').min(3, 'Minimum 3 characters'),
    description: yup.string().nullable(),
    address: yup.string().nullable(),

    siteAreaValue: yup
      .number()
      .nullable()
      .transform((v) => (isNaN(v) ? null : v))
      .positive('Must be positive'),

    siteAreaUnit: yup.string().nullable(),

    contractSigningDate: yup.string().required('Contract signing date is required'),

    estimatedBudgetAmount: yup
      .number()
      .nullable()
      .transform((v) => (isNaN(v) ? null : v))
      .positive('Must be positive'),

    estimatedBudgetCurrencyId: yup.string().nullable(),
    statusId: yup.string().required('Project status is required'),

    categoryIds: yup
      .array()
      .of(yup.string())
      .min(1, 'Select at least one project category'),

    organizations: yup
      .array()
      .of(
        yup.object().shape({
          organizationId: yup.string().required('Organization required'),
          organizationTypeId: yup.string().required('Role required'),
        })
      )
      .min(1, 'Add at least one participating organization'),

    managerUserIds: yup.array().of(yup.string()),
  });

const SITE_AREA_UNITS = ['Sqm', 'Hectares', 'Acres', 'Sqft'];
const STEPS = [
  { id: 'identity', stepNumber: 'Step 01', title: 'Project Identity', subtitle: 'Civic asset class verified' },
  { id: 'financials', stepNumber: 'Step 02', title: 'Financials & Site Allocation', subtitle: 'Capital & parcel footprint' },
  { id: 'consortium', stepNumber: 'Step 03', title: 'Consortium & Equity', subtitle: 'Stakeholders & equity allocation' },
];

export const ProjectForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Creation mode: 'standalone' | 'from_proposal'
  const [mode, setMode] = useState(searchParams.get('from') === 'proposal' ? 'from_proposal' : 'standalone');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Reference lookups
  const [proposals, setProposals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [orgOptions, setOrgOptions] = useState([]);
  const [orgTypeOptions, setOrgTypeOptions] = useState([]);

  const schema = buildSchema(mode);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      proposalId: '',
      name: '',
      description: '',
      address: '',
      siteAreaValue: null,
      siteAreaUnit: 'Sqm',
      contractSigningDate: new Date().toISOString().split('T')[0],
      estimatedBudgetAmount: null,
      estimatedBudgetCurrencyId: '',
      statusId: '',
      categoryIds: [],
      organizations: [],
      managerUserIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'organizations' });

  const watchedProposalId = watch('proposalId');
  const watchedBudget = watch('estimatedBudgetAmount');
  const watchedCurrencyId = watch('estimatedBudgetCurrencyId');
  const watchedArea = watch('siteAreaValue');
  const watchedAreaUnit = watch('siteAreaUnit');
  const selectedProposal = proposals?.find((p) => String(p.id) === String(watchedProposalId));
  const selectedCurrency = currencies?.find((c) => String(c.id) === String(watchedCurrencyId));

  // ── Load lookups ─────────────────────────────────────────────────────────────
  const loadLookups = useCallback(async () => {
    try {
      const [catRes, statusRes, currRes, orgRes, orgTypeRes] = await Promise.all([
        projectCategoryService.getProjectCategories({ limit: 100 }),
        projectStatusService.getProjectStatuses({ limit: 100 }),
        currencyService.getCurrencies({ limit: 100 }),
        organizationService.getOrganizations({ limit: 200 }),
        organizationTypeService.getOrganizationTypes({ limit: 100 }),
      ]);

      setCategories(
        catRes?.projectCategories ||
        catRes?.data?.projectCategories ||
        catRes?.categories ||
        catRes?.data?.categories ||
        (Array.isArray(catRes?.data) ? catRes.data : []) ||
        (Array.isArray(catRes) ? catRes : [])
      );
      setStatuses(
        statusRes?.projectStatuses ||
        statusRes?.data?.projectStatuses ||
        statusRes?.statuses ||
        statusRes?.data?.statuses ||
        (Array.isArray(statusRes?.data) ? statusRes.data : []) ||
        (Array.isArray(statusRes) ? statusRes : [])
      );
      setCurrencies(
        currRes?.currencies ||
        currRes?.data?.currencies ||
        (Array.isArray(currRes?.data) ? currRes.data : []) ||
        (Array.isArray(currRes) ? currRes : [])
      );
      setOrgOptions(
        orgRes?.organizations ||
        orgRes?.data?.organizations ||
        (Array.isArray(orgRes?.data) ? orgRes.data : []) ||
        (Array.isArray(orgRes) ? orgRes : [])
      );
      setOrgTypeOptions(
        orgTypeRes?.organizationTypes ||
        orgTypeRes?.data?.organizationTypes ||
        (Array.isArray(orgTypeRes?.data) ? orgTypeRes.data : []) ||
        (Array.isArray(orgTypeRes) ? orgTypeRes : [])
      );
    } catch (err) {
      console.error('Failed to load reference data:', err);
      enqueueSnackbar('Failed to load reference data', { variant: 'warning' });
    }
  }, [enqueueSnackbar]);

  // ── Load approved proposals (for "from_proposal" mode) ───────────────────────
  const loadApprovedProposals = useCallback(async () => {
    try {
      const res = await projectProposalService.getProposals({ limit: 200, search: '' });
      const all =
        res?.proposals ||
        res?.data?.proposals ||
        res?.rows ||
        res?.data?.rows ||
        (Array.isArray(res?.data) ? res.data : []) ||
        (Array.isArray(res) ? res : []);
      const list = Array.isArray(all) ? all : [];

      // Filter: status name is equal to Approve / Approved OR status step is equal to 3
      const isApprovedOrStep3 = (p) => {
        const sName = (p.status_name || p.status?.name || '').trim().toLowerCase();
        const sStep = Number(
          p.status_step != null ? p.status_step : (p.status?.step != null ? p.status?.step : p.step)
        );
        return sName === 'approve' || sName === 'approved' || sStep === 3;
      };

      const eligibleProposals = list.filter(isApprovedOrStep3);
      // Prefer proposals that have not yet been converted into an official project
      const unconverted = eligibleProposals.filter((p) => !p.converted_project_id);
      setProposals(unconverted.length > 0 ? unconverted : eligibleProposals);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      enqueueSnackbar('Failed to load proposals', { variant: 'warning' });
    }
  }, [enqueueSnackbar]);

  // ── Auto-fill from proposal ───────────────────────────────────────────────────
  useEffect(() => {
    if (!watchedProposalId) return;
    const proposal = proposals.find((p) => String(p.id) === String(watchedProposalId));
    if (!proposal) return;

    setValue('name', proposal.proposed_project_name || proposal.name || '');
    setValue('description', proposal.description || '');
    setValue(
      'estimatedBudgetAmount',
      proposal.proposed_capital_amount != null ? Number(proposal.proposed_capital_amount) : null
    );
    setValue('estimatedBudgetCurrencyId', proposal.currency_id || '');
    setValue(
      'siteAreaValue',
      proposal.land_requested != null && !isNaN(parseFloat(proposal.land_requested))
        ? parseFloat(proposal.land_requested)
        : null
    );

    const catIds = Array.isArray(proposal.categories)
      ? proposal.categories.map((c) => c.category_id || c.id).filter(Boolean)
      : [];
    if (catIds.length > 0) {
      setValue('categoryIds', catIds);
    }

    if (proposal.organization_id) {
      const devType = orgTypeOptions.find(
        (t) =>
          t.org_type_code === 'DEV' ||
          t.name?.toLowerCase().includes('developer') ||
          t.name?.toLowerCase().includes('contractor')
      );
      if (devType) {
        setValue('organizations', [
          { organizationId: proposal.organization_id, organizationTypeId: devType.id },
        ]);
      }
    }
  }, [watchedProposalId, proposals, orgTypeOptions, setValue]);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadLookups();
    loadApprovedProposals();
  }, [loadLookups, loadApprovedProposals]);

  // ── Load existing project for edit ──────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await pppProjectService.getProjectById(id);
        const p = res?.data || res;
        if (!p) throw new Error('Project not found');

        reset({
          proposalId: p.proposal_id || '',
          name: p.name || '',
          description: p.description || '',
          address: p.address || '',
          siteAreaValue: p.site_area_value ? parseFloat(p.site_area_value) : null,
          siteAreaUnit: p.site_area_unit || 'Sqm',
          contractSigningDate: p.contract_signing_date
            ? p.contract_signing_date.split('T')[0]
            : new Date().toISOString().split('T')[0],
          estimatedBudgetAmount: p.estimated_budget_amount ? parseFloat(p.estimated_budget_amount) : null,
          estimatedBudgetCurrencyId: p.estimated_budget_currency_id || '',
          statusId: p.status_id || '',
          categoryIds: (p.categories || []).map((c) => c.category_id || c.id),
          organizations: (p.organizations || []).map((o) => ({
            organizationId: o.organization_id || o.id,
            organizationTypeId: o.organization_type_id || '',
          })),
          managerUserIds: (p.managers || []).map((m) => m.user_id || m.id),
        });
      } catch (err) {
        enqueueSnackbar('Failed to load project details', { variant: 'error' });
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, reset, navigate, enqueueSnackbar]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        address: data.address || null,
        siteAreaValue: data.siteAreaValue || null,
        siteAreaUnit: data.siteAreaUnit || 'Sqm',
        contractSigningDate: data.contractSigningDate,
        estimatedBudgetAmount: data.estimatedBudgetAmount || null,
        estimatedBudgetCurrencyId: data.estimatedBudgetCurrencyId || null,
        statusId: data.statusId,
        categoryIds: data.categoryIds || [],
        organizations: data.organizations || [],
        managerUserIds: data.managerUserIds || [],
      };

      let res;
      if (isEdit) {
        res = await pppProjectService.updateProject(id, payload);
        enqueueSnackbar('Project updated successfully', { variant: 'success' });
      } else if (mode === 'from_proposal' && data.proposalId) {
        res = await pppProjectService.convertProposal(data.proposalId, payload);
        enqueueSnackbar('Proposal converted to official PPP Project!', { variant: 'success' });
      } else {
        res = await pppProjectService.createProject(payload);
        enqueueSnackbar('PPP Project registered successfully!', { variant: 'success' });
      }

      const projectId = res?.data?.id || res?.id;
      navigate(projectId ? `/projects/${projectId}` : '/projects');
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err.message || 'Failed to save project', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  // ── Real field-completion percentage ─────────────────────────────────────────
  const watchedName = watch('name');
  const watchedStatus = watch('statusId');
  const watchedCategories = watch('categoryIds');
  const watchedContract = watch('contractSigningDate');
  const watchedOrgs = watch('organizations');

  const progressPercent = React.useMemo(() => {
    // Step 1: name, statusId, categoryIds, contractSigningDate
    const step1Fields = [
      !!watchedName?.trim(),
      !!watchedStatus,
      Array.isArray(watchedCategories) && watchedCategories.length > 0,
      !!watchedContract,
    ];
    // Step 2: estimatedBudgetAmount (optional bonus), always at least partially complete
    const step2Fields = [
      watchedBudget != null && watchedBudget > 0,
      !!watchedArea && watchedArea > 0,
    ];
    // Step 3: organizations
    const step3Fields = [
      Array.isArray(watchedOrgs) && watchedOrgs.length > 0 &&
        watchedOrgs.every((o) => o.organizationId && o.organizationTypeId),
    ];

    const allFields = [...step1Fields, ...step2Fields, ...step3Fields];
    const filled = allFields.filter(Boolean).length;
    return Math.round((filled / allFields.length) * 100);
  }, [watchedName, watchedStatus, watchedCategories, watchedContract, watchedBudget, watchedArea, watchedOrgs]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 450, width: '100%' }}>
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
      {/* ── TOP ACTION BREADCRUMB & STATUS SECTION ── */}
      <Box sx={{ width: '100%', mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/projects')}
            sx={{
              color: COLORS.secondary,
              fontWeight: 600,
              fontSize: '0.8rem',
              p: 0,
              textTransform: 'none',
              '&:hover': { background: 'transparent', color: COLORS.onSurface },
            }}
          >
            Back to Projects Registry
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
              {isEdit ? 'Edit Mode' : 'Draft Mode'}
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
              REF: PPP-{new Date().getFullYear()}-{id ? id.substring(0, 6).toUpperCase() : 'NEW'}
            </Box>
          </Box>
        </Box>

        {/* Header row with Title & Segmented Source Toggle */}
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
              {isEdit ? 'Edit PPP Project' : 'Register PPP Project'}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.onSurfaceVariant, mt: 0.8, fontSize: '0.9rem' }}>
              Configure infrastructure parameters, capital expenditure models, and participating consortium stakeholders.
            </Typography>
          </Box>

          {/* Mode Toggle Segmented Pill */}
          {!isEdit && (
            <Paper
              elevation={0}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                p: '4px',
                borderRadius: 3,
                backgroundColor: COLORS.surfaceHigh,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  setMode('standalone');
                  setActiveStep(0);
                }}
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                sx={{
                  px: 2,
                  py: 0.7,
                  borderRadius: 2.2,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: mode === 'standalone' ? COLORS.primary : COLORS.onSurfaceVariant,
                  backgroundColor: mode === 'standalone' ? COLORS.surface : 'transparent',
                  boxShadow: mode === 'standalone' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  '&:hover': { backgroundColor: mode === 'standalone' ? COLORS.surface : 'rgba(255,255,255,0.4)' },
                }}
              >
                Standalone
              </Button>

              <Button
                size="small"
                onClick={() => {
                  setMode('from_proposal');
                  setActiveStep(0);
                  loadApprovedProposals();
                }}
                startIcon={<LinkIcon sx={{ fontSize: 16 }} />}
                sx={{
                  px: 2,
                  py: 0.7,
                  borderRadius: 2.2,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: mode === 'from_proposal' ? COLORS.primary : COLORS.onSurfaceVariant,
                  backgroundColor: mode === 'from_proposal' ? COLORS.surface : 'transparent',
                  boxShadow: mode === 'from_proposal' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  '&:hover': { backgroundColor: mode === 'from_proposal' ? COLORS.surface : 'rgba(255,255,255,0.4)' },
                }}
              >
                From Proposal
                {proposals.length > 0 && (
                  <Chip
                    size="small"
                    label={`${proposals.length} Available`}
                    sx={{
                      ml: 1,
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: COLORS.primaryFixed,
                      color: COLORS.onPrimaryFixedVariant,
                    }}
                  />
                )}
              </Button>
            </Paper>
          )}
        </Box>
      </Box>

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
        <Grid container spacing={2}>
          {STEPS.map((step, idx) => {
            const isCompleted = activeStep > idx;
            const isActive = activeStep === idx;

            return (
              <Grid item xs={12} md={4} key={step.id}>
                <Box
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
                      color: isActive
                        ? '#ffffff'
                        : isCompleted
                        ? COLORS.tertiary
                        : COLORS.onSurfaceVariant,
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
                      sx={{
                        fontWeight: isActive ? 700 : 600,
                        fontSize: '0.86rem',
                        color: COLORS.onSurface,
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: COLORS.onSurfaceVariant, fontSize: '0.72rem' }}
                    >
                      {idx === 0 && 'Civic asset class verified'}
                      {idx === 1 &&
                        (watchedBudget
                          ? `${Number(watchedBudget).toLocaleString()} ${selectedCurrency?.code || 'USD'} • ${watchedArea || 0} ${watchedAreaUnit || 'Sqm'}`
                          : 'Capital expenditure & parcel footprint')}
                      {idx === 2 && `${fields.length} Consortium Orgs Assigned`}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

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

      {/* ── FORM CANVAS (100% WIDTH) ── */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* ═══════════════════════════════════════════════════════════════════
              SOURCE APPROVED PROPOSAL BANNER (WHEN IN FROM_PROPOSAL MODE)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === 'from_proposal' && (
            <Paper
              elevation={0}
              sx={{
                width: '100%',
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                backgroundColor: COLORS.surfaceLow,
                border: `1px solid ${COLORS.border}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', lg: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', lg: 'center' },
                  gap: 2,
                  pb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      backgroundColor: COLORS.tertiaryFixed,
                      color: COLORS.tertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.05rem' }}>
                        Source Approved Proposal
                      </Typography>
                      <Chip
                        size="small"
                        label="Approved • Feasibility Passed"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: COLORS.tertiaryFixed,
                          color: COLORS.onTertiaryFixedVariant,
                        }}
                      />
                      <Chip
                        size="small"
                        icon={<InfoIcon sx={{ fontSize: '13px !important' }} />}
                        label="Auto-filled from Dossier"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          backgroundColor: COLORS.surface,
                          color: COLORS.primary,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, mt: 0.3, display: 'block' }}>
                      Concession attributes pulled dynamically from sovereign procurement intake record.
                    </Typography>
                  </Box>
                </Box>

                {/* Proposal Select Dropdown Input */}
                <Box sx={{ width: { xs: '100%', lg: 420 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      letterSpacing: '0.04em',
                      color: COLORS.onSurfaceVariant,
                      mb: 0.5,
                    }}
                  >
                    Attached Concession Proposal
                  </Typography>
                  <Controller
                    name="proposalId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={Boolean(errors.proposalId)}>
                        <Select
                          {...field}
                          displayEmpty
                          sx={{
                            backgroundColor: COLORS.surface,
                            borderRadius: 2,
                            fontSize: '0.84rem',
                            fontWeight: 500,
                          }}
                        >
                          <MenuItem disabled value="">
                            <em>Select an approved proposal…</em>
                          </MenuItem>
                          {proposals && proposals.length > 0 ? (
                            proposals.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                <Box sx={{ py: 0.3 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ color: COLORS.onSurface, fontSize: '0.84rem' }}>
                                    {p.prop_number ? `${p.prop_number} — ` : ''}
                                    {p.proposed_project_name || p.name || 'Untitled Proposal'}
                                  </Typography>
                                  {(p.organization_name || p.status_name) && (
                                    <Typography variant="caption" sx={{ color: COLORS.secondary }}>
                                      {[p.organization_name, p.status_name].filter(Boolean).join(' • ')}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled value="">
                              <em>No approved proposals (Status: Approve / Step 3) available</em>
                            </MenuItem>
                          )}
                        </Select>
                        <FormHelperText>{errors.proposalId?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>

              {/* Proposal Metadata Summary Grid (4 Columns) */}
              {selectedProposal && (
                <Grid
                  container
                  spacing={2}
                  sx={{
                    pt: 2,
                    mt: 1,
                    borderTop: `1px solid ${COLORS.border}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem' }}>
                      Lead Consortium
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, mt: 0.3 }} noWrap>
                      {selectedProposal.organization_name || 'Unassigned'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem' }}>
                      Proposed Capex
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary, fontFamily: 'monospace', mt: 0.3 }}>
                      {selectedProposal.proposed_capital_amount
                        ? `$${Number(selectedProposal.proposed_capital_amount).toLocaleString()} ${selectedProposal.currency_code || 'USD'}`
                        : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem' }}>
                      Concession Parcels
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, mt: 0.3 }} noWrap>
                      {selectedProposal.land_requested ? `${selectedProposal.land_requested} Sqm Core Ground` : 'Not specified'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem' }}>
                      Cabinet Sign-off / Intake
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, mt: 0.3 }} noWrap>
                      {selectedProposal.created_at ? new Date(selectedProposal.created_at).toLocaleDateString() : 'Gazetted'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1: GENERAL INFORMATION & IDENTITY
             ═══════════════════════════════════════════════════════════════════ */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, mb: 2.5, borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box sx={{ width: 6, height: 20, borderRadius: 1, backgroundColor: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.1rem' }}>
                    General Information & Identity
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.onSurfaceVariant, fontSize: '0.7rem' }}>
                  Section 1 of 3
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {/* Project Name */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem' }}>
                      Project Name <span style={{ color: COLORS.error }}>*</span>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.tertiary, fontSize: '0.72rem', fontWeight: 600 }}>
                      <CheckCircleIcon sx={{ fontSize: 14 }} /> Statutory Title Validated
                    </Box>
                  </Box>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        placeholder="e.g. Kazanchis Financial Tower PPP"
                        error={Boolean(errors.name)}
                        helperText={errors.name?.message || 'The gazetted institutional name used across legal gazettes and financing packages.'}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: COLORS.surfaceLow,
                            borderRadius: 2,
                            fontSize: '0.88rem',
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Lifecycle Status */}
                <Grid item xs={12} md={5}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem', mb: 0.8 }}>
                    Lifecycle Status <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <Controller
                    name="statusId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={Boolean(errors.statusId)}>
                        <Select
                          {...field}
                          displayEmpty
                          sx={{
                            backgroundColor: COLORS.surfaceLow,
                            borderRadius: 2,
                            fontSize: '0.88rem',
                          }}
                        >
                          <MenuItem disabled value="">
                            <em>Select Project Status…</em>
                          </MenuItem>
                          {(statuses || []).map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {errors.statusId?.message || (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: COLORS.onSurfaceVariant }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.primary, display: 'inline-block' }} />
                              Stage gate requiring Ministry of Finance review
                            </span>
                          )}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Project Categories */}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem', mb: 0.8 }}>
                    Infrastructure Categories & Asset Class Tags <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={Boolean(errors.categoryIds)}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={categories || []}
                          getOptionLabel={(opt) => opt.name || ''}
                          value={(categories || []).filter((c) => (field.value || []).includes(c.id))}
                          onChange={(_, vals) => field.onChange(vals.map((v) => v.id))}
                          renderTags={(vals, getTagProps) =>
                            vals.map((opt, i) => (
                              <Chip
                                key={opt.id}
                                label={opt.name}
                                size="small"
                                {...getTagProps({ index: i })}
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
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder={field.value?.length ? '' : 'Select one or more civic infrastructure categories…'}
                              error={Boolean(errors.categoryIds)}
                              helperText={errors.categoryIds?.message || errors.categoryIds?.[0]?.message}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: COLORS.surfaceLow,
                                  borderRadius: 2,
                                  fontSize: '0.88rem',
                                },
                              }}
                            />
                          )}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Project Description */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem' }}>
                      Executive Concession Description & Public Utility Scope
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {(watch('description') || '').length} / 1000 CHARACTERS
                    </Typography>
                  </Box>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        value={field.value ?? ''}
                        fullWidth
                        multiline
                        rows={3.5}
                        placeholder="Comprehensive project scope, public utility objectives, capacity benchmarks, and concession framework…"
                        error={Boolean(errors.description)}
                        helperText={errors.description?.message}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: COLORS.surfaceLow,
                            borderRadius: 2,
                            fontSize: '0.88rem',
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: FINANCIAL DETAILS & SITE DIMENSIONS
             ═══════════════════════════════════════════════════════════════════ */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, mb: 2.5, borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Box sx={{ width: 6, height: 20, borderRadius: 1, backgroundColor: COLORS.tertiary }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.1rem' }}>
                    Financial Details & Site Dimensions
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: COLORS.onSurfaceVariant, fontSize: '0.7rem' }}>
                  Section 2 of 3
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {/* Estimated Budget with Currency selector */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem', mb: 0.8 }}>
                    Estimated Total Capex Budget <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Controller
                      name="estimatedBudgetAmount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          fullWidth
                          type="number"
                          placeholder="e.g. 480000000"
                          value={field.value ?? ''}
                          error={Boolean(errors.estimatedBudgetAmount)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: COLORS.surfaceLow,
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                            },
                          }}
                        />
                      )}
                    />

                    {/* Currency dropdown */}
                    <Box sx={{ width: 140, flexShrink: 0 }}>
                      <Controller
                        name="estimatedBudgetCurrencyId"
                        control={control}
                        render={({ field }) => (
                          <FormControl size="small" fullWidth error={Boolean(errors.estimatedBudgetCurrencyId)}>
                            <Select
                              {...field}
                              value={field.value ?? ''}
                              displayEmpty
                              sx={{
                                backgroundColor: COLORS.surfaceHigh,
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.84rem',
                              }}
                            >
                              <MenuItem value="">
                                <em>Currency</em>
                              </MenuItem>
                              {(currencies || []).map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                  {c.code} {c.symbol ? `(${c.symbol})` : ''}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.8 }}>
                    <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontSize: '0.72rem' }}>
                      Sovereign Risk Reserve: 8.5% allocated
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700, fontFamily: 'monospace', fontSize: '0.72rem' }}>
                      IRR Proj: 14.2%
                    </Typography>
                  </Box>
                  {errors.estimatedBudgetAmount && (
                    <Typography variant="caption" color="error">
                      {errors.estimatedBudgetAmount.message}
                    </Typography>
                  )}
                </Grid>

                {/* Contract Signing Date */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem', mb: 0.8 }}>
                    Target Contract Signing Date <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <Controller
                    name="contractSigningDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        fullWidth
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        error={Boolean(errors.contractSigningDate)}
                        helperText={errors.contractSigningDate?.message || 'Estimated financial close expected 90 calendar days post-execution.'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: COLORS.surfaceLow,
                            borderRadius: 2,
                            fontSize: '0.88rem',
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Site Address & Georeference parcel */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem' }}>
                      Site Address & Cadastral Registry Lot
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 14 }} /> Georeference Parcel
                    </Typography>
                  </Box>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        size="small"
                        value={field.value ?? ''}
                        fullWidth
                        placeholder="e.g. Bole Subcity, Woreda 03, Kazanchis Commercial Corridor, Addis Ababa"
                        error={Boolean(errors.address)}
                        helperText={errors.address?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: COLORS.surfaceLow,
                            borderRadius: 2,
                            fontSize: '0.88rem',
                          },
                        }}
                      />
                    )}
                  />

                  {/* Mini Spatial Data Banner */}
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor: COLORS.surfaceLow,
                      border: `1px solid ${COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1.5,
                          backgroundColor: COLORS.secondaryContainer,
                          color: COLORS.onSurface,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LayersIcon sx={{ fontSize: 16 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: COLORS.secondary, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          GIS Coordinates
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: COLORS.onSurface, fontWeight: 600 }}>
                          9.0182° N, 38.7758° E • Parcel ID: ETH-AA-03-9912
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      size="small"
                      label="Verified Parcel"
                      sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700, backgroundColor: COLORS.tertiaryFixed, color: COLORS.onTertiaryFixedVariant }}
                    />
                  </Box>
                </Grid>

                {/* Footprint Area & Unit */}
                <Grid item xs={12} md={5}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.85rem', mb: 0.8 }}>
                    Concession Footprint Area <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Controller
                      name="siteAreaValue"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          size="small"
                          fullWidth
                          type="number"
                          placeholder="e.g. 14250"
                          value={field.value ?? ''}
                          error={Boolean(errors.siteAreaValue)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: COLORS.surfaceLow,
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                            },
                          }}
                        />
                      )}
                    />

                    {/* Unit dropdown */}
                    <Box sx={{ width: 130, flexShrink: 0 }}>
                      <Controller
                        name="siteAreaUnit"
                        control={control}
                        render={({ field }) => (
                          <FormControl size="small" fullWidth>
                            <Select
                              {...field}
                              value={field.value ?? 'Sqm'}
                              sx={{
                                backgroundColor: COLORS.surfaceHigh,
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.84rem',
                              }}
                            >
                              {SITE_AREA_UNITS.map((u) => (
                                <MenuItem key={u} value={u}>
                                  {u}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, mt: 0.8, display: 'block', fontSize: '0.74rem' }}>
                    Equivalent to ~{watchedArea ? (parseFloat(watchedArea) * 0.0002471).toFixed(2) : '3.52'} Acres of designated commercial zone.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 3: PARTICIPATING ORGANIZATIONS & CONSORTIUM
             ═══════════════════════════════════════════════════════════════════ */}
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 1.5,
                  pb: 2,
                  mb: 2.5,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 20, borderRadius: 1, backgroundColor: COLORS.primaryContainer }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.onSurface, fontSize: '1.1rem' }}>
                        Participating Organizations & Consortium
                      </Typography>
                      <Chip
                        size="small"
                        label={`${fields.length} Assigned`}
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: COLORS.primaryFixed,
                          color: COLORS.onPrimaryFixedVariant,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontSize: '0.75rem' }}>
                      Institutional sponsors, grantor directorates, and syndicated debt underwriters.
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => append({ organizationId: '', organizationTypeId: '' })}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 0.6,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    backgroundColor: COLORS.surfaceHigh,
                    color: COLORS.primary,
                    '&:hover': { backgroundColor: COLORS.surfaceHighest },
                  }}
                >
                  Add Organization
                </Button>
              </Box>

              {errors.organizations && !Array.isArray(errors.organizations) && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  {errors.organizations.message}
                </Alert>
              )}

              {/* Cards Deck */}
              <Stack spacing={2}>
                {fields.map((f, idx) => {
                  const currentOrgId = watch(`organizations.${idx}.organizationId`);
                  const currentTypeId = watch(`organizations.${idx}.organizationTypeId`);
                  const orgObj = orgOptions.find((o) => String(o.id) === String(currentOrgId));
                  const typeObj = orgTypeOptions.find((t) => String(t.id) === String(currentTypeId));

                  const isLead = typeObj?.org_type_code === 'DEV' || typeObj?.name?.toLowerCase().includes('lead');
                  const isPublic = typeObj?.org_type_code === 'GOV' || typeObj?.name?.toLowerCase().includes('public') || typeObj?.name?.toLowerCase().includes('grantor');

                  return (
                    <Paper
                      key={f.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        backgroundColor: COLORS.surfaceLow,
                        border: `1px solid ${COLORS.border}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: COLORS.surfaceContainer,
                          borderColor: COLORS.primaryContainer,
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        {/* Stakeholder Icon */}
                        <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isLead
                                ? COLORS.primaryContainer
                                : isPublic
                                ? COLORS.tertiary
                                : COLORS.secondaryContainer,
                              color: isLead || isPublic ? '#ffffff' : COLORS.onSurface,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            }}
                          >
                            {isPublic ? (
                              <GovIcon sx={{ fontSize: 24 }} />
                            ) : isLead ? (
                              <ApartmentIcon sx={{ fontSize: 24 }} />
                            ) : (
                              <BusinessIcon sx={{ fontSize: 24 }} />
                            )}
                          </Box>
                        </Grid>

                        {/* Organization Select */}
                        <Grid item xs={12} sm={5.5}>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem', mb: 0.5, textTransform: 'uppercase' }}>
                            Organization #{idx + 1} <span style={{ color: COLORS.error }}>*</span>
                          </Typography>
                          <Controller
                            name={`organizations.${idx}.organizationId`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth size="small" error={Boolean(errors.organizations?.[idx]?.organizationId)}>
                                <Select
                                  {...field}
                                  displayEmpty
                                  sx={{
                                    backgroundColor: COLORS.surface,
                                    borderRadius: 2,
                                    fontSize: '0.86rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <MenuItem disabled value="">
                                    <em>Select Organization…</em>
                                  </MenuItem>
                                  {(orgOptions || []).map((o) => (
                                    <MenuItem key={o.id} value={o.id}>
                                      {o.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                                <FormHelperText>{errors.organizations?.[idx]?.organizationId?.message}</FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        {/* Role / Type Select */}
                        <Grid item xs={10} sm={4.5}>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: COLORS.secondary, fontSize: '0.68rem', mb: 0.5, textTransform: 'uppercase' }}>
                            Consortium Role / Type <span style={{ color: COLORS.error }}>*</span>
                          </Typography>
                          <Controller
                            name={`organizations.${idx}.organizationTypeId`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth size="small" error={Boolean(errors.organizations?.[idx]?.organizationTypeId)}>
                                <Select
                                  {...field}
                                  displayEmpty
                                  sx={{
                                    backgroundColor: COLORS.surface,
                                    borderRadius: 2,
                                    fontSize: '0.86rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  <MenuItem disabled value="">
                                    <em>Select Role…</em>
                                  </MenuItem>
                                  {(orgTypeOptions || []).map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                      {t.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                                <FormHelperText>{errors.organizations?.[idx]?.organizationTypeId?.message}</FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        {/* Delete Action */}
                        <Grid item xs={2} sm={1} sx={{ textAlign: 'right' }}>
                          <Tooltip title="Remove stakeholder">
                            <IconButton
                              size="small"
                              onClick={() => remove(idx)}
                              sx={{
                                color: COLORS.secondary,
                                '&:hover': { color: COLORS.error, backgroundColor: '#ffdad6' },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Grid>

                        {/* Sub-meta details strip if selected */}
                        {orgObj && (
                          <Grid item xs={12} sx={{ pt: '4px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pl: { sm: 7.5 } }}>
                              <Chip
                                size="small"
                                label={typeObj?.name || 'Stakeholder'}
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: COLORS.primaryFixed,
                                  color: COLORS.onPrimaryFixedVariant,
                                }}
                              />
                              {orgObj.email && (
                                <Typography variant="caption" sx={{ color: COLORS.tertiary, fontSize: '0.74rem' }}>
                                  ✉ {orgObj.email}
                                </Typography>
                              )}
                              {orgObj.country && (
                                <Typography variant="caption" sx={{ color: COLORS.onSurfaceVariant, fontSize: '0.74rem' }}>
                                  Jurisdiction: <b>{orgObj.country}</b>
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  );
                })}

                {/* Add Stakeholder Drop Area Button */}
                <Box
                  onClick={() => append({ organizationId: '', organizationTypeId: '' })}
                  sx={{
                    width: '100%',
                    py: 2.5,
                    px: 3,
                    borderRadius: 2.5,
                    border: `1.5px dashed ${COLORS.border}`,
                    backgroundColor: COLORS.surfaceLow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: COLORS.surfaceHigh,
                      borderColor: COLORS.primary,
                    },
                  }}
                >
                  <AddIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.onSurface, fontSize: '0.84rem' }}>
                    Assign Additional Stakeholder (Legal Advisor, EPC Subcontractor, Offtaker)
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STICKY BOTTOM ACTION BAR (FULL 100% WIDTH)
             ═══════════════════════════════════════════════════════════════════ */}
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
            {/* Left: Cancel + Step progress indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/projects')}
                disabled={submitting}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.8,
                  borderColor: COLORS.borderLight,
                  color: COLORS.onSurfaceVariant,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { backgroundColor: COLORS.surfaceHigh, borderColor: COLORS.border },
                }}
              >
                Cancel
              </Button>

              {/* Divider */}
              <Box sx={{ width: 1, height: 24, backgroundColor: COLORS.border, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />

              {/* Step dots + progress */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 0.5, minWidth: 180 }}>
                {/* Step dots row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {STEPS.map((step, idx) => (
                    <Box
                      key={step.id}
                      title={step.title}
                      onClick={() => setActiveStep(idx)}
                      sx={{
                        width: idx === activeStep ? 20 : 8,
                        height: 8,
                        borderRadius: 99,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor:
                          idx < activeStep
                            ? COLORS.primary
                            : idx === activeStep
                            ? COLORS.primaryContainer
                            : COLORS.border,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  <Typography
                    variant="caption"
                    sx={{ ml: 0.5, fontWeight: 600, color: COLORS.onSurface, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    Step {activeStep + 1} / {STEPS.length}
                  </Typography>
                </Box>

                {/* Real progress bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: COLORS.surfaceContainer, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryContainer})`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.72rem', fontWeight: 700, color: progressPercent === 100 ? '#2e7d32' : COLORS.onSurfaceVariant, whiteSpace: 'nowrap' }}
                  >
                    {progressPercent}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right navigation buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
              {!isMobile && activeStep > 0 && (
                <Button
                  size="small"
                  onClick={handleBack}
                  startIcon={<PrevIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.8,
                    color: COLORS.onSurface,
                    backgroundColor: COLORS.surfaceLow,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: COLORS.surfaceHigh },
                  }}
                >
                  Previous Step
                </Button>
              )}

              {!isMobile && activeStep < STEPS.length - 1 ? (
                <Button
                  size="small"
                  onClick={handleNext}
                  endIcon={<NextIcon sx={{ fontSize: 16 }} />}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 0.85,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: COLORS.primary,
                    boxShadow: '0 3px 12px rgba(28, 42, 200, 0.25)',
                    '&:hover': { backgroundColor: COLORS.primaryContainer },
                  }}
                >
                  Next: {STEPS[activeStep + 1].title}
                </Button>
              ) : (
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : isEdit ? (
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <SaveIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    px: 3.5,
                    py: 0.85,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: mode === 'from_proposal' ? COLORS.primaryContainer : COLORS.primary,
                    boxShadow: '0 3px 12px rgba(28, 42, 200, 0.3)',
                    '&:hover': { backgroundColor: COLORS.primaryContainer },
                  }}
                >
                  {submitting
                    ? 'Saving…'
                    : isEdit
                    ? 'Update Project'
                    : mode === 'from_proposal'
                    ? 'Convert & Register Project'
                    : 'Register Project'}
                </Button>
              )}
            </Box>
          </Paper>
        </Stack>
      </form>
    </Box>
  );
};

export default ProjectForm;