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
  CircularProgress,
  Avatar,
  MenuItem,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Apartment as BuildingIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Layers as FloorIcon,
  SquareFoot as AreaIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { buildingsService } from '../../services/buildingServices/buildingsService';
import { buildingTypesService } from '../../services/foundationService/buildingTypesService';
import { regionsService } from '../../services/foundationService/regionsService';
import { zonesService } from '../../services/foundationService/zonesService';
import { woredasService } from '../../services/foundationService/woredasService';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const BuildingIndexPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Lookups
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [woredaFilter, setWoredaFilter] = useState('');

  // Status Toggle Modal
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch Lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [btRes, regRes] = await Promise.all([
          buildingTypesService.getBuildingTypes({ limit: 100, status: 'active' }),
          regionsService.getRegions({ limit: 100, status: 'active' }),
        ]);
        setBuildingTypes(btRes?.buildingTypes || btRes?.rows || (Array.isArray(btRes) ? btRes : []));
        setRegions(regRes?.regions || regRes?.rows || (Array.isArray(regRes) ? regRes : []));
      } catch (err) {
        console.error('Failed to load filter lookups:', err);
      }
    };
    loadLookups();
  }, []);

  // Cascading Zones
  useEffect(() => {
    if (!regionFilter) {
      setZones([]);
      setZoneFilter('');
      setWoredas([]);
      setWoredaFilter('');
      return;
    }
    const loadZones = async () => {
      try {
        const res = await zonesService.getZones({ regionId: regionFilter, limit: 100, status: 'active' });
        setZones(res?.zones || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error('Failed to load zones:', err);
      }
    };
    loadZones();
  }, [regionFilter]);

  // Cascading Woredas
  useEffect(() => {
    if (!zoneFilter) {
      setWoredas([]);
      setWoredaFilter('');
      return;
    }
    const loadWoredas = async () => {
      try {
        const res = await woredasService.getWoredas({ zoneId: zoneFilter, limit: 100, status: 'active' });
        setWoredas(res?.woredas || res?.rows || (Array.isArray(res) ? res : []));
      } catch (err) {
        console.error('Failed to load woredas:', err);
      }
    };
    loadWoredas();
  }, [zoneFilter]);

  // Fetch Buildings
  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const result = await buildingsService.getBuildings({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        buildingTypeId: typeFilter || undefined,
        regionId: regionFilter || undefined,
        zoneId: zoneFilter || undefined,
        woredaId: woredaFilter || undefined,
      });

      const dataList = result?.buildings || result?.rows || (Array.isArray(result) ? result : []);
      const total = result?.pagination?.total ?? result?.total ?? dataList.length;
      setBuildings(dataList);
      setTotalCount(total);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load buildings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, [page, rowsPerPage, statusFilter, typeFilter, regionFilter, zoneFilter, woredaFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchBuildings();
      } else {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('');
    setRegionFilter('');
    setZoneFilter('');
    setWoredaFilter('');
    setPage(0);
  };

  // Toggle Status Action
  const handleToggleDialogOpen = (building) => {
    setSelectedBuilding(building);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!selectedBuilding) return;
    setToggleLoading(true);
    try {
      const result = await buildingsService.toggleBuildingStatus(selectedBuilding.id);
      enqueueSnackbar(result?.message || 'Building status updated successfully', { variant: 'success' });
      setToggleDialogOpen(false);
      fetchBuildings();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update building status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
      {/* Compact Breadcrumb / Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.78rem' }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
              Buildings
            </Typography>
          </Breadcrumbs>

          <Box sx={{ width: '1px', height: 16, backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1 }}>
            Building Management
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate('/buildings/new')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'none',
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            px: 2.2,
            py: 0.85,
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
          }}
        >
          Add Building
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          p: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FilterIcon sx={{ color: '#64748b', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Filter & Search Buildings
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {(searchTerm || statusFilter !== 'all' || typeFilter || regionFilter || zoneFilter || woredaFilter) && (
            <Button
              size="small"
              startIcon={<ResetIcon sx={{ fontSize: 15 }} />}
              onClick={handleResetFilters}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#64748b', py: 0 }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        <Grid container spacing={1.5}>
          {/* Search Input */}
          <Grid item xs={12} sm={6} md={3.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, address, description..."
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
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                },
              }}
            />
          </Grid>

          {/* Building Type Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Building Types</MenuItem>
              {buildingTypes.map((type) => (
                <MenuItem key={type.id} value={type.id} sx={{ fontSize: '0.8rem' }}>
                  {type.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Region Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Regions</MenuItem>
              {regions.map((reg) => (
                <MenuItem key={reg.id} value={reg.id} sx={{ fontSize: '0.8rem' }}>
                  {reg.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Zone Filter */}
          <Grid item xs={12} sm={6} md={1.75}>
            <TextField
              select
              fullWidth
              size="small"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              disabled={!regionFilter}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Zones</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id} sx={{ fontSize: '0.8rem' }}>
                  {zone.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.8rem',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
              <MenuItem value="active" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
              <MenuItem value="inactive" sx={{ fontSize: '0.8rem' }}>Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Buildings Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  BUILDING NAME
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  TYPE
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  LOCATION
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>
                  FLOORS
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5 }}>
                  TOTAL AREA
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>
                  YEAR
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'center' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', py: 1.5, textAlign: 'right' }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#4f46e5', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Loading buildings...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : buildings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <BuildingIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      No buildings found
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {searchTerm || statusFilter !== 'all' || typeFilter || regionFilter
                        ? 'Try clearing or changing your search filters.'
                        : 'Click "Add Building" above to register a new building.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                buildings.map((building) => (
                  <TableRow
                    key={building.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: '#f8fafc' },
                    }}
                  >
                    {/* Building Name */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: '#eef2ff',
                            color: '#4f46e5',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          <BuildingIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography
                            component={RouterLink}
                            to={`/buildings/${building.id}`}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              textDecoration: 'none',
                              '&:hover': { color: '#4f46e5', textDecoration: 'underline' },
                            }}
                          >
                            {building.name}
                          </Typography>
                          {building.name_amharic && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                              {building.name_amharic}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Building Type */}
                    <TableCell sx={{ py: 1.5 }}>
                      {building.building_type_name ? (
                        <Chip
                          label={building.building_type_name}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            borderRadius: 1.5,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell sx={{ py: 1.5, fontSize: '0.8rem', color: '#64748b' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#475569' }} noWrap>
                          {[building.region_name, building.zone_name, building.woreda_name].filter(Boolean).join(', ') || building.address || '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Floors */}
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        icon={<FloorIcon sx={{ fontSize: '13px !important', color: '#64748b !important' }} />}
                        label={`${building.total_floors || 0} Flr`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>

                    {/* Total Area */}
                    <TableCell sx={{ py: 1.5, fontSize: '0.8rem', color: '#475569' }}>
                      {building.total_area_value ? (
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                          {building.total_area_value} {building.area_unit_code || building.area_unit_name || ''}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Year Built */}
                    <TableCell sx={{ py: 1.5, textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      {building.year_built || '—'}
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                      <Chip
                        label={building.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: building.is_active ? '#dcfce7' : '#fee2e2',
                          color: building.is_active ? '#15803d' : '#b91c1c',
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="View Building Details" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/buildings/${building.id}`)}
                            sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#4f46e5', backgroundColor: '#eef2ff' } }}
                          >
                            <ViewIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Building" arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/buildings/${building.id}/edit`)}
                            sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#0284c7', backgroundColor: '#e0f2fe' } }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={building.is_active ? 'Deactivate Building' : 'Activate Building'} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleDialogOpen(building)}
                            sx={{
                              p: 0.5,
                              color: building.is_active ? '#eab308' : '#16a34a',
                              '&:hover': {
                                backgroundColor: building.is_active ? '#fef9c3' : '#dcfce7',
                              },
                            }}
                          >
                            {building.is_active ? (
                              <DeactivateIcon sx={{ fontSize: 17 }} />
                            ) : (
                              <ActivateIcon sx={{ fontSize: 17 }} />
                            )}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '& .MuiTablePagination-selectLabel': { fontSize: '0.8rem', color: '#64748b' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#475569' },
            '& .MuiTablePagination-actions button': { fontSize: '0.8rem' },
          }}
        />
      </Paper>

      {/* Status Toggle Modal */}
      <ConfirmationModal
        open={toggleDialogOpen}
        title={selectedBuilding?.is_active ? 'Deactivate Building' : 'Activate Building'}
        message={
          selectedBuilding?.is_active
            ? `Are you sure you want to deactivate "${selectedBuilding?.name}"? Its units and floors may not be available for lease assignments.`
            : `Are you sure you want to activate "${selectedBuilding?.name}"?`
        }
        confirmText={selectedBuilding?.is_active ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        confirmColor={selectedBuilding?.is_active ? 'warning' : 'primary'}
        loading={toggleLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleDialogOpen(false)}
      />
    </Box>
  );
};

export default BuildingIndexPage;
