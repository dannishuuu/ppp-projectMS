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
