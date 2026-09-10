import { apiClient } from '../../utils/apiClient';

const CONTRACTS_BASE = '/rental-contracts';
const PAYMENTS_BASE = '/rental-payments';

/**
 * Rental Contract API Service
 */

// Grace period: whole number of months (no decimals). Missing/empty values default to 0.
const normalizeGracePeriod = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return 0;
  const str = String(value).trim();
  if (!/^\d+$/.test(str)) return 0;
  return parseInt(str, 10);
};

export const rentalContractService = {
  /**
   * Get paginated rental contracts with optional filters
   */
  async getContracts(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      buildingId,
      floorId,
      unitId,
      tenantOrganizationId,
      rentalPaymentTypeId,
      paymentTimingId,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status,
      sortBy,
      sortOrder,
    });

    if (buildingId) params.append('buildingId', buildingId);
    if (floorId) params.append('floorId', floorId);
    if (unitId) params.append('unitId', unitId);
    if (tenantOrganizationId) params.append('tenantOrganizationId', tenantOrganizationId);
    if (rentalPaymentTypeId) params.append('rentalPaymentTypeId', rentalPaymentTypeId);
    if (paymentTimingId) params.append('paymentTimingId', paymentTimingId);

    const response = await apiClient.get(`${CONTRACTS_BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get summary metrics for rental contracts (total, active, monthly revenue, etc.)
   */
  async getContractSummary() {
    const response = await apiClient.get(`${CONTRACTS_BASE}/summary`);
    const raw = response?.data ?? response ?? {};
    return {
      totalContracts: Number(raw.total_contracts ?? raw.totalContracts ?? 0),
      activeContracts: Number(raw.active_contracts ?? raw.activeContracts ?? 0),
      inactiveContracts: Number(raw.inactive_contracts ?? raw.inactiveContracts ?? 0),
      totalMonthlyRevenue: Number(raw.monthly_rent_revenue ?? raw.totalMonthlyRevenue ?? 0),
      // Actual income collected: sum of rental_payments.amount_paid whose payment_date
      // falls inside the current calendar month of the system date
      monthlyIncome: Number(raw.monthly_income ?? raw.monthlyIncome ?? 0),
      // Overdue outstanding: sum of (amount_due - amount_paid) for installments whose
      // due_date is today or passed, not marked paid, with a non-zero remaining balance
      monthlyOverdue: Number(raw.monthly_overdue ?? raw.monthlyOverdue ?? 0),
      rentedUnitsCount: Number(raw.rented_units_count ?? raw.rentedUnitsCount ?? 0),
    };
  },

  /**
   * Get single contract by ID with associated payments
   */
  async getContractById(id) {
    const response = await apiClient.get(`${CONTRACTS_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a new rental contract
   */
  async createContract(payload) {
    const body = { ...payload, gracePeriod: normalizeGracePeriod(payload.gracePeriod) };
    const response = await apiClient.post(CONTRACTS_BASE, body);
    return response.data;
  },

  /**
   * Update an existing rental contract
   */
  async updateContract(id, payload) {
    const body = { ...payload, gracePeriod: normalizeGracePeriod(payload.gracePeriod) };
    const response = await apiClient.put(`${CONTRACTS_BASE}/${id}`, body);
    return response.data;
  },

  /**
   * Toggle active/inactive status of a rental contract
   */
  async toggleContractStatus(id) {
    const response = await apiClient.patch(`${CONTRACTS_BASE}/${id}/toggle-status`, {});
    return response.data;
  },

  /**
   * Soft delete a rental contract and its schedules
   */
  async deleteContract(id) {
    const response = await apiClient.delete(`${CONTRACTS_BASE}/${id}`);
    return response.data;
  },

  /**
   * Get all payments and schedules for a specific contract
   */
  async getContractPayments(contractId) {
    const response = await apiClient.get(`${CONTRACTS_BASE}/${contractId}/payments`);
    return response.data;
  },

  /**
   * Generate or extend payment schedules for a contract
   */
  async generateSchedule(contractId) {
    const response = await apiClient.post(`${CONTRACTS_BASE}/${contractId}/generate-schedule`, {});
    return response.data;
  },
};

/**
 * Rental Payments API Service
 */
export const rentalPaymentsService = {
  /**
   * Get paginated rental payment records and schedules
   */
  async getPayments(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      isPaid,
      rentalContractId,
      buildingId,
      tenantOrganizationId,
      dueFromDate,
      dueToDate,
      sortBy = 'due_date',
      sortOrder = 'ASC',
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sortBy,
      sortOrder,
    });

    if (isPaid !== undefined && isPaid !== null && isPaid !== '') {
      params.append('isPaid', isPaid.toString());
    }
    if (rentalContractId) params.append('rentalContractId', rentalContractId);
    if (buildingId) params.append('buildingId', buildingId);
    if (tenantOrganizationId) params.append('tenantOrganizationId', tenantOrganizationId);
    if (dueFromDate) params.append('dueFromDate', dueFromDate);
    if (dueToDate) params.append('dueToDate', dueToDate);

    const response = await apiClient.get(`${PAYMENTS_BASE}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get payment statistics (total due, paid, outstanding, overdue)
   */
  async getPaymentStats(options = {}) {
    const params = new URLSearchParams();
    if (options.buildingId) params.append('buildingId', options.buildingId);
    if (options.rentalContractId) params.append('rentalContractId', options.rentalContractId);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${PAYMENTS_BASE}/stats${queryStr}`);
    const raw = response?.data ?? response ?? {};
    return {
      totalPayments: Number(raw.total_payments ?? raw.totalPayments ?? 0),
      paidCount: Number(raw.paid_count ?? raw.paidCount ?? 0),
      unpaidCount: Number(raw.unpaid_count ?? raw.unpaidCount ?? 0),
      // Overdue follows the contract-list logic: unpaid installments due today or earlier with a
      // non-zero remaining balance on active contracts
      overdueCount: Number(raw.overdue_count ?? raw.overdueCount ?? 0),
      totalOverdue: Number(raw.total_overdue ?? raw.totalOverdue ?? 0),
      totalAmountDue: Number(raw.total_amount_due ?? raw.totalAmountDue ?? 0),
      totalAmountPaid: Number(raw.total_amount_paid ?? raw.totalAmountPaid ?? 0),
      totalOutstanding: Number(raw.total_outstanding ?? raw.totalOutstanding ?? 0),
    };
  },

  /**
   * Get a single payment schedule by ID
   */
  async getPaymentById(id) {
    const response = await apiClient.get(`${PAYMENTS_BASE}/${id}`);
    return response.data;
  },

  /**
   * Create a manual payment schedule
   */
  async createPayment(payload) {
    const response = await apiClient.post(PAYMENTS_BASE, payload);
    return response.data;
  },

  /**
   * Update payment schedule details
   */
  async updatePayment(id, payload) {
    const response = await apiClient.put(`${PAYMENTS_BASE}/${id}`, payload);
    return response.data;
  },

  /**
   * Record a payment against an existing schedule
   */
  async recordPayment(id, payload) {
    const response = await apiClient.patch(`${PAYMENTS_BASE}/${id}/pay`, payload);
    return response.data;
  },

  /**
   * Delete a payment schedule record
   */
  async deletePayment(id) {
    const response = await apiClient.delete(`${PAYMENTS_BASE}/${id}`);
    return response.data;
  },
};

export default rentalContractService;
