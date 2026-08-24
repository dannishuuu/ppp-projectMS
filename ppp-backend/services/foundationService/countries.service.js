// services/foundationService/countries.service.js
const CountryModel = require('../../models/countries.model');

class CountryService {
  /**
   * Get a paginated, filtered list of countries.
   * @param {object} options - { page, limit, search, status }
   */
  static async getCountries(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    // Map 'status' to 'isActive' expected by the model
    let isActive = null;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    const { rows, total } = await CountryModel.findAll({
      limit,
      offset,
      search,
      isActive,
    });

    return {
      countries: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single country by UUID.
   * @param {string} id
   */
  static async getCountryById(id) {
    const country = await CountryModel.findById(id);
    if (!country) {
      const err = new Error('Country not found.');
      err.status = 404;
      throw err;
    }
    return country;
  }

  /**
   * Create a new country.
   * @param {object} payload - { name, code }
   * @param {string} actorId - Authenticated user ID
   */
  static async createCountry(payload, actorId) {
    const { name, code } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Country name is required.');
      err.status = 400;
      throw err;
    }

    // Uniqueness check by name
    const existing = await CountryModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`A country with name "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const country = await CountryModel.create({
      name: name.trim(),
      code: code?.trim() || null,
      createdBy: actorId,
    });

    return country;
  }

  /**
   * Update an existing country.
   * @param {string} id
   * @param {object} payload - { name?, code? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateCountry(id, payload, actorId) {
    await this.getCountryById(id);

    const { name, code } = payload;

    if (name && name.trim()) {
      const existing = await CountryModel.findByName(name.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`A country with name "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await CountryModel.update(id, {
      name: name ? name.trim() : undefined,
      code: code !== undefined ? (code ? code.trim() : null) : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return this.getCountryById(id);
  }

  /**
   * Toggle the active status of a country.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleCountryStatus(id, actorId) {
    const country = await this.getCountryById(id);

    // Toggle the boolean is_active status
    const result = await CountryModel.update(id, {
      isActive: !country.is_active,
      updatedBy: actorId,
    });

    if (!result) {
      const err = new Error('Failed to toggle status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Country "${country.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  /**
   * Soft delete a country.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteCountry(id, actorId) {
    const country = await this.getCountryById(id);

    // Prevent deletion if the country still has active regions tied to it
    const hasRegions = await CountryModel.hasRegions(id);
    if (hasRegions) {
      const err = new Error(`Cannot delete country "${country.name}" because it has active regions assigned to it.`);
      err.status = 409; // Conflict
      throw err;
    }

    await CountryModel.softDelete(id, actorId);

    return {
      message: `Country "${country.name}" has been deleted successfully.`,
    };
  }
}

module.exports = CountryService;