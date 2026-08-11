import React, { useState, useEffect } from 'react';
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
  Avatar,
  InputAdornment,
  LinearProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Apartment as HousingIcon,
  Business as CommercialIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useProjects } from '../../context/ProjectContext';
import { mockApi } from '../../services/mockApi';

// ─── Yup Validation Schema (unchanged) ──────────────────────────────────────
const schema = yup.object().shape({
  name: yup.string().required('Project Name is required').min(3, 'Minimum 3 characters'),
  type: yup.string().required('Project Type is required'),
  subCategory: yup.string().nullable(),
  developer: yup.string().required('Developer is required'),
  authority: yup.string().required('Contracting Authority is required'),
  address: yup.string().required('Address / Location is required'),
  subCity: yup.string().required('Sub-City is required'),
  woreda: yup.string().nullable(),
  siteArea: yup
    .number()
    .typeError('Site Area must be a number')
    .positive('Must be positive')
    .required('Site Area is required'),
  contractSigningDate: yup.string().required('Contract Signing Date is required'),
  projectStartDate: yup.string().required('Project Start Date is required'),
  projectEndDate: yup.string().required('Project End Date is required'),
  preliminaryBudget: yup
    .number()
    .typeError('Budget must be a number')
    .positive('Must be positive')
    .required('Preliminary Budget is required'),
  status: yup.string().required('Status is required'),
  completionPercentage: yup
    .number()
    .typeError('Completion % must be a number')
    .min(0, 'Min 0%')
    .max(100, 'Max 100%')
    .required('Completion Percentage is required'),
  description: yup.string().required('Description is required'),
  housingUnits: yup.number().when('type', {
    is: 'Housing',
    then: (s) => s.typeError('Must be a number').positive('Must be positive').required('Housing units required'),
    otherwise: (s) => s.nullable().transform(() => null),
  }),
  commercialSpaces: yup.number().when('type', {
    is: 'Non-Housing',
    then: (s) => s.typeError('Must be a number').positive('Must be positive').required('Commercial space required'),
    otherwise: (s) => s.nullable().transform(() => null),
  }),
  parkingCapacity: yup.number().when('type', {
    is: 'Non-Housing',
    then: (s) => s.typeError('Must be a number').positive('Must be positive').required('Parking capacity required'),
    otherwise: (s) => s.nullable().transform(() => null),
  }),
});

const SUB_CITIES = [
  'Addis Ketema',
  'Akaki Kality',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keraniyo',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
];

const STATUS_OPTIONS = ['Signed', 'Under Construction', 'Operational', 'Procurement', 'Feasibility'];

// ─── Section components (each renders a column) ────────────────────────────

