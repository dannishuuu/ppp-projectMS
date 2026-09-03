import { apiClient } from '../../utils/apiClient';

const CONTRACTS_BASE = '/rental-contracts';
const PAYMENTS_BASE = '/rental-payments';

/**
 * Rental Contract API Service
 */
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
    return response.data;
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
    const response = await apiClient.post(CONTRACTS_BASE, payload);
    return response.data;
  },

  /**
   * Update an existing rental contract
   */
  async updateContract(id, payload) {
    const response = await apiClient.put(`${CONTRACTS_BASE}/${id}`, payload);
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
    return response.data;
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
