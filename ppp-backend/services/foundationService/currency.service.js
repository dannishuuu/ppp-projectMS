// services/foundationService/currency.service.js
const CurrencyModel = require('../../models/currency.model');

class CurrencyService {
  /**
   * Get a paginated, filtered list of currencies.
   * @param {object} options - { page, limit, search, status }
   */
  static async getCurrencies(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await CurrencyModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      currencies: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single currency by UUID.
   * @param {string} id
   */
  static async getCurrencyById(id) {
    const currency = await CurrencyModel.findById(id);
    if (!currency) {
      const err = new Error('Currency not found.');
      err.status = 404;
      throw err;
    }
    return currency;
  }

  /**
   * Create a new currency.
   * @param {object} payload - { code, name, symbol }
   * @param {string} actorId - Authenticated user ID
   */
  static async createCurrency(payload, actorId) {
    const { code, name, symbol } = payload;

    if (!code || !code.trim()) {
      const err = new Error('Currency code is required.');
      err.status = 400;
      throw err;
    }

    if (!name || !name.trim()) {
      const err = new Error('Currency name is required.');
      err.status = 400;
      throw err;
    }

    // Uniqueness check by code
    const existing = await CurrencyModel.findByCode(code.trim());
    if (existing) {
      const err = new Error(`A currency with code "${code.trim().toUpperCase()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const currency = await CurrencyModel.create({
      code: code.trim(),
      name: name.trim(),
      symbol: symbol?.trim() || null,
      createdBy: actorId,
    });

    return currency;
  }

  /**
   * Update an existing currency.
   * @param {string} id
   * @param {object} payload - { code?, name?, symbol? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateCurrency(id, payload, actorId) {
    await this.getCurrencyById(id);

    const { code, name, symbol } = payload;

    if (code && code.trim()) {
      const existing = await CurrencyModel.findByCode(code.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`A currency with code "${code.trim().toUpperCase()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await CurrencyModel.update(id, {
      code: code ? code.trim() : undefined,
      name: name ? name.trim() : undefined,
      symbol: symbol !== undefined ? symbol?.trim() || null : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return this.getCurrencyById(id);
  }

  /**
   * Toggle the active status of a currency.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleCurrencyStatus(id, actorId) {
    const currency = await this.getCurrencyById(id);

    const result = await CurrencyModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Currency "${currency.code}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  /**
   * Soft delete a currency.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteCurrency(id, actorId) {
    const currency = await this.getCurrencyById(id);

    await CurrencyModel.softDelete(id, actorId);

    return {
      message: `Currency "${currency.code}" has been deleted successfully.`,
    };
  }
}

module.exports = CurrencyService;
