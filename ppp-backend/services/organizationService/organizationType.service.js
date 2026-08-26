// services/organizationService/organizationType.service.js
const OrganizationTypeModel = require('../../models/organizationType.model');

class OrganizationTypeService {
  // ─── LIST ─────────────────────────────────────────────────────────────────

  /**
   * Get a paginated, filtered list of organization types.
   * @param {object} options - { page, limit, search, status }
   */
  static async getOrganizationTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await OrganizationTypeModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      organizationTypes: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  /**
   * Get a single organization type by its UUID.
   * @param {string} id
   */
  static async getOrganizationTypeById(id) {
    const orgType = await OrganizationTypeModel.findById(id);
    if (!orgType) {
      const err = new Error('Organization type not found.');
      err.status = 404;
      throw err;
    }
    return orgType;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  /**
   * Create a new organization type.
   * @param {object} payload  - { name, orgTypeCode, org_type_code, description }
   * @param {string} actorId  - ID of the authenticated user performing the action
   */
  static async createOrganizationType(payload, actorId) {
    const { name, orgTypeCode, org_type_code, description } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Organization type name is required.');
      err.status = 400;
      throw err;
    }

    const code = (orgTypeCode || org_type_code)
      ? (orgTypeCode || org_type_code).trim().toUpperCase().replace(/\s+/g, '')
      : null;

    // Uniqueness check by name
    const existing = await OrganizationTypeModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`An organization type named "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    // Uniqueness check by code
    if (code) {
      const existingCode = await OrganizationTypeModel.findByCode(code);
      if (existingCode) {
        const err = new Error(`An organization type with code "${code}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const orgType = await OrganizationTypeModel.create({
      name: name.trim(),
      orgTypeCode: code,
      description: description?.trim() || null,
      createdBy: actorId,
    });

    return this.getOrganizationTypeById(orgType.id);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  /**
   * Update an existing organization type.
   * @param {string} id
   * @param {object} payload  - { name?, orgTypeCode?, org_type_code?, description? }
   * @param {string} actorId  - ID of the authenticated user performing the action
   */
  static async updateOrganizationType(id, payload, actorId) {
    // Confirm it exists first
    await this.getOrganizationTypeById(id);

    const { name, orgTypeCode, org_type_code, description } = payload;
    const rawCode = orgTypeCode !== undefined ? orgTypeCode : org_type_code;
    const code = rawCode !== undefined
      ? (rawCode ? rawCode.trim().toUpperCase().replace(/\s+/g, '') : null)
      : undefined;

    // If renaming, check uniqueness against other records
    if (name && name.trim()) {
      const existing = await OrganizationTypeModel.findByName(name.trim(), id);
      if (existing) {
        const err = new Error(`An organization type named "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    if (code) {
      const existingCode = await OrganizationTypeModel.findByCode(code, id);
      if (existingCode) {
        const err = new Error(`An organization type with code "${code}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await OrganizationTypeModel.update(id, {
      name: name ? name.trim() : undefined,
      orgTypeCode: code,
      description: description !== undefined ? description?.trim() || null : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied to the organization type.');
      err.status = 400;
      throw err;
    }

    return this.getOrganizationTypeById(id);
  }

  // ─── TOGGLE STATUS ────────────────────────────────────────────────────────

  /**
   * Toggle the is_active flag of an organization type.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleOrganizationTypeStatus(id, actorId) {
    // Confirm it exists
    const orgType = await this.getOrganizationTypeById(id);

    const result = await OrganizationTypeModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle organization type status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Organization type "${orgType.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────

  /**
   * Soft-delete an organization type (sets is_deleted = true).
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteOrganizationType(id, actorId) {
    // Confirm it exists
    const orgType = await this.getOrganizationTypeById(id);

    await OrganizationTypeModel.softDelete(id, actorId);

    return {
      message: `Organization type "${orgType.name}" has been deleted successfully.`,
    };
  }
}

module.exports = OrganizationTypeService;
