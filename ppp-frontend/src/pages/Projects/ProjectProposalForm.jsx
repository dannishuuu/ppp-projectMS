import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider,
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { projectProposalService } from '../../services/projectServices/projectProposalService';
import { projectCategoryService } from '../../services/projectServices/projectCategoryService';
import { proposalStatusService, currencyService } from '../../services/foundationService';
import { organizationService } from '../../services/organizationService';
import { fileService } from '../../services/fileService';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ProjectProposalForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const payload = {
        ...formData,
        proposedCapitalAmount: formData.proposedCapitalAmount !== '' ? parseFloat(formData.proposedCapitalAmount) : null,
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

  if (loadingLookups) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/projects/proposals" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Proposals
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              New Proposal
            </Typography>
          </Breadcrumbs>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Submit Project Proposal
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects/proposals')}
          sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}
        >
          Back to List
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4, md: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 4,
              alignItems: 'stretch',
            }}
          >
            {/* Column 1: Core Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Core Details
              </Typography>
              <Divider />

              <TextField
                required
                fullWidth
                label="Proposed Project Name"
                placeholder="e.g. EV Charging Station Expansion Addis"
                value={formData.proposedProjectName}
                onChange={handleChange('proposedProjectName')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                select
                fullWidth
                label="Developer (Organization)"
                value={formData.organizationId}
                onChange={handleChange('organizationId')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Developer</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                ))}
              </TextField>

              <Autocomplete
                multiple
                fullWidth
                options={categories}
                getOptionLabel={(option) => option.name || ''}
                value={categories.filter((cat) => formData.categoryIds.includes(cat.id))}
                onChange={(e, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    categoryIds: newValue.map((cat) => cat.id),
                  }));
                  if (errorMsg) setErrorMsg('');
                }}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project Categories"
                    placeholder="Select one or more categories"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                      sx={{
                        backgroundColor: '#e0e7ff',
                        color: '#4f46e5',
                        fontWeight: 500,
                        '& .MuiChip-deleteIcon': { color: '#4f46e5' },
                      }}
                    />
                  ))
                }
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                required
                select
                fullWidth
                label="Proposal Workflow Status"
                value={formData.statusId}
                onChange={handleChange('statusId')}
                size="small"
                disabled
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="" disabled>Select Status</MenuItem>
                {statuses.map((st) => (
                  <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Column 2: Financials & Resources */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Financials & Resources
              </Typography>
              <Divider />

              <TextField
                fullWidth
                type="number"
                label="Proposed Capital Amount"
                placeholder="e.g. 165000000.00"
                value={formData.proposedCapitalAmount}
                onChange={handleChange('proposedCapitalAmount')}
                size="small"
                inputProps={{ min: 0, step: 'any' }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                select
                fullWidth
                label="Currency"
                value={formData.currencyId}
                onChange={handleChange('currencyId')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">None / Select Currency</MenuItem>
                {currencies.map((curr) => (
                  <MenuItem key={curr.id} value={curr.id}>{curr.name} ({curr.code})</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Land Requested (m²)"
                placeholder="e.g. 2000-3000m²"
                value={formData.landRequested}
                onChange={handleChange('landRequested')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            {/* Column 3: Description & Remarks */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Description & Remarks
              </Typography>
              <Divider />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Project Description (የፕሮጀክት ዝርዝር መግለጫ)"
                placeholder="Enter detailed description of proposed project scope..."
                value={formData.description}
                onChange={handleChange('description')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                placeholder="Notes on document attachments, statements..."
                value={formData.remarks}
                onChange={handleChange('remarks')}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* File Upload Section */}
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2 }}>
              Attached Documents
            </Typography>

            <Box
              sx={{
                border: '2px dashed #cbd5e1',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: '#fafafa',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#4f46e5',
                  backgroundColor: '#f5f3ff',
                },
              }}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={uploading || uploadedFiles.length >= 5}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                  disabled={uploading || uploadedFiles.length >= 5}
                  sx={{
                    borderRadius: 2,
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </label>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 1 }}>
                PDF, Word, Excel, PowerPoint, or Images (Max 5 files, 10MB each)
              </Typography>
            </Box>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <List sx={{ mt: 2 }}>
                {uploadedFiles.map((file) => (
                  <ListItem
                    key={file.id}
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: '#ffffff',
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(file)}
                        sx={{ color: '#dc2626' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FileIcon sx={{ color: '#6366f1' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.originalName}
                      secondary={formatFileSize(file.size)}
                      primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Footer controls */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/projects/proposals')}
              disabled={saving}
              sx={{ borderRadius: 2, px: 3, borderColor: '#cbd5e1', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              {saving ? 'Creating...' : 'Create Proposal'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ProjectProposalForm;