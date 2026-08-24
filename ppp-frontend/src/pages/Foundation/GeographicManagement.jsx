import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Grid,
  Divider,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Public as CountryIcon,
  Map as RegionIcon,
  Place as ZoneIcon,
  LocationCity as WoredaIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  countriesService,
  regionsService,
  zonesService,
  woredasService,
} from '../../services/foundationService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const GeographicManagement = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Common States
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Data States
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);

  // Parent Selection States (for hierarchical filtering)
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [allRegions, setAllRegions] = useState([]);
  const [allZones, setAllZones] = useState([]);

  // Applied Filter States (after clicking Filter button)
  const [appliedCountry, setAppliedCountry] = useState(null);
  const [appliedRegion, setAppliedRegion] = useState(null);
  const [appliedZone, setAppliedZone] = useState(null);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch all countries for dropdown
  const fetchAllCountries = async () => {
    try {
      const result = await countriesService.getCountries({ limit: 1000, status: 'active' });
      setAllCountries(result.countries || []);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  // Fetch all regions for dropdown (filtered by country if selected)
  const fetchAllRegions = async (countryId = '') => {
    try {
      const result = await regionsService.getRegions({ limit: 1000, status: 'active', countryId });
      setAllRegions(result.regions || []);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    }
  };

  // Fetch all zones for dropdown (filtered by region if selected)
  const fetchAllZones = async (regionId = '') => {
    try {
      const result = await zonesService.getZones({ limit: 1000, status: 'active', regionId });
      setAllZones(result.zones || []);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  };

  // Load initial dropdowns
  useEffect(() => {
    fetchAllCountries();
  }, []);

  // When country changes, reload regions
  useEffect(() => {
    if (selectedCountry) {
      fetchAllRegions(selectedCountry.id);
      setSelectedRegion(null);
      setAllZones([]);
      setSelectedZone(null);
    } else {
      setAllRegions([]);
      setSelectedRegion(null);
      setAllZones([]);
      setSelectedZone(null);
    }
  }, [selectedCountry]);

  // When region changes, reload zones
  useEffect(() => {
    if (selectedRegion) {
      fetchAllZones(selectedRegion.id);
      setSelectedZone(null);
    } else {
      setAllZones([]);
      setSelectedZone(null);
    }
  }, [selectedRegion]);

  // Fetch Data Based on Active Tab
  const fetchData = async () => {
    // For tabs with required filters, don't fetch if filters not applied
    if (activeTab === 1 && !filtersApplied) {
      setLoading(false);
      setRegions([]);
      setTotalCount(0);
      return;
    }
    if (activeTab === 2 && !filtersApplied) {
      setLoading(false);
      setZones([]);
      setTotalCount(0);
      return;
    }
    if (activeTab === 3 && !filtersApplied) {
      setLoading(false);
      setWoredas([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const options = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      };

      switch (activeTab) {
        case 0: // Countries
          const countryResult = await countriesService.getCountries(options);
          setCountries(countryResult.countries || []);
          setTotalCount(countryResult.pagination?.total || 0);
          break;
        case 1: // Regions - require country
          if (!appliedCountry) {
            setRegions([]);
            setTotalCount(0);
            break;
          }
          options.countryId = appliedCountry.id;
          const regionResult = await regionsService.getRegions(options);
          setRegions(regionResult.regions || []);
          setTotalCount(regionResult.pagination?.total || 0);
          break;
        case 2: // Zones - require region
          if (!appliedRegion) {
            setZones([]);
            setTotalCount(0);
            break;
          }
          options.regionId = appliedRegion.id;
          const zoneResult = await zonesService.getZones(options);
          setZones(zoneResult.zones || []);
          setTotalCount(zoneResult.pagination?.total || 0);
          break;
        case 3: // Woredas - require zone
          if (!appliedZone) {
            setWoredas([]);
            setTotalCount(0);
            break;
          }
          options.zoneId = appliedZone.id;
          const woredaResult = await woredasService.getWoredas(options);
          setWoredas(woredaResult.woredas || []);
          setTotalCount(woredaResult.pagination?.total || 0);
          break;
        default:
          break;
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, statusFilter, activeTab, appliedCountry, appliedRegion, appliedZone, filtersApplied]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchData();
      } else {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedCountry(null);
    setSelectedRegion(null);
    setSelectedZone(null);
    setAppliedCountry(null);
    setAppliedRegion(null);
    setAppliedZone(null);
    setFiltersApplied(false);
    
    // Load parent data for hierarchical tabs
    if (newValue === 1) fetchAllCountries();
    if (newValue === 2) fetchAllCountries();
    if (newValue === 3) fetchAllCountries();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle Filter Button Click
  const handleApplyFilters = () => {
    // Validate required filters based on tab
    if (activeTab === 1 && !selectedCountry) {
      enqueueSnackbar('Please select a Country to filter Regions', { variant: 'warning' });
      return;
    }
    if (activeTab === 2 && (!selectedCountry || !selectedRegion)) {
      enqueueSnackbar('Please select Country and Region to filter Zones/Subcity', { variant: 'warning' });
      return;
    }
    if (activeTab === 3 && (!selectedCountry || !selectedRegion || !selectedZone)) {
      enqueueSnackbar('Please select Country, Region, and Zone/Subcity to filter Woredas', { variant: 'warning' });
      return;
    }

    // Apply filters
    setAppliedCountry(selectedCountry);
    setAppliedRegion(selectedRegion);
    setAppliedZone(selectedZone);
    setFiltersApplied(true);
    setPage(0);
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setSelectedCountry(null);
    setSelectedRegion(null);
    setSelectedZone(null);
    setAppliedCountry(null);
    setAppliedRegion(null);
    setAppliedZone(null);
    setFiltersApplied(false);
    setPage(0);
  };

  // Dialog Handlers
  const handleDialogOpen = (mode, item = null) => {
    setDialogMode(mode);
    setSelectedItem(item);
    if ((mode === 'edit' || mode === 'view') && item) {
      setFormData({
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        countryId: item.country_id || '',
        regionId: item.region_id || '',
        zoneId: item.zone_id || '',
      });
    } else {
      setFormData({ name: '', code: '', description: '', countryId: '', regionId: '', zoneId: '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setFormData({ name: '', code: '', description: '', countryId: '', regionId: '', zoneId: '' });
    setFormError('');
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (formError) setFormError('');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
      };

      switch (activeTab) {
        case 0: // Countries
          if (dialogMode === 'add') {
            await countriesService.createCountry(payload);
            enqueueSnackbar('Country created successfully', { variant: 'success' });
          } else if (dialogMode === 'edit') {
            await countriesService.updateCountry(selectedItem.id, payload);
            enqueueSnackbar('Country updated successfully', { variant: 'success' });
          }
          break;
        case 1: // Regions
          payload.countryId = formData.countryId;
          if (!payload.countryId) {
            setFormError('Country is required.');
            setFormLoading(false);
            return;
          }
          if (dialogMode === 'add') {
            await regionsService.createRegion(payload);
            enqueueSnackbar('Region created successfully', { variant: 'success' });
          } else if (dialogMode === 'edit') {
            await regionsService.updateRegion(selectedItem.id, payload);
            enqueueSnackbar('Region updated successfully', { variant: 'success' });
          }
          break;
        case 2: // Zones
          payload.regionId = formData.regionId;
          if (!payload.regionId) {
            setFormError('Region is required.');
            setFormLoading(false);
            return;
          }
          if (dialogMode === 'add') {
            await zonesService.createZone(payload);
            enqueueSnackbar('Zone created successfully', { variant: 'success' });
          } else if (dialogMode === 'edit') {
            await zonesService.updateZone(selectedItem.id, payload);
            enqueueSnackbar('Zone updated successfully', { variant: 'success' });
          }
          break;
        case 3: // Woredas
          payload.zoneId = formData.zoneId;
          if (!payload.zoneId) {
            setFormError('Zone is required.');
            setFormLoading(false);
            return;
          }
          if (dialogMode === 'add') {
            await woredasService.createWoreda(payload);
            enqueueSnackbar('Woreda created successfully', { variant: 'success' });
          } else if (dialogMode === 'edit') {
            await woredasService.updateWoreda(selectedItem.id, payload);
            enqueueSnackbar('Woreda updated successfully', { variant: 'success' });
          }
          break;
        default:
          break;
      }
      handleDialogClose();
      fetchData();
    } catch (error) {
      setFormError(error.message || `Failed to ${dialogMode === 'add' ? 'create' : 'update'}.`);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleDialogOpen = (item) => {
    setSelectedItem(item);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedItem) return;
    setToggleLoading(true);
    try {
      let result;
      switch (activeTab) {
        case 0:
          result = await countriesService.toggleCountryStatus(selectedItem.id);
          break;
        case 1:
          result = await regionsService.toggleRegionStatus(selectedItem.id);
          break;
        case 2:
          result = await zonesService.toggleZoneStatus(selectedItem.id);
          break;
        case 3:
          result = await woredasService.toggleWoredaStatus(selectedItem.id);
          break;
        default:
          break;
      }
      enqueueSnackbar(result.message || 'Status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  // Delete
  const handleDeleteDialogOpen = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setDeleteLoading(true);
    try {
      let result;
      switch (activeTab) {
        case 0:
          result = await countriesService.deleteCountry(selectedItem.id);
          break;
        case 1:
          result = await regionsService.deleteRegion(selectedItem.id);
          break;
        case 2:
          result = await zonesService.deleteZone(selectedItem.id);
          break;
        case 3:
          result = await woredasService.deleteWoreda(selectedItem.id);
          break;
        default:
          break;
      }
      enqueueSnackbar(result.message || 'Deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 0: return countries;
      case 1: return regions;
      case 2: return zones;
      case 3: return woredas;
      default: return [];
    }
  };

  const getTabConfig = () => {
    const configs = [
      { label: 'Countries', icon: <CountryIcon />, entityName: 'Country' },
      { label: 'Regions', icon: <RegionIcon />, entityName: 'Region' },
      { label: 'Zones/Subcity', icon: <ZoneIcon />, entityName: 'Zone/Subcity' },
      { label: 'Woredas', icon: <WoredaIcon />, entityName: 'Woreda' },
    ];
    return configs[activeTab];
  };

  const config = getTabConfig();
  const data = getCurrentData();

  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'add': return `Add ${config.entityName}`;
      case 'edit': return `Edit ${config.entityName}`;
      case 'view': return `${config.entityName} Details`;
      default: return '';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
          <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            Geographic Management
          </Typography>
        </Breadcrumbs>

        <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
          Geographic Hierarchy Management
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              minHeight: 56,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#4f46e5',
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3,
            },
          }}
        >
          <Tab icon={<CountryIcon />} iconPosition="start" label="Countries" />
          <Tab icon={<RegionIcon />} iconPosition="start" label="Regions" />
          <Tab icon={<ZoneIcon />} iconPosition="start" label="Zones/Subcity" />
          <Tab icon={<WoredaIcon />} iconPosition="start" label="Woredas" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.5,
          mb: 3,
        }}
      >
        {/* First Row - Search, Status, Count, Add Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: activeTab > 0 ? 2 : 0 }}>
          {/* Search Input */}
          <TextField
            size="small"
            placeholder={`Search ${config.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                </Box>
              ),
            }}
            sx={{
              flex: '1 1 280px',
              maxWidth: 360,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.8rem',
                backgroundColor: '#f8fafc',
              },
            }}
          />

          {/* Status Filter Dropdown */}
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              flex: '0 0 140px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.8rem',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Chip
              label={`${totalCount} ${config.label.toLowerCase()}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#eef2ff',
                color: '#3730a3',
                border: '1px solid #c7d2fe',
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleDialogOpen('add')}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                fontSize: '0.82rem',
              }}
            >
              Add {config.entityName}
            </Button>
          </Box>
        </Box>

        {/* Second Row - Hierarchical Filters (Right-aligned) */}
        {activeTab > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <FilterIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                Hierarchical Filters
              </Typography>
            </Box>

            <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

            {/* Filters for Regions */}
            {activeTab === 1 && (
              <>
                <Autocomplete
                  size="small"
                  options={allCountries}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedCountry}
                  onChange={(e, newValue) => setSelectedCountry(newValue)}
                  renderInput={(params) => <TextField {...params} placeholder="Select Country *" />}
                  sx={{
                    flex: '0 0 220px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
              </>
            )}

            {/* Filters for Zones/Subcity */}
            {activeTab === 2 && (
              <>
                <Autocomplete
                  size="small"
                  options={allCountries}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedCountry}
                  onChange={(e, newValue) => setSelectedCountry(newValue)}
                  renderInput={(params) => <TextField {...params} placeholder="Select Country *" />}
                  sx={{
                    flex: '0 0 200px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
                <Autocomplete
                  size="small"
                  options={allRegions}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedRegion}
                  onChange={(e, newValue) => setSelectedRegion(newValue)}
                  disabled={!selectedCountry}
                  renderInput={(params) => <TextField {...params} placeholder="Select Region *" />}
                  sx={{
                    flex: '0 0 200px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
              </>
            )}

            {/* Filters for Woredas */}
            {activeTab === 3 && (
              <>
                <Autocomplete
                  size="small"
                  options={allCountries}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedCountry}
                  onChange={(e, newValue) => setSelectedCountry(newValue)}
                  renderInput={(params) => <TextField {...params} placeholder="Select Country *" />}
                  sx={{
                    flex: '0 0 180px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
                <Autocomplete
                  size="small"
                  options={allRegions}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedRegion}
                  onChange={(e, newValue) => setSelectedRegion(newValue)}
                  disabled={!selectedCountry}
                  renderInput={(params) => <TextField {...params} placeholder="Select Region *" />}
                  sx={{
                    flex: '0 0 180px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
                <Autocomplete
                  size="small"
                  options={allZones}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedZone}
                  onChange={(e, newValue) => setSelectedZone(newValue)}
                  disabled={!selectedRegion}
                  renderInput={(params) => <TextField {...params} placeholder="Select Zone/Subcity *" />}
                  sx={{
                    flex: '0 0 180px',
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' },
                  }}
                />
              </>
            )}

            {/* Clear Button */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                borderColor: '#cbd5e1',
                color: '#64748b',
                '&:hover': { 
                  borderColor: '#94a3b8',
                  backgroundColor: '#f8fafc',
                },
                fontSize: '0.82rem',
                textTransform: 'none',
              }}
            >
              Clear
            </Button>

            {/* Apply Filter Button */}
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                fontSize: '0.82rem',
                textTransform: 'none',
              }}
            >
              Apply Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Name</TableCell>
                {(activeTab === 0 || activeTab === 1) && (
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Code</TableCell>
                )}
                {activeTab === 1 && (
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Country</TableCell>
                )}
                {activeTab === 2 && (
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Region</TableCell>
                )}
                {activeTab === 3 && (
                  <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Zone/Subcity</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No {config.label.toLowerCase()} found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#4f46e5', fontSize: '0.72rem', fontWeight: 700 }}>
                          {config.icon}
                        </Avatar>
                        <Typography
                          variant="body2"
                          onClick={() => handleDialogOpen('view', item)}
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {(activeTab === 0 || activeTab === 1) && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          {item.code || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {activeTab === 1 && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          {item.country_name || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {activeTab === 2 && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          {item.region_name || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {activeTab === 3 && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          {item.zone_name || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={item.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: item.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: item.is_active ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={item.is_active ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggleDialogOpen(item)} sx={{ p: 0.5, color: item.is_active ? '#f59e0b' : '#10b981' }}>
                            {item.is_active ? <DeactivateIcon sx={{ fontSize: 17 }} /> : <ActivateIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleDialogOpen('view', item)} sx={{ p: 0.5, color: '#6366f1' }}>
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleDialogOpen('edit', item)} sx={{ p: 0.5, color: '#64748b' }}>
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteDialogOpen(item)} sx={{ p: 0.5, color: '#dc2626' }}>
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>{getDialogTitle()}</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}

          {dialogMode === 'view' && selectedItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Avatar sx={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)' }}>{config.icon}</Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedItem.name}</Typography>
                  <Chip label={selectedItem.is_active ? 'Active' : 'Inactive'} size="small" sx={{ mt: 0.5, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </Box>

              <Grid container spacing={2}>
                {(activeTab === 0 || activeTab === 1) && (
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedItem.code || '-'}</Typography>
                  </Grid>
                )}
                {activeTab === 1 && (
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Country</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedItem.country_name || '-'}</Typography>
                  </Grid>
                )}
                {activeTab === 2 && (
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Region</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedItem.region_name || '-'}</Typography>
                  </Grid>
                )}
                {activeTab === 3 && (
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Zone/Subcity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedItem.zone_name || '-'}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Description</Typography>
                  <Typography variant="body2">{selectedItem.description || 'No description'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Created</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{formatDate(selectedItem.created_at)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Updated</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{formatDate(selectedItem.updated_at)}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeTab === 1 && (
                <Autocomplete
                  options={allCountries}
                  getOptionLabel={(option) => option.name || ''}
                  value={allCountries.find((c) => c.id === formData.countryId) || null}
                  onChange={(e, newValue) => setFormData((prev) => ({ ...prev, countryId: newValue?.id || '' }))}
                  renderInput={(params) => <TextField {...params} required label="Country" size="small" />}
                  disabled={formLoading}
                />
              )}
              {activeTab === 2 && (
                <Autocomplete
                  options={allRegions}
                  getOptionLabel={(option) => option.name || ''}
                  value={allRegions.find((r) => r.id === formData.regionId) || null}
                  onChange={(e, newValue) => setFormData((prev) => ({ ...prev, regionId: newValue?.id || '' }))}
                  renderInput={(params) => <TextField {...params} required label="Region" size="small" />}
                  disabled={formLoading}
                />
              )}
              {activeTab === 3 && (
                <Autocomplete
                  options={allZones}
                  getOptionLabel={(option) => option.name || ''}
                  value={allZones.find((z) => z.id === formData.zoneId) || null}
                  onChange={(e, newValue) => setFormData((prev) => ({ ...prev, zoneId: newValue?.id || '' }))}
                  renderInput={(params) => <TextField {...params} required label="Zone/Subcity" size="small" />}
                  disabled={formLoading}
                />
              )}

              <TextField required fullWidth label="Name" value={formData.name} onChange={handleChange('name')} size="small" disabled={formLoading} />
              {(activeTab === 0 || activeTab === 1) && (
                <TextField fullWidth label="Code" value={formData.code} onChange={handleChange('code')} size="small" disabled={formLoading} />
              )}
              <TextField fullWidth multiline rows={3} label="Description" value={formData.description} onChange={handleChange('description')} size="small" disabled={formLoading} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          {dialogMode !== 'view' ? (
            <>
              <Button onClick={handleDialogClose} disabled={formLoading}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" disabled={formLoading} sx={{ backgroundColor: '#4f46e5' }}>
                {formLoading ? <CircularProgress size={20} /> : dialogMode === 'add' ? 'Create' : 'Update'}
              </Button>
            </>
          ) : (
            <Button onClick={handleDialogClose} variant="contained" sx={{ backgroundColor: '#4f46e5' }}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={toggleDialogOpen}
        onClose={() => setToggleDialogOpen(false)}
        onConfirm={handleToggleConfirm}
        title={selectedItem?.is_active ? `Deactivate ${config.entityName}` : `Activate ${config.entityName}`}
        message={`Are you sure you want to ${selectedItem?.is_active ? 'deactivate' : 'activate'} "${selectedItem?.name}"?`}
        confirmText={selectedItem?.is_active ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        severity={selectedItem?.is_active ? 'warning' : 'info'}
      />

      <ConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${config.entityName}`}
        message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
        severity="error"
      />
    </Box>
  );
};

export default GeographicManagement;
