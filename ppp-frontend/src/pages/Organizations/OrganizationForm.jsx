import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Checkbox,
  ListItemText,
  Stack,
  Fade,
  FormHelperText,
  Autocomplete,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Badge as LicenseIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteDocIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { organizationService, organizationTypeService } from '../../services/organizationService';
import { businessSectorService } from '../../services/foundationService/businessSectorService';
import { countriesService } from '../../services/foundationService/countriesService';
import { regionsService } from '../../services/foundationService/regionsService';
import { zonesService } from '../../services/foundationService/zonesService';
import { woredasService } from '../../services/foundationService/woredasService';
import { organizationDocumentTypesService } from '../../services/foundationService/organizationDocumentTypesService';
import { fileService } from '../../services/fileService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

const inputSx = {
  borderRadius: 2,
  backgroundColor: '#ffffff',
  fontSize: '0.84rem',
  '& fieldset': { borderColor: '#cbd5e1' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#4f46e5', borderWidth: '1.5px' },
};

const formFieldSx = {
  '& .MuiOutlinedInput-root': inputSx,
  '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
};

const SectionHeader = ({ icon, title, color = '#1e40af' }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 1.5,
        backgroundColor: `${color}12`,
        color,
        '& svg': { fontSize: 16 },
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        color,
        letterSpacing: '0.3px',
        fontSize: '0.78rem',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </Typography>
  </Stack>
);

export const OrganizationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(id);

  const [orgTypes, setOrgTypes] = useState([]);
  const [businessSectors, setBusinessSectors] = useState([]);
  const [selectedBusinessSector, setSelectedBusinessSector] = useState(null);
  const [businessSectorSearch, setBusinessSectorSearch] = useState('');
  const [businessSectorLoading, setBusinessSectorLoading] = useState(false);

  // Location cascading lookups (Country → Region → Zone/Sub-city → Woreda)
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    // Core Organization
    name: '',
    amharicOrgName: '',
    oromoOrgName: '',
    organizationTypeIds: [],
    phone: '',
    email: '',
    countryId: '',
    regionId: '',
    zoneId: '',
    woredaId: '',
    profileExperience: '',

    // Organization Profile
    businessSectorId: '',
    yearsOfExperience: '',
    registrationDate: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    bio: '',
    pastProjectsSummary: '',
  });

  const filledCount = useMemo(() => {
    return Object.values(formData).filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== '' && v !== null && v !== undefined;
    }).length;
  }, [formData]);

  const totalFields = useMemo(() => Object.keys(formData).length, []);

  // Load Organization Types initially, Business Sectors loaded on search
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const orgTypesRes = await organizationTypeService.getOrganizationTypes({ limit: 100, status: 'active' });
        setOrgTypes(orgTypesRes.organizationTypes || orgTypesRes.rows || []);
      } catch (err) {
        console.error('Failed to load organization types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Load countries once (for the location cascade)
  useEffect(() => {
    countriesService.getCountries({ limit: 100, status: 'active' }).then((res) => {
      setCountries(res.countries || res.rows || []);
    }).catch(() => setCountries([]));
  }, []);

  // Load regions (options for the Region select)
  useEffect(() => {
    if (!formData.countryId) {
      setRegions([]);
      return;
    }
    regionsService.getRegions({ limit: 200, status: 'active' }).then((res) => {
      setRegions(res.regions || res.rows || []);
    }).catch(() => setRegions([]));
  }, [formData.countryId]);

  // Load zones for the selected region
  useEffect(() => {
    if (!formData.regionId) {
      setZones([]);
      return;
    }
    zonesService.getZones({ regionId: formData.regionId, limit: 200, status: 'active' }).then((res) => {
      setZones(res.zones || res.rows || []);
    }).catch(() => setZones([]));
  }, [formData.regionId]);

  // Load woredas for the selected zone
  useEffect(() => {
    if (!formData.zoneId) {
      setWoredas([]);
      return;
    }
    woredasService.getWoredas({ zoneId: formData.zoneId, limit: 200, status: 'active' }).then((res) => {
      setWoredas(res.woredas || res.rows || []);
    }).catch(() => setWoredas([]));
  }, [formData.zoneId]);

  // Location cascade handlers — changing a parent clears its children
  const handleCountryChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, countryId: value, regionId: '', zoneId: '', woredaId: '' }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors.countryId) setFieldErrors((prev) => ({ ...prev, countryId: undefined }));
  };

  const handleRegionChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, regionId: value, zoneId: '', woredaId: '' }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors.regionId) setFieldErrors((prev) => ({ ...prev, regionId: undefined }));
  };

  const handleZoneChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, zoneId: value, woredaId: '' }));
    if (errorMsg) setErrorMsg('');
  };

  // Debounced Business Sector search (min 3 characters)
  useEffect(() => {
    if (businessSectorSearch.length < 3) {
      setBusinessSectors([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusinessSectorLoading(true);
      try {
        const res = await businessSectorService.getBusinessSectors({ 
          limit: 50, 
          status: 'active',
          search: businessSectorSearch 
        });
        setBusinessSectors(res.businessSectors || res.rows || []);
      } catch (err) {
        console.error('Failed to load business sectors:', err);
      } finally {
        setBusinessSectorLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [businessSectorSearch]);

  // Fetch org data if in Edit mode
  useEffect(() => {
    if (!id) return;
    const fetchOrgDetails = async () => {
      setLoading(true);
      try {
        const org = await organizationService.getOrganizationById(id);

        let typeIds = [];
        if (Array.isArray(org.organization_type_ids)) {
          typeIds = org.organization_type_ids;
        } else if (org.organization_types && Array.isArray(org.organization_types)) {
          typeIds = org.organization_types.map((t) => t.id);
        } else if (org.organization_type_id) {
          typeIds = [org.organization_type_id];
        }

        setFormData({
          name: org.name || '',
          amharicOrgName: org.amharic_org_name || '',
          oromoOrgName: org.oromo_org_name || '',
          organizationTypeIds: typeIds,
          phone: org.phone || '',
          email: org.email || '',
          countryId: org.country_id || '',
          regionId: org.region_id || '',
          zoneId: org.zone_id || '',
          woredaId: org.woreda_id || '',
          profileExperience: org.profile_experience || '',
          businessSectorId: org.business_sector_id || '',
          yearsOfExperience: org.years_of_experience ?? '',
          registrationDate: org.registration_date ? org.registration_date.split('T')[0] : '',
          licenseNumber: org.license_number || '',
          licenseExpiryDate: org.license_expiry_date ? org.license_expiry_date.split('T')[0] : '',
          bio: org.bio || '',
          pastProjectsSummary: org.past_projects_summary || '',
        });

        // Load selected business sector if exists - add it to the options
        if (org.business_sector_id && org.business_sector_name) {
          const sector = {
            id: org.business_sector_id,
            eng_name: org.business_sector_name,
            amh_name: org.business_sector_amh_name,
            oro_name: org.business_sector_oro_name,
          };
          setSelectedBusinessSector(sector);
          setBusinessSectors([sector]);
        }
      } catch (err) {
        enqueueSnackbar(err.message || 'Failed to load organization details', { variant: 'error' });
        navigate('/organizations');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgDetails();
  }, [id]);

  // Auto-calculate years of experience from registration date
  useEffect(() => {
    if (formData.registrationDate) {
      const regDate = new Date(formData.registrationDate);
      const today = new Date();
      const yearsDiff = today.getFullYear() - regDate.getFullYear();
      const monthsDiff = today.getMonth() - regDate.getMonth();
      
      // Adjust if birthday hasn't occurred this year
      const adjustedYears = monthsDiff < 0 || (monthsDiff === 0 && today.getDate() < regDate.getDate())
        ? yearsDiff - 1
        : yearsDiff;

      setFormData((prev) => ({ ...prev, yearsOfExperience: Math.max(0, adjustedYears) }));
    }
  }, [formData.registrationDate]);

  // ── Organization Documents (edit mode only) ──
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docTypesList, setDocTypesList] = useState([]);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);
  const [deleteDocLoading, setDeleteDocLoading] = useState(false);
  // Documents staged on the Create page (attached to the DB after the org is created)
  const [pendingDocs, setPendingDocs] = useState([]);
  // Optional (non-required) document types manually added to the table on the Create page
  const [extraTypeIds, setExtraTypeIds] = useState([]);
  // Form tabs: 0 = Organization Details, 1 = Supporting Documents
  const [activeTab, setActiveTab] = useState(0);

  const displayDocs = isEditMode ? documents : pendingDocs;

  const requiredDocTypes = docTypesList.filter((dt) => dt.is_required);
  const uploadedTypeIds = (isEditMode ? documents : pendingDocs).map(
    (d) => d.document_type_id ?? d.documentTypeId
  );
  const missingRequiredDocs = requiredDocTypes.filter((dt) => !uploadedTypeIds.includes(dt.id));

  // Table rows: required types (+ types having a document in edit mode) + manually added ones
  const tableDocTypes = useMemo(() => {
    const base = isEditMode
      ? docTypesList.filter((dt) => dt.is_required || uploadedTypeIds.includes(dt.id))
      : requiredDocTypes;
    const extras = extraTypeIds
      .map((tid) => docTypesList.find((dt) => dt.id === tid))
      .filter(Boolean)
      .filter((dt) => !base.some((b) => b.id === dt.id));
    return [...base, ...extras];
  }, [isEditMode, docTypesList, extraTypeIds, requiredDocTypes, uploadedTypeIds]);

  const availableExtraTypes = docTypesList.filter((dt) => !tableDocTypes.some((t) => t.id === dt.id));

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

  const fetchDocTypesList = useCallback(async () => {
    try {
      const res = await organizationDocumentTypesService.getOrganizationDocumentTypes({ limit: 100, status: 'active' });
      setDocTypesList(res.organizationDocumentTypes || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (isEditMode) fetchDocuments();
    fetchDocTypesList();
  }, [isEditMode, fetchDocuments, fetchDocTypesList]);

  // ── Per-row drafts for the excel-like documents table ──
  const emptyDocDraft = { file: null, title: '', documentNumber: '', issuedDate: '', expiryDate: '', saving: false, error: '' };
  const [docDrafts, setDocDrafts] = useState({});

  const setDraft = (docTypeId, patch) => {
    setDocDrafts((prev) => ({ ...prev, [docTypeId]: { ...(prev[docTypeId] || emptyDocDraft), ...patch } }));
  };
  const getDraft = (docTypeId) => docDrafts[docTypeId] || emptyDocDraft;
  const clearDraft = (docTypeId) => {
    setDocDrafts((prev) => {
      const next = { ...prev };
      delete next[docTypeId];
      return next;
    });
  };

  const handleRowFileChange = (docTypeId) => (event) => {
    setDraft(docTypeId, { file: event.target.files?.[0] || null, error: '' });
  };

  const handleRowUpload = async (docType) => {
    const draft = docDrafts[docType.id] || {};
    if (!draft.title?.trim()) { setDraft(docType.id, { error: 'Document title is required.' }); return; }
    if (!draft.file) { setDraft(docType.id, { error: 'Please choose a file to upload.' }); return; }
    if (!draft.issuedDate) { setDraft(docType.id, { error: 'Issued date is required for all documents.' }); return; }
    if (docType.requires_expiry && !draft.expiryDate) {
      setDraft(docType.id, { error: `"${docType.name}" requires an expiry date.` }); return;
    }
    if (draft.issuedDate && draft.expiryDate && new Date(draft.expiryDate) < new Date(draft.issuedDate)) {
      setDraft(docType.id, { error: 'Expiry date cannot be earlier than the issued date.' }); return;
    }

    setDraft(docType.id, { saving: true, error: '' });
    try {
      if (!isEditMode) {
        setPendingDocs((prev) => [...prev, {
          key: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file: draft.file,
          documentTypeId: docType.id,
          documentNumber: draft.documentNumber,
          title: draft.title,
          description: '',
          issuedDate: draft.issuedDate || null,
          expiryDate: draft.expiryDate || null,
        }]);
        clearDraft(docType.id);
        enqueueSnackbar('Document staged — it will be attached after you save the organization', { variant: 'info' });
      } else {
        const uploadRes = await fileService.uploadFiles([draft.file]);
        const uploaded = uploadRes.data?.[0];
        if (!uploaded) throw new Error('File upload failed.');

        await organizationService.addOrganizationDocument(id, {
          documentTypeId: docType.id,
          documentNumber: draft.documentNumber,
          title: draft.title,
          description: '',
          issuedDate: draft.issuedDate || null,
          expiryDate: draft.expiryDate || null,
          filePath: uploaded.path,
          originalFilename: uploaded.originalName,
          fileSize: uploaded.size,
          mimeType: uploaded.mimetype,
        });
        clearDraft(docType.id);
        enqueueSnackbar('Document attached successfully', { variant: 'success' });
        fetchDocuments();
      }
    } catch (err) {
      setDraft(docType.id, { error: err.message || 'Failed to attach document.' });
    } finally {
      setDraft(docType.id, { saving: false });
    }
  };

  const handleDeleteDocConfirm = async () => {
    if (!deleteDocTarget) return;
    setDeleteDocLoading(true);
    try {
      await organizationService.deleteOrganizationDocument(id, deleteDocTarget.id);
      enqueueSnackbar('Document deleted', { variant: 'success' });
      setDeleteDocTarget(null);
      fetchDocuments();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to delete document', { variant: 'error' });
    } finally {
      setDeleteDocLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorMsg) setErrorMsg('');
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Organization name is required.';
    if (!formData.amharicOrgName?.trim()) errors.amharicOrgName = 'Organization name (Amharic) is required.';
    if (!formData.oromoOrgName?.trim()) errors.oromoOrgName = 'Organization name (Oromo) is required.';
    if (!formData.organizationTypeIds || formData.organizationTypeIds.length === 0) {
      errors.organizationTypeIds = 'Please select at least one Organization Type.';
    }
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required.';
    if (!formData.email?.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.countryId) errors.countryId = 'Country is required.';
    if (!formData.regionId) errors.regionId = 'Region is required.';
    if (!formData.businessSectorId) errors.businessSectorId = 'Business sector is required.';
    if (!formData.registrationDate) errors.registrationDate = 'Legal registration date is required.';
    if (!formData.licenseNumber?.trim()) errors.licenseNumber = 'Trade license / registration number is required.';
    if (formData.licenseExpiryDate && formData.registrationDate && new Date(formData.licenseExpiryDate) < new Date(formData.registrationDate)) {
      errors.licenseExpiryDate = 'License expiry date cannot be earlier than the legal registration date.';
    }

    setFieldErrors(errors);

    const firstError = Object.values(errors)[0];
    if (firstError) {
      setErrorMsg(firstError);
      return false;
    }

    if (!(isEditMode && docsLoading) && missingRequiredDocs.length > 0) {
      setActiveTab(1);
      setErrorMsg(
        `Required documents not yet uploaded: ${missingRequiredDocs.map((dt) => `${dt.name} (${dt.code})`).join(', ')}.`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        yearsOfExperience: formData.yearsOfExperience !== '' ? parseInt(formData.yearsOfExperience, 10) : null,
      };

      if (isEditMode) {
        await organizationService.updateOrganization(id, payload);
        enqueueSnackbar('Organization updated successfully', { variant: 'success' });
      } else {
        const created = await organizationService.createOrganization(payload);
        // Attach any documents staged during creation
        for (const pending of pendingDocs) {
          try {
            const uploadRes = await fileService.uploadFiles([pending.file]);
            const uploaded = uploadRes.data?.[0];
            if (!uploaded) throw new Error('File upload failed.');

            await organizationService.addOrganizationDocument(created.id, {
              documentTypeId: pending.documentTypeId,
              documentNumber: pending.documentNumber,
              title: pending.title,
              description: pending.description,
              issuedDate: pending.issuedDate,
              expiryDate: pending.expiryDate,
              filePath: uploaded.path,
              originalFilename: uploaded.originalName,
              fileSize: uploaded.size,
              mimeType: uploaded.mimetype,
            });
          } catch (docErr) {
            enqueueSnackbar(`Failed to attach "${pending.title}": ${docErr.message}`, { variant: 'error' });
          }
        }
        enqueueSnackbar('Organization created successfully', { variant: 'success' });
      }
      navigate('/organizations');
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${isEditMode ? 'update' : 'create'} organization.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          Loading organization details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/organizations" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Organizations
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              {isEditMode ? 'Edit Organization' : 'Create Organization'}
            </Typography>
          </Breadcrumbs>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', mx: 0.5 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            {isEditMode ? `Edit: ${formData.name || 'Organization'}` : 'Add New Organization'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organizations')}
          sx={{
            borderRadius: 2,
            borderColor: '#cbd5e1',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
          }}
        >
          Back to Directory
        </Button>
      </Box>

      {/* Completion Progress */}
      <Fade in>
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              Form Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {filledCount} / {totalFields} fields
            </Typography>
          </Box>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${(filledCount / totalFields) * 100}%`,
                borderRadius: 2,
                backgroundColor: filledCount === totalFields ? '#22c55e' : '#4f46e5',
                transition: 'width 0.4s ease, background-color 0.3s ease',
              }}
            />
          </Box>
        </Box>
      </Fade>

      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2, border: '1px solid #fecaca' }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Main Form */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          width: '100%',
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
        <Tabs
          value={activeTab}
          onChange={(event, value) => {
            setActiveTab(value);
            if (errorMsg) setErrorMsg('');
          }}
          sx={{
            mb: 3,
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTabs-indicator': { backgroundColor: '#4f46e5', height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab
            label="Organization Details"
            icon={<BusinessIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            sx={{
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#64748b',
              '&.Mui-selected': { color: '#4f46e5' },
            }}
          />
          <Tab
            label="Supporting Documents"
            icon={
              <Badge
                color="error"
                badgeContent={missingRequiredDocs.length}
                invisible={missingRequiredDocs.length === 0}
              >
                <AttachFileIcon sx={{ fontSize: 18 }} />
              </Badge>
            }
            iconPosition="start"
            sx={{
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#64748b',
              '&.Mui-selected': { color: '#4f46e5' },
            }}
          />
        </Tabs>

        {activeTab === 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            {/* Column 1: Core Organization Info */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<BusinessIcon />}
                title="Core Organization Info"
                color="#1e40af"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                required
                fullWidth
                label="Organization Name"
                placeholder="e.g. Addis Real Estate & Development Group"
                value={formData.name}
                onChange={handleChange('name')}
                size="small"
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Organization Name (Amharic)"
                placeholder="e.g. አዲስ ሪል እስቴት እና ልማት ድርጅት"
                value={formData.amharicOrgName}
                onChange={handleChange('amharicOrgName')}
                size="small"
                error={Boolean(fieldErrors.amharicOrgName)}
                helperText={fieldErrors.amharicOrgName || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Organization Name (Oromo)"
                placeholder="e.g. Garee Qabeenya Dhalataa fi Guddinaa Addis"
                value={formData.oromoOrgName}
                onChange={handleChange('oromoOrgName')}
                size="small"
                error={Boolean(fieldErrors.oromoOrgName)}
                helperText={fieldErrors.oromoOrgName || ''}
                sx={formFieldSx}
              />

              <FormControl
                required
                fullWidth
                size="small"
                error={Boolean(fieldErrors.organizationTypeIds)}
                sx={formFieldSx}
              >
                <InputLabel id="org-types-label">Organization Types</InputLabel>
                <Select
                  labelId="org-types-label"
                  id="organizationTypeIds"
                  multiple
                  value={formData.organizationTypeIds}
                  onChange={(e) => {
                    const { target: { value } } = e;
                    setFormData((prev) => ({
                      ...prev,
                      organizationTypeIds: typeof value === 'string' ? value.split(',') : value,
                    }));
                    if (errorMsg) setErrorMsg('');
                    if (fieldErrors.organizationTypeIds) setFieldErrors((prev) => ({ ...prev, organizationTypeIds: undefined }));
                  }}
                  input={<OutlinedInput label="Organization Types" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const typeObj = orgTypes.find((t) => t.id === value);
                        return (
                          <Chip
                            key={value}
                            label={typeObj ? typeObj.name : value}
                            size="small"
                            sx={{
                              borderRadius: 1.5,
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {orgTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id} sx={{ py: 0.75 }}>
                      <Checkbox checked={formData.organizationTypeIds.indexOf(type.id) > -1} size="small" />
                      <ListItemText primary={type.name} />
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.organizationTypeIds && (
                  <FormHelperText>{fieldErrors.organizationTypeIds}</FormHelperText>
                )}
              </FormControl>

              <TextField
                required
                fullWidth
                label="Phone Number"
                placeholder="e.g. 0911517888"
                value={formData.phone}
                onChange={handleChange('phone')}
                size="small"
                error={Boolean(fieldErrors.phone)}
                helperText={fieldErrors.phone || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                type="email"
                label="Email Address"
                placeholder="e.g. info@company.com"
                value={formData.email}
                onChange={handleChange('email')}
                size="small"
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || ''}
                sx={formFieldSx}
              />

              {/* Location — Country → Region → Zone/Sub-city → Woreda cascade */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Country"
                  value={formData.countryId}
                  onChange={handleCountryChange}
                  size="small"
                  error={Boolean(fieldErrors.countryId)}
                  helperText={fieldErrors.countryId || ''}
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Country...</MenuItem>
                  {countries.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}{c.code ? ` (${c.code})` : ''}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  fullWidth
                  label="Region"
                  value={formData.regionId}
                  onChange={handleRegionChange}
                  disabled={!formData.countryId}
                  size="small"
                  error={Boolean(fieldErrors.regionId)}
                  helperText={fieldErrors.regionId || ''}
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Region...</MenuItem>
                  {regions.map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Zone / Sub-city"
                  value={formData.zoneId}
                  onChange={handleZoneChange}
                  disabled={!formData.regionId}
                  size="small"
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Zone / Sub-city...</MenuItem>
                  {zones.map((z) => (
                    <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Woreda"
                  value={formData.woredaId}
                  onChange={handleChange('woredaId')}
                  disabled={!formData.zoneId}
                  size="small"
                  sx={formFieldSx}
                >
                  <MenuItem value="">Select Woreda...</MenuItem>
                  {woredas.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Stack>

            {/* Column 2: Licensing & Profile */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<LicenseIcon />}
                title="Licensing & Profile Specs"
                color="#047857"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <Autocomplete
                fullWidth
                options={selectedBusinessSector && !businessSectors.find(s => s.id === selectedBusinessSector.id) 
                  ? [selectedBusinessSector, ...businessSectors]
                  : businessSectors
                }
                value={selectedBusinessSector}
                onChange={(event, newValue) => {
                  setSelectedBusinessSector(newValue);
                  setFormData((prev) => ({ ...prev, businessSectorId: newValue ? newValue.id : '' }));
                  if (errorMsg) setErrorMsg('');
                  if (fieldErrors.businessSectorId) setFieldErrors((prev) => ({ ...prev, businessSectorId: undefined }));
                }}
                onInputChange={(event, newInputValue) => {
                  setBusinessSectorSearch(newInputValue);
                }}
                getOptionLabel={(option) => {
                  if (option.amh_name) {
                    return `${option.eng_name} (${option.amh_name})`;
                  }
                  return option.eng_name;
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={businessSectorLoading}
                noOptionsText={businessSectorSearch.length < 3 ? "Type 3+ characters to search" : "No sectors found"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Business Sector"
                    placeholder="Type to search..."
                    size="small"
                    error={Boolean(fieldErrors.businessSectorId)}
                    helperText={fieldErrors.businessSectorId || ''}
                    sx={formFieldSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {businessSectorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps?.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                required
                fullWidth
                type="date"
                label="Legal Registration Date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.registrationDate}
                onChange={handleChange('registrationDate')}
                size="small"
                error={Boolean(fieldErrors.registrationDate)}
                helperText={fieldErrors.registrationDate || ''}
                sx={formFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Trade License / Reg Number"
                placeholder="e.g. BL-99201"
                value={formData.licenseNumber}
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase();
                  setFormData((prev) => ({ ...prev, licenseNumber: upperValue }));
                  if (errorMsg) setErrorMsg('');
                  if (fieldErrors.licenseNumber) setFieldErrors((prev) => ({ ...prev, licenseNumber: undefined }));
                }}
                size="small"
                error={Boolean(fieldErrors.licenseNumber)}
                helperText={fieldErrors.licenseNumber || ''}
                sx={formFieldSx}
                inputProps={{
                  style: { textTransform: 'uppercase' }
                }}
              />

              <TextField
                fullWidth
                type="date"
                label="License Expiry Date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.licenseExpiryDate}
                onChange={handleChange('licenseExpiryDate')}
                size="small"
                sx={formFieldSx}
              />

              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                placeholder="Auto-calculated from registration date"
                value={formData.yearsOfExperience}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
                helperText="Automatically calculated from registration date"
                sx={{
                  ...formFieldSx,
                  '& .MuiInputBase-input': {
                    backgroundColor: '#f1f5f9',
                    cursor: 'not-allowed',
                  }
                }}
              />
            </Stack>

            {/* Column 3: Experience & Track Record */}
            <Stack spacing={2.5}>
              <SectionHeader
                icon={<DescriptionIcon />}
                title="Experience & Track Record"
                color="#7c3aed"
              />
              <Divider sx={{ borderColor: '#e2e8f0' }} />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Developer Profile & Experience (የአልሚው ፕሮፋይልና ልምድ)"
                placeholder="Enter raw developer experience text from EV document..."
                value={formData.profileExperience}
                onChange={handleChange('profileExperience')}
                size="small"
                sx={formFieldSx}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Executive Bio & Overview"
                placeholder="Professional background, key qualifications..."
                value={formData.bio}
                onChange={handleChange('bio')}
                size="small"
                sx={formFieldSx}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Past Projects Summary"
                placeholder="Summary of previous projects completed..."
                value={formData.pastProjectsSummary}
                onChange={handleChange('pastProjectsSummary')}
                size="small"
                sx={formFieldSx}
              />
            </Stack>
          </Box>

        )}

        {activeTab === 1 && (
        <Box sx={{ mt: 1 }}>
          {docsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={26} sx={{ color: '#4f46e5' }} />
            </Box>
          ) : (
            <>
              {!isEditMode && (
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                  Files are staged locally and attached automatically right after the organization is created.
                </Typography>
              )}
              {requiredDocTypes.length > 0 && (
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Rows marked with * are required and must be uploaded before saving. Issued date is mandatory for every document; expiry date is mandatory where the type requires it.
                </Typography>
              )}

              {availableExtraTypes.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Autocomplete
                    disablePortal
                    size="small"
                    options={availableExtraTypes}
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    renderOption={(props, option) => {
                      const { key, ...rest } = props;
                      return (
                        <Box component="li" key={key} {...rest} sx={{ display: 'block', py: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                            {option.name}
                          </Typography>
                        </Box>
                      );
                    }}
                    value={null}
                    onChange={(event, newValue) => {
                      if (newValue) setExtraTypeIds((prev) => [...prev, newValue.id]);
                    }}
                    noOptionsText="No document types found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add Document Type"
                        placeholder="Search document types…"
                        sx={{
                          minWidth: 300,
                          '& .MuiOutlinedInput-root': inputSx,
                          '& .MuiAutocomplete-input': { fontSize: '0.8rem' },
                        }}
                      />
                    )}
                  />
                </Box>
              )}

              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Document Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Document Number</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Document Title</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Issued Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Expiry Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>File</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Action / Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableDocTypes.map((dt) => {
                      const existingDoc = (isEditMode ? documents : pendingDocs).find(
                        (d) => (d.document_type_id ?? d.documentTypeId) === dt.id
                      );
                      const draft = getDraft(dt.id);
                      const required = Boolean(dt.is_required);
                      return (
                        <TableRow
                          key={dt.id}
                          sx={{ backgroundColor: required && !existingDoc ? 'rgba(239, 68, 68, 0.03)' : undefined, '&:hover': { backgroundColor: '#f8fafc' } }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {required ? <Box component="span" sx={{ color: '#dc2626', mr: 0.5 }}>*</Box> : null}
                              {dt.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block' }}>
                              {dt.code} • {required ? 'Required' : 'Optional'}{dt.requires_expiry ? ' • expiry req.' : ''}
                            </Typography>
                          </TableCell>

                          {existingDoc ? (
                            <>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#334155' }}>
                                  {existingDoc.document_number || existingDoc.documentNumber || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                                  {existingDoc.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#334155' }}>
                                  {(existingDoc.issued_date || existingDoc.issuedDate) ? formatDate(existingDoc.issued_date || existingDoc.issuedDate) : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: existingDoc.is_expired ? '#dc2626' : '#334155' }}>
                                  {(existingDoc.expiry_date || existingDoc.expiryDate) ? formatDate(existingDoc.expiry_date || existingDoc.expiryDate) : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b', display: 'block', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isEditMode ? existingDoc.original_filename : existingDoc.file?.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                                  {isEditMode ? (
                                    <Chip
                                      label={
                                        existingDoc.is_verified
                                          ? 'Verified'
                                          : existingDoc.verified_at
                                            ? 'Rejected'
                                            : 'Not Verified'
                                      }
                                      size="small"
                                      sx={{
                                        height: 20, fontSize: '0.62rem', fontWeight: 700,
                                        backgroundColor: existingDoc.is_verified
                                          ? 'rgba(16, 185, 129, 0.1)'
                                          : existingDoc.verified_at
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(245, 158, 11, 0.1)',
                                        color: existingDoc.is_verified
                                          ? '#059669'
                                          : existingDoc.verified_at
                                            ? '#dc2626'
                                            : '#b45309',
                                      }}
                                    />
                                  ) : (
                                    <Chip
                                      label="Pending save"
                                      size="small"
                                      sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }}
                                    />
                                  )}
                                  {isEditMode && (
                                    <Button
                                      size="small"
                                      variant="text"
                                      href={`http://localhost:5000/${existingDoc.file_path}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', color: '#0284c7', minWidth: 0, px: 1 }}
                                    >
                                      Open
                                    </Button>
                                  )}
                                  {(() => {
                                    const docCanDelete = !isEditMode || !existingDoc.is_verified;
                                    return !docCanDelete ? (
                                      <Tooltip title="Verified documents cannot be deleted.">
                                        <span>
                                          <IconButton
                                            size="small"
                                            disabled
                                            sx={{ color: '#94a3b8', backgroundColor: '#f1f5f9', borderRadius: 1.5, p: 0.6 }}
                                          >
                                            <DeleteDocIcon sx={{ fontSize: 15 }} />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    ) : (
                                      <Tooltip title="Delete Document">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            if (isEditMode) {
                                              setDeleteDocTarget(existingDoc);
                                            } else {
                                              setPendingDocs((prev) => prev.filter((p) => p.key !== existingDoc.key));
                                              setExtraTypeIds((prev) => prev.filter((tid) => tid !== dt.id));
                                            }
                                          }}
                                          sx={{ color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: 1.5, p: 0.6, '&:hover': { backgroundColor: '#fee2e2' } }}
                                        >
                                          <DeleteDocIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </Tooltip>
                                    );
                                  })()}
                                </Stack>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell sx={{ minWidth: 120 }}>
                                <TextField
                                  fullWidth
                                  placeholder="e.g. TL-2024-0091"
                                  value={draft.documentNumber}
                                  onChange={(e) => setDraft(dt.id, { documentNumber: e.target.value, error: '' })}
                                  size="small"
                                  disabled={draft.saving}
                                  sx={{ '& .MuiOutlinedInput-root': inputSx, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 150 }}>
                                <TextField
                                  required
                                  fullWidth
                                  placeholder="e.g. Trade License"
                                  value={draft.title}
                                  onChange={(e) => setDraft(dt.id, { title: e.target.value, error: '' })}
                                  size="small"
                                  disabled={draft.saving}
                                  sx={{ '& .MuiOutlinedInput-root': inputSx, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 140 }}>
                                <TextField
                                  required
                                  fullWidth
                                  type="date"
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  value={draft.issuedDate}
                                  onChange={(e) => setDraft(dt.id, { issuedDate: e.target.value, error: '' })}
                                  size="small"
                                  disabled={draft.saving}
                                  sx={{ '& .MuiOutlinedInput-root': inputSx, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 140 }}>
                                <TextField
                                  fullWidth
                                  type="date"
                                  required={dt.requires_expiry}
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  value={draft.expiryDate}
                                  onChange={(e) => setDraft(dt.id, { expiryDate: e.target.value, error: '' })}
                                  size="small"
                                  disabled={draft.saving}
                                  sx={{ '& .MuiOutlinedInput-root': inputSx, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                                />
                              </TableCell>
                              <TableCell sx={{ minWidth: 130 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  component="label"
                                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#4f46e5', color: '#4f46e5' }, maxWidth: 130 }}
                                >
                                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90, fontSize: '0.7rem' }}>
                                    {draft.file ? draft.file.name : 'Choose'}
                                  </Box>
                                  <input type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" onChange={handleRowFileChange(dt.id)} />
                                </Button>
                              </TableCell>
                              <TableCell align="center">
                                {draft.error ? (
                                  <Tooltip title={draft.error}>
                                    <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', fontSize: '0.6rem', mb: 0.5 }}>
                                      ⚠ {draft.error.length > 28 ? `${draft.error.slice(0, 28)}…` : draft.error}
                                    </Typography>
                                  </Tooltip>
                                ) : null}
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={draft.saving}
                                  onClick={() => handleRowUpload(dt)}
                                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' }, '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }, px: 1.5, minWidth: 0 }}
                                >
                                  {draft.saving ? <CircularProgress size={14} color="inherit" /> : 'Upload'}
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
        )}

        {/* Submit Actions Footer (always visible on both tabs) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 4,
            pt: 3,
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
            {isEditMode ? 'Changes will be saved immediately' : 'All required fields must be completed'}
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/organizations')}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 3,
                borderColor: '#cbd5e1',
                color: '#475569',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
              }}
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
                textTransform: 'none',
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
              }}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Organization' : 'Create Organization'}
            </Button>
          </Stack>
        </Box>
        </form>
      </Paper>

      {/* Delete Document Confirmation */}
      <ConfirmationModal
        open={Boolean(deleteDocTarget)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDocTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteDocConfirm}
        onClose={() => setDeleteDocTarget(null)}
        loading={deleteDocLoading}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
};

export default OrganizationForm;