const BasicInfoSection = ({ control, errors, watch }) => {
  const selectedType = watch('type');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
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
        Basic Identification
      </Typography>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Project Name *"
            placeholder="e.g. Kazanchis Financial Tower PPP"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
        )}
      />
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={Boolean(errors.type)}>
            <InputLabel>Project Type *</InputLabel>
            <Select {...field} label="Project Type *">
              <MenuItem value="Housing">Housing</MenuItem>
              <MenuItem value="Non-Housing">Non-Housing</MenuItem>
            </Select>
            <FormHelperText>{errors.type?.message}</FormHelperText>
          </FormControl>
        )}
      />
      <Controller
        name="subCategory"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Sub-Category"
            placeholder="e.g. Mixed-Income, Commercial Complex"
            error={Boolean(errors.subCategory)}
            helperText={errors.subCategory?.message}
          />
        )}
      />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={Boolean(errors.status)}>
            <InputLabel>Lifecycle Status *</InputLabel>
            <Select {...field} label="Lifecycle Status *">
              {STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.status?.message}</FormHelperText>
          </FormControl>
        )}
      />

      {/* Dynamic type-specific fields */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: selectedType === 'Housing' ? 'rgba(99, 102, 241, 0.04)' : 'rgba(6, 182, 212, 0.04)',
          border: `1px solid ${selectedType === 'Housing' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            display: 'block',
            mb: 1.5,
            color: selectedType === 'Housing' ? '#4f46e5' : '#0891b2',
          }}
        >
          {selectedType === 'Housing' ? <HousingIcon fontSize="small" sx={{ mr: 0.5 }} /> : <CommercialIcon fontSize="small" sx={{ mr: 0.5 }} />}
          {selectedType} Specifications
        </Typography>
        {selectedType === 'Housing' ? (
          <Controller
            name="housingUnits"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                fullWidth
                type="number"
                label="Housing Units Count *"
                placeholder="e.g. 4500"
                error={Boolean(errors.housingUnits)}
                helperText={errors.housingUnits?.message}
              />
            )}
          />
        ) : (
          <Stack spacing={2}>
            <Controller
              name="commercialSpaces"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  type="number"
                  label="Commercial Space (m²) *"
                  placeholder="e.g. 120000"
                  error={Boolean(errors.commercialSpaces)}
                  helperText={errors.commercialSpaces?.message}
                />
              )}
            />
            <Controller
              name="parkingCapacity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  type="number"
                  label="Parking Capacity *"
                  placeholder="e.g. 3500"
                  error={Boolean(errors.parkingCapacity)}
                  helperText={errors.parkingCapacity?.message}
                />
              )}
            />
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

const StakeholderSection = ({ control, errors }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
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
      Stakeholders & Location
    </Typography>
    <Controller
      name="developer"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label="Developer / Concessionaire *"
          placeholder="e.g. Midroc Investment Group"
          error={Boolean(errors.developer)}
          helperText={errors.developer?.message}
        />
      )}
    />
    <Controller
      name="authority"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label="Contracting Authority *"
          placeholder="e.g. Addis Ababa Housing Development Corporation"
          error={Boolean(errors.authority)}
          helperText={errors.authority?.message}
        />
      )}
    />
    <Controller
      name="address"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label="Address / Site Location *"
          placeholder="e.g. Churchill Avenue, Lideta District"
          error={Boolean(errors.address)}
          helperText={errors.address?.message}
        />
      )}
    />
    <Controller
      name="siteArea"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="number"
          label="Plot Site Area (m²) *"
          placeholder="e.g. 65000"
          error={Boolean(errors.siteArea)}
          helperText={errors.siteArea?.message}
        />
      )}
    />
    <Controller
      name="subCity"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={Boolean(errors.subCity)}>
          <InputLabel>Sub-City *</InputLabel>
          <Select {...field} label="Sub-City *">
            {SUB_CITIES.map((sc) => (
              <MenuItem key={sc} value={sc}>
                {sc}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.subCity?.message}</FormHelperText>
        </FormControl>
      )}
    />
    <Controller
      name="woreda"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          fullWidth
          label="Woreda"
          placeholder="e.g. 03"
          error={Boolean(errors.woreda)}
          helperText={errors.woreda?.message}
        />
      )}
    />
  </Box>
);

const BudgetScheduleSection = ({ control, errors }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
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
      Budget, Schedule & Metrics
    </Typography>
    <Controller
      name="preliminaryBudget"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="number"
          label="Preliminary Budget (ETB) *"
          placeholder="e.g. 45000000000"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                  ETB
                </Typography>
              </InputAdornment>
            ),
          }}
          error={Boolean(errors.preliminaryBudget)}
          helperText={errors.preliminaryBudget?.message}
        />
      )}
    />
    <Controller
      name="completionPercentage"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="number"
          label="Completion Progress *"
          placeholder="e.g. 45"
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          error={Boolean(errors.completionPercentage)}
          helperText={errors.completionPercentage?.message}
        />
      )}
    />
    <Controller
      name="contractSigningDate"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="date"
          label="Contract Signing Date *"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.contractSigningDate)}
          helperText={errors.contractSigningDate?.message}
        />
      )}
    />
    <Controller
      name="projectStartDate"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="date"
          label="Project Start Date *"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.projectStartDate)}
          helperText={errors.projectStartDate?.message}
        />
      )}
    />
    <Controller
      name="projectEndDate"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="date"
          label="Target Completion Date *"
          InputLabelProps={{ shrink: true }}
          error={Boolean(errors.projectEndDate)}
          helperText={errors.projectEndDate?.message}
        />
      )}
    />
    <Controller
      name="description"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          multiline
          rows={4}
          label="Project Overview & Scope *"
          placeholder="Provide a comprehensive breakdown of objectives, key operational targets..."
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
        />
      )}
    />
  </Box>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const ProjectForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addProject, updateProject } = useProjects();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: 'Housing',
      subCategory: '',
      developer: '',
      authority: '',
      address: '',
      subCity: 'Kirkos',
      woreda: '01',
      siteArea: 50000,
      contractSigningDate: new Date().toISOString().split('T')[0],
      projectStartDate: new Date().toISOString().split('T')[0],
      projectEndDate: '2028-12-31',
      preliminaryBudget: 50000000000,
      status: 'Signed',
      completionPercentage: 0,
      description: '',
      housingUnits: 5000,
      commercialSpaces: null,
      parkingCapacity: null,
    },
  });

  useEffect(() => {
    if (isEdit) {
      const loadProject = async () => {
        try {
          const data = await mockApi.getProjectById(id);
          reset(data);
        } catch {
          enqueueSnackbar(`Failed to load project ${id}`, { variant: 'error' });
          navigate('/projects');
        } finally {
          setLoading(false);
        }
      };
      loadProject();
    }
  }, [id, isEdit, reset, navigate, enqueueSnackbar]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateProject(id, data);
      } else {
        await addProject(data);
      }
      navigate('/projects');
    } catch {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={36} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/projects')}
            sx={{
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.8rem',
              mb: 0.5,
              p: 0,
              '&:hover': { background: 'transparent', color: '#0f172a' },
            }}
          >
            Back to Directory
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            {isEdit ? 'Edit PPP Concession Project' : 'Register New PPP Project'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '0.875rem' }}>
            Complete all sections below to register this infrastructure project.
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2.5,
            borderRadius: 3,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            minWidth: 200,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Form Completion
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>
                {isValid ? '100%' : 'Incomplete'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={isValid ? 100 : 60} // simplified; could be dynamic based on filled fields
              sx={{ height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', '& .MuiLinearProgress-bar': { backgroundColor: '#6366f1' } }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            p: { xs: 2.5, md: 4 },
          }}
        >
          {/* Three‑column grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 4,
              alignItems: 'stretch',
            }}
          >
            <Box>
              <BasicInfoSection control={control} errors={errors} watch={watch} />
            </Box>
            <Box>
              <StakeholderSection control={control} errors={errors} />
            </Box>
            <Box>
              <BudgetScheduleSection control={control} errors={errors} />
            </Box>
          </Box>

          {/* Action Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/projects')}
              disabled={submitting}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : isEdit ? <CheckCircleIcon /> : <SaveIcon />}
              sx={{
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3.5,
                py: 1.1,
                backgroundColor: '#6366f1',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                '&:hover': { backgroundColor: '#4f46e5', boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)' },
              }}
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Project' : 'Register Project'}
            </Button>
          </Box>
        </Paper>
      </form>
    </Box>
  );
};