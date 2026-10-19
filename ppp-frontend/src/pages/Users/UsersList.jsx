import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
    Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Visibility as ViewIcon,
  Lock as LockedIcon,
  LockOpen as UnlockIcon,
  LockReset as PasswordResetIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userServices/userServices';
import { formatDate } from '../../utils/formatters';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

export const UsersList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const toggleDialogRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
      });
      setUsers(result.users || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (error) {
      enqueueSnackbar('Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        fetchUsers();
      } else {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteDialogOpen = (user) => {
    if (isCurrentUser(user.id)) {
      enqueueSnackbar('You cannot perform this action on yourself', { variant: 'warning' });
      return;
    }
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleToggleDialogOpen = (user) => {
    if (isCurrentUser(user.id)) {
      enqueueSnackbar('You cannot perform this action on yourself', { variant: 'warning' });
      return;
    }
    setSelectedUser(user);
    setToggleDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await userService.deleteUser(selectedUser.id);
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete user', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleConfirm = async () => {
    if (!selectedUser) return;
    setToggleLoading(true);
    try {
      const result = await userService.toggleUserStatus(selectedUser.id);
      enqueueSnackbar(result.message, { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to toggle user status', { variant: 'error' });
    } finally {
      setToggleLoading(false);
      setToggleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleDialogClose = () => {
    if (toggleLoading) return;
    setToggleDialogOpen(false);
    setSelectedUser(null);
  };

  // A user is "locked" when a lock timestamp exists and is still in the future.
  const isLocked = (user) => Boolean(user?.locked_until && new Date(user.locked_until) > new Date());

  const handleUnlockDialogOpen = (user) => {
    setSelectedUser(user);
    setUnlockDialogOpen(true);
  };

  const handleUnlockConfirm = async () => {
    if (!selectedUser) return;
    setUnlockLoading(true);
    try {
      const result = await userService.unlockUser(selectedUser.id);
      enqueueSnackbar(result.message || 'User unlocked successfully', { variant: 'success' });
      fetchUsers();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to unlock user', { variant: 'error' });
    } finally {
      setUnlockLoading(false);
      setUnlockDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleUnlockDialogClose = () => {
    if (unlockLoading) return;
    setUnlockDialogOpen(false);
    setSelectedUser(null);
  };

  // ─── Password reset (admin sets a new password for the user) ───────────────
  const passwordError = (() => {
    if (!newPassword && !confirmPassword) return '';
    if (newPassword.length > 0 && newPassword.length < 6) return 'Password must be at least 6 characters.';
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) return 'Passwords do not match.';
    return '';
  })();

  const handlePasswordDialogOpen = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogOpen(true);
  };

  const handlePasswordDialogClose = () => {
    if (passwordLoading) return;
    setPasswordDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePasswordReset = async () => {
    if (!selectedUser) return;

    if (!newPassword || newPassword.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters.', { variant: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      enqueueSnackbar('Passwords do not match.', { variant: 'warning' });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await userService.resetPassword(selectedUser.id, newPassword);
      enqueueSnackbar(result.message || 'Password reset successfully', { variant: 'success' });
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to reset password', { variant: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getUserInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.display_name) {
      return user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user.email?.[0] || user.username?.[0] || 'U').toUpperCase();
  };

  // Check if user is the currently logged-in user
  const isCurrentUser = (userId) => currentUser?.id === userId;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system users and their access permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/users/new')}
          sx={{ fontWeight: 600 }}
        >
          Add New User
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <PersonIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Filters
          </Typography>
        </Box>

        <Box sx={{ width: '1px', height: 24, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by name, email, username..."
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
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
          }}
        />

        {/* Status Filter */}
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
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#1a237e' },
            },
          }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Chip
            label={`${totalCount} users`}
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
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Status</TableCell>
                {/* <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }}>Created</TableCell> */}
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1, fontSize: '0.78rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: '#6366f1' }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover sx={{ '& td': { py: 0.75 } }}>
                    <TableCell>
                      <Box
                        onClick={() => navigate(`/users/${user.id}`)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover .user-display-name': { color: '#4f46e5', textDecoration: 'underline' },
                        }}
                      >
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#1a237e', fontSize: '0.72rem', fontWeight: 700 }}>
                          {user.avatar_url ? (
                            <Box component="img" src={user.avatar_url} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            getUserInitials(user)
                          )}
                        </Avatar>
                        <Box>
                          <Typography className="user-display-name" variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem', transition: 'color 0.2s' }}>
                            {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        @{user.username || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {user.phone || 'No phone'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {user.location_zone_name
                          ? `${user.location_zone_name}${user.location_region_name ? `, ${user.location_region_name}` : ''}`
                          : user.location_region_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.4, alignItems: 'flex-start' }}>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: user.is_active ? '#059669' : '#dc2626',
                          }}
                        />
                        {isLocked(user) && (
                          <Chip
                            icon={<LockedIcon sx={{ fontSize: 12 }} />}
                            label="Locked"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: '#b45309',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              '& .MuiChip-icon': { color: '#b45309', ml: 0.6 },
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    {/* <TableCell>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        {formatDate(user.created_at)}
                      </Typography>
                    </TableCell> */}
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon sx={{ fontSize: 15 }} />}
                          onClick={() => navigate(`/users/${user.id}`)}
                          sx={{
                            color: '#0284c7',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.45,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.15)',
                            },
                          }}
                        >
                          View
                        </Button>

                        <Button
                          size="small"
                          startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                          disabled={isCurrentUser(user.id)}
                          sx={{
                            color: isCurrentUser(user.id) ? '#94a3b8' : '#4f46e5',
                            backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#f5f3ff',
                            border: `1px solid ${isCurrentUser(user.id) ? '#e2e8f0' : '#ede9fe'}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.45,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#ede9fe',
                              color: isCurrentUser(user.id) ? '#94a3b8' : '#4338ca',
                              transform: isCurrentUser(user.id) ? 'none' : 'translateY(-1px)',
                              boxShadow: isCurrentUser(user.id) ? 'none' : '0 2px 4px rgba(79, 70, 229, 0.15)',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f1f5f9',
                              borderColor: '#e2e8f0',
                            },
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="small"
                          startIcon={<PasswordResetIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handlePasswordDialogOpen(user)}
                          disabled={isCurrentUser(user.id)}
                          sx={{
                            color: isCurrentUser(user.id) ? '#94a3b8' : '#7c3aed',
                            backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#f5f3ff',
                            border: `1px solid ${isCurrentUser(user.id) ? '#e2e8f0' : '#ede9fe'}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.45,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#ede9fe',
                              color: isCurrentUser(user.id) ? '#94a3b8' : '#6d28d9',
                              transform: isCurrentUser(user.id) ? 'none' : 'translateY(-1px)',
                              boxShadow: isCurrentUser(user.id) ? 'none' : '0 2px 4px rgba(124, 58, 237, 0.15)',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f1f5f9',
                              borderColor: '#e2e8f0',
                            },
                          }}
                        >
                          Reset Password
                        </Button>

                        <Button
                          size="small"
                          startIcon={user.is_active ? <DeactivateIcon sx={{ fontSize: 15 }} /> : <ActivateIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleToggleDialogOpen(user)}
                          disabled={isCurrentUser(user.id)}
                          sx={{
                            color: isCurrentUser(user.id) ? '#94a3b8' : user.is_active ? '#d97706' : '#059669',
                            backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : user.is_active ? '#fff7ed' : '#ecfdf5',
                            border: `1px solid ${isCurrentUser(user.id) ? '#e2e8f0' : user.is_active ? '#ffedd5' : '#d1fae5'}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.45,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : user.is_active ? '#ffedd5' : '#d1fae5',
                              color: isCurrentUser(user.id) ? '#94a3b8' : user.is_active ? '#b45309' : '#047857',
                              transform: isCurrentUser(user.id) ? 'none' : 'translateY(-1px)',
                              boxShadow: isCurrentUser(user.id)
                                ? 'none'
                                : user.is_active
                                ? '0 2px 4px rgba(217, 119, 6, 0.15)'
                                : '0 2px 4px rgba(5, 150, 105, 0.15)',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f1f5f9',
                              borderColor: '#e2e8f0',
                            },
                          }}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>

                        {isLocked(user) && (
                          <Button
                            size="small"
                            startIcon={<UnlockIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleUnlockDialogOpen(user)}
                            sx={{
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: 1.5,
                              px: 1,
                              py: 0.45,
                              minWidth: 'auto',
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 4px rgba(180, 83, 9, 0.15)',
                              },
                            }}
                          >
                            Unlock
                          </Button>
                        )}

                        <Button
                          size="small"
                          startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleDeleteDialogOpen(user)}
                          disabled={isCurrentUser(user.id)}
                          sx={{
                            color: isCurrentUser(user.id) ? '#94a3b8' : '#dc2626',
                            backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#fef2f2',
                            border: `1px solid ${isCurrentUser(user.id) ? '#e2e8f0' : '#fee2e2'}`,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.45,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: isCurrentUser(user.id) ? '#f1f5f9' : '#fee2e2',
                              color: isCurrentUser(user.id) ? '#94a3b8' : '#b91c1c',
                              transform: isCurrentUser(user.id) ? 'none' : 'translateY(-1px)',
                              boxShadow: isCurrentUser(user.id) ? 'none' : '0 2px 4px rgba(220, 38, 38, 0.15)',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f1f5f9',
                              borderColor: '#e2e8f0',
                            },
                          }}
                        >
                          Delete
                        </Button>
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
          sx={{
            borderTop: '1px solid #e2e8f0',
            '& .MuiTablePagination-selectLabel': { fontSize: '0.8rem', color: '#64748b' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#475569' },
            '& .MuiTablePagination-actions button': { fontSize: '0.8rem' },
          }}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <ConfirmationModal
        open={deleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete user "${selectedUser?.display_name || selectedUser?.email}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Toggle Status Confirmation Dialog */}
      <Dialog
        ref={toggleDialogRef}
        open={toggleDialogOpen}
        onClose={handleToggleDialogClose}
        onEntered={() => toggleDialogRef.current?.focus()}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400, width: '100%' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                backgroundColor: selectedUser?.is_active ? '#fff7ed' : '#ecfdf5',
                border: `1px solid ${selectedUser?.is_active ? '#fed7aa' : '#a7f3d0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selectedUser?.is_active ? (
                <DeactivateIcon sx={{ color: '#f97316', fontSize: 24 }} />
              ) : (
                <ActivateIcon sx={{ color: '#10b981', fontSize: 24 }} />
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {selectedUser?.is_active ? 'Deactivate User' : 'Activate User'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
            {selectedUser?.is_active
              ? `Are you sure you want to deactivate user "${selectedUser?.display_name || selectedUser?.email}"? They will no longer be able to access the system.`
              : `Are you sure you want to activate user "${selectedUser?.display_name || selectedUser?.email}"? They will regain access to the system.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleToggleDialogClose}
            variant="outlined"
            color="inherit"
            disabled={toggleLoading}
            sx={{ borderColor: '#e2e8f0', color: '#475569', fontWeight: 600, borderRadius: 2, flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleToggleConfirm}
            variant="contained"
            disabled={toggleLoading}
            autoFocus
            startIcon={toggleLoading ? <CircularProgress size={18} color="inherit" /> : (selectedUser?.is_active ? <DeactivateIcon /> : <ActivateIcon />)}
            sx={{
              background: selectedUser?.is_active
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              fontWeight: 700,
              borderRadius: 2,
              flex: 1,
              boxShadow: selectedUser?.is_active
                ? '0 4px 12px rgba(245, 158, 11, 0.35)'
                : '0 4px 12px rgba(16, 185, 129, 0.35)',
              '&:hover': {
                background: selectedUser?.is_active
                  ? 'linear-gradient(135deg, #d97706, #b45309)'
                  : 'linear-gradient(135deg, #059669, #047857)',
              },
            }}
          >
            {toggleLoading ? (selectedUser?.is_active ? 'Deactivating...' : 'Activating...') : (selectedUser?.is_active ? 'Deactivate' : 'Activate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlock User Confirmation Dialog */}
      <Dialog
        open={unlockDialogOpen}
        onClose={handleUnlockDialogClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400, width: '100%' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UnlockIcon sx={{ color: '#b45309', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Unlock User
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
            {`Are you sure you want to unlock user "${selectedUser?.display_name || selectedUser?.email}"? This will reset their failed login attempts and restore access immediately.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleUnlockDialogClose}
            variant="outlined"
            color="inherit"
            disabled={unlockLoading}
            sx={{ borderColor: '#e2e8f0', color: '#475569', fontWeight: 600, borderRadius: 2, flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnlockConfirm}
            variant="contained"
            disabled={unlockLoading}
            autoFocus
            startIcon={unlockLoading ? <CircularProgress size={18} color="inherit" /> : <UnlockIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              fontWeight: 700,
              borderRadius: 2,
              flex: 1,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706, #b45309)',
              },
            }}
          >
            {unlockLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 420, width: '100%' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                backgroundColor: '#f5f3ff',
                border: '1px solid #ede9fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PasswordResetIcon sx={{ color: '#7c3aed', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Reset Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#7b8497', fontSize: '0.8rem' }}>
                {selectedUser?.display_name || selectedUser?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 2 }}>
            Set a new password for this user. They will use it to sign in on their next login attempt.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              autoFocus
              error={Boolean(passwordError) && newPassword.length > 0}
              helperText={passwordError && newPassword.length > 0 ? passwordError : 'Minimum 6 characters.'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.85rem',
                },
              }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
              error={Boolean(passwordError) && confirmPassword.length > 0}
              helperText={passwordError && confirmPassword.length > 0 ? passwordError : ' '}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.85rem',
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handlePasswordDialogClose}
            variant="outlined"
            color="inherit"
            disabled={passwordLoading}
            sx={{ borderColor: '#e2e8f0', color: '#475569', fontWeight: 600, borderRadius: 2, flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordReset}
            variant="contained"
            disabled={passwordLoading || !newPassword || Boolean(passwordError)}
            startIcon={passwordLoading ? <CircularProgress size={18} color="inherit" /> : <PasswordResetIcon />}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              fontWeight: 700,
              borderRadius: 2,
              flex: 1,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              },
            }}
          >
            {passwordLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UsersList;