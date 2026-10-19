// services/foundationService/organizationDocumentTypes.service.js
const OrganizationDocumentTypesModel = require('../../models/organizationDocumentTypes.model');

class OrganizationDocumentTypesService {
  /**
   * Get a paginated, filtered list of organization document types.
   * @param {object} options - { page, limit, search, status }
   */
  static async getOrganizationDocumentTypes(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await OrganizationDocumentTypesModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      organizationDocumentTypes: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single organization document type by UUID.
   * @param {string} id
   */
  static async getOrganizationDocumentTypeById(id) {
    const docType = await OrganizationDocumentTypesModel.findById(id);
    if (!docType) {
      const err = new Error('Organization document type not found.');
      err.status = 404;
      throw err;
    }
    return docType;
  }

  /**
   * Create a new organization document type.
   * @param {object} payload - { name, code, description?, isRequired?, requiresExpiry? }
   * @param {string} actorId - Authenticated user ID
   */
  static async createOrganizationDocumentType(payload, actorId) {
    const { name, code, description, isRequired, requiresExpiry } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Organization document type name is required.');
      err.status = 400;
      throw err;
    }
    if (!code || !code.trim()) {
      const err = new Error('Organization document type code is required.');
      err.status = 400;
      throw err;
    }

    const existingByName = await OrganizationDocumentTypesModel.findByName(name.trim());
    if (existingByName) {
      const err = new Error(`An organization document type with name "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const existingByCode = await OrganizationDocumentTypesModel.findByCode(code.trim());
    if (existingByCode) {
      const err = new Error(`An organization document type with code "${code.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    return OrganizationDocumentTypesModel.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      isRequired: isRequired === true,
      requiresExpiry: requiresExpiry === true,
      createdBy: actorId,
    });
  }

  /**
   * Update an existing organization document type.
   * @param {string} id
   * @param {object} payload - { name?, code?, description?, isRequired?, requiresExpiry? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateOrganizationDocumentType(id, payload, actorId) {
    await this.getOrganizationDocumentTypeById(id);

    const { name, code, description, isRequired, requiresExpiry } = payload;

    if (name && name.trim()) {
      const existingByName = await OrganizationDocumentTypesModel.findByName(name.trim());
      if (existingByName && existingByName.id !== id) {
        const err = new Error(`An organization document type with name "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    if (code && code.trim()) {
      const existingByCode = await OrganizationDocumentTypesModel.findByCode(code.trim());
      if (existingByCode && existingByCode.id !== id) {
        const err = new Error(`An organization document type with code "${code.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await OrganizationDocumentTypesModel.update(id, {
      name: name !== undefined ? (name ? name.trim() : undefined) : undefined,
      code: code !== undefined ? (code ? code.trim().toUpperCase() : undefined) : undefined,
      description: description !== undefined ? description?.trim() || null : undefined,
      isRequired,
      requiresExpiry,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return this.getOrganizationDocumentTypeById(id);
  }

  /**
   * Toggle the active status of an organization document type.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleOrganizationDocumentType(id, actorId) {
    const docType = await this.getOrganizationDocumentTypeById(id);

    const result = await OrganizationDocumentTypesModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Organization document type "${docType.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  /**
   * Soft delete an organization document type.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteOrganizationDocumentType(id, actorId) {
    const docType = await this.getOrganizationDocumentTypeById(id);

    await OrganizationDocumentTypesModel.softDelete(id, actorId);

    return {
      message: `Organization document type "${docType.name}" has been deleted successfully.`,
    };
  }
}

module.exports = OrganizationDocumentTypesService;
