// services/foundationService/projectStatus.service.js
const ProjectStatusModel = require('../../models/projectStatus.model');

class ProjectStatusService {
  /**
   * Get a paginated, filtered list of project statuses.
   * @param {object} options - { page, limit, search, status }
   */
  static async getProjectStatuses(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await ProjectStatusModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      projectStatuses: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single project status by UUID.
   * @param {string} id
   */
  static async getProjectStatusById(id) {
    const status = await ProjectStatusModel.findById(id);
    if (!status) {
      const err = new Error('Project status not found.');
      err.status = 404;
      throw err;
    }
    return status;
  }

  /**
   * Create a new project status.
   * @param {object} payload - { name, description }
   * @param {string} actorId - Authenticated user ID
   */
  static async createProjectStatus(payload, actorId) {
    const { name, description } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Project status name is required.');
      err.status = 400;
      throw err;
    }

    const existing = await ProjectStatusModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`A project status with name "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    return ProjectStatusModel.create({
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: actorId,
    });
  }

  /**
   * Update an existing project status.
   * @param {string} id
   * @param {object} payload - { name?, description? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateProjectStatus(id, payload, actorId) {
    await this.getProjectStatusById(id);

    const { name, description } = payload;

    if (name && name.trim()) {
      const existing = await ProjectStatusModel.findByName(name.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`A project status with name "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await ProjectStatusModel.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description?.trim() || null : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return this.getProjectStatusById(id);
  }

  /**
   * Toggle the active status of a project status.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleProjectStatus(id, actorId) {
    const statusRecord = await this.getProjectStatusById(id);

    const result = await ProjectStatusModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Project status "${statusRecord.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  /**
   * Soft delete a project status.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteProjectStatus(id, actorId) {
    const statusRecord = await this.getProjectStatusById(id);

    await ProjectStatusModel.softDelete(id, actorId);

    return {
      message: `Project status "${statusRecord.name}" has been deleted successfully.`,
    };
  }
}

module.exports = ProjectStatusService;
