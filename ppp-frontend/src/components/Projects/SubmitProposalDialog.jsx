// components/Projects/SubmitProposalDialog.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Divider,
  Checkbox, Avatar, Chip, CircularProgress, Alert,
  InputAdornment, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as AddReviewerIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Cancel as RemoveIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { userService } from '../../services/userServices/userServices';

/**
 * SubmitProposalDialog
 * Shows a reviewer-picker table and optional due date before submitting.
 * Props:
 *  - open        {boolean}
 *  - proposal    {object}   - the selected proposal object
 *  - onClose     {function} - called when dialog is dismissed
 *  - onConfirm   {function(reviewerIds: string[], dueDate: string|null)} - called with confirmed data
 *  - loading     {boolean}  - shows spinner on the submit button
 */
export const SubmitProposalDialog = ({ open, proposal, onClose, onConfirm, loading }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load active users when dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setDueDate('');
    setSearch('');
    setErrorMsg('');

    const load = async () => {
      setLoadingUsers(true);
      try {
        const res = await userService.getUsers({ limit: 200, status: 'active' });
        setUsers(res.users || res || []);
      } catch {
        setErrorMsg('Failed to load user list.');
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id)),
    [users, selectedIds]
  );

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least one reviewer.');
      return;
    }
    onConfirm(selectedIds, dueDate || null);
  };

  const getInitials = (u) =>
    `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || u.username?.[0]?.toUpperCase() || '?';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Title */}
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38, height: 38, borderRadius: 2,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <SendIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Submit Proposal for Review
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                {proposal?.proposed_project_name}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        <Box sx={{ display: 'flex', height: 420 }}>
          {/* Left: user picker */}
          <Box sx={{ flex: 1, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Reviewers
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, username or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem', backgroundColor: '#f8fafc' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                  <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8', pt: 4, fontSize: '0.82rem' }}>
                  No users found
                </Typography>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', py: 0.8, backgroundColor: '#f8fafc', width: 40 }} />
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', py: 0.8, backgroundColor: '#f8fafc' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569', py: 0.8, backgroundColor: '#f8fafc' }}>Username</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const checked = selectedIds.includes(u.id);
                      return (
                        <TableRow
                          key={u.id}
                          hover
                          onClick={() => toggleUser(u.id)}
                          sx={{ cursor: 'pointer', backgroundColor: checked ? 'rgba(79,70,229,0.05)' : 'transparent' }}
                        >
                          <TableCell sx={{ py: 0.6, pl: 1 }}>
                            <Checkbox
                              size="small"
                              checked={checked}
                              sx={{ p: 0, color: '#cbd5e1', '&.Mui-checked': { color: '#4f46e5' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#4f46e5' }}>
                                {getInitials(u)}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                                {u.first_name} {u.last_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0.6 }}>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              @{u.username || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>

          {/* Right: summary + due date */}
          <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', px: 2.5, pt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
              Selected ({selectedIds.length})
            </Typography>

            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
              {selectedUsers.length === 0 ? (
                <Box
                  sx={{
                    border: '2px dashed #e2e8f0', borderRadius: 2, p: 2.5,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  }}
                >
                  <PersonIcon sx={{ color: '#cbd5e1', fontSize: 32 }} />
                  <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                    No reviewers selected yet. Pick from the list.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {selectedUsers.map((u) => (
                    <Box
                      key={u.id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        p: '6px 10px', borderRadius: 2,
                        border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                      }}
                    >
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: '#4f46e5' }}>
                        {getInitials(u)}
                      </Avatar>
                      <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: '#0f172a', fontSize: '0.75rem' }} noWrap>
                        {u.first_name} {u.last_name}
                      </Typography>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => toggleUser(u.id)} sx={{ p: 0.2, color: '#94a3b8', '&:hover': { color: '#dc2626' } }}>
                          <RemoveIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Due date */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              Due Date (Optional)
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, color: '#64748b', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || selectedIds.length === 0}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
          sx={{
            borderRadius: 2, fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)' },
            '&:disabled': { opacity: 0.6 },
          }}
        >
          {loading ? 'Submitting…' : `Submit with ${selectedIds.length} Reviewer${selectedIds.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitProposalDialog;
