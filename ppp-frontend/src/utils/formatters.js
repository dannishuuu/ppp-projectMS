import dayjs from 'dayjs';

/**
 * Format currency in ETB (Ethiopian Birr) with short human readable options
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'ETB 0';
  
  const num = Number(amount);
  if (compact) {
    if (num >= 1000000000) {
      return `ETB ${(num / 1000000000).toFixed(2)} B`;
    }
    if (num >= 1000000) {
      return `ETB ${(num / 1000000).toFixed(2)} M`;
    }
    if (num >= 1000) {
      return `ETB ${(num / 1000).toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format date consistently
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM DD, YYYY');
};

/**
 * Format date and time consistently
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM DD, YYYY HH:mm');
};

/**
 * Format numbers with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Get status color configuration for MUI Chips
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'signed':
      return { color: 'primary', label: 'Signed', bg: '#e8eaf6', text: '#1a237e' };
    case 'under construction':
    case 'in progress':
      return { color: 'warning', label: 'Under Construction', bg: '#fff3e0', text: '#e65100' };
    case 'operational':
    case 'completed':
      return { color: 'success', label: 'Operational', bg: '#e8f5e9', text: '#2e7d32' };
    case 'procurement':
    case 'tender':
      return { color: 'info', label: 'Procurement', bg: '#e1f5fe', text: '#0277bd' };
    case 'feasibility':
    case 'planning':
      return { color: 'secondary', label: 'Feasibility', bg: '#f3e5f5', text: '#7b1fa2' };
    default:
      return { color: 'default', label: status || 'Unknown', bg: '#f1f5f9', text: '#475569' };
  }
};

/**
 * Contract status (contract_status_enum) display metadata for Chips
 */
const CONTRACT_STATUS_META = {
  DRAFT: { label: 'Draft', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  PENDING: { label: 'Pending', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  ACTIVE: { label: 'Active', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  EXPIRED: { label: 'Expired', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  TERMINATED: { label: 'Terminated', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  CANCELLED: { label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  SUSPENDED: { label: 'Suspended', color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
  RENEWED: { label: 'Renewed', color: '#4338ca', bg: '#e0e7ff', border: '#c7d2fe' },
};

export const contractStatusMeta = (status, isActive) => {
  const key = String(status || (isActive ? 'ACTIVE' : 'DRAFT')).trim().toUpperCase();
  return CONTRACT_STATUS_META[key] || { label: key || 'Draft', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
};
