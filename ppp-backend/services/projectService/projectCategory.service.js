// services/projectService/projectCategory.service.js
const ProjectCategoryModel = require('../../models/projectCategory.model');

class ProjectCategoryService {
  // ─── LIST ─────────────────────────────────────────────────────────────────

  /**
   * Get a paginated, filtered list of project categories.
   * @param {object} options - { page, limit, search, status }
   */
  static async getProjectCategories(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await ProjectCategoryModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      projectCategories: rows,
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
   * Get a single project category by UUID.
   * @param {string} id
   */
  static async getProjectCategoryById(id) {
    const category = await ProjectCategoryModel.findById(id);
    if (!category) {
      const err = new Error('Project category not found.');
      err.status = 404;
      throw err;
    }
    return category;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  /**
   * Create a new project category.
   * @param {object} payload - { name, description, isOnland }
   * @param {string} actorId - Authenticated user ID
   */
  static async createProjectCategory(payload, actorId) {
    const { name, description, isOnland } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Project category name is required.');
      err.status = 400;
      throw err;
    }

    // Uniqueness check
    const existing = await ProjectCategoryModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`A project category named "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const category = await ProjectCategoryModel.create({
      name: name.trim(),
      description: description?.trim() || null,
      isOnland: isOnland !== undefined ? isOnland : null,
      createdBy: actorId,
    });

    return category;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  /**
   * Update an existing project category.
   * @param {string} id
   * @param {object} payload - { name?, description?, isOnland? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateProjectCategory(id, payload, actorId) {
    // Confirm existence
    await this.getProjectCategoryById(id);

    const { name, description, isOnland } = payload;

    if (name && name.trim()) {
      const existing = await ProjectCategoryModel.findByName(name.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`A project category named "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    const updated = await ProjectCategoryModel.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description?.trim() || null : undefined,
      isOnland: isOnland !== undefined ? isOnland : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied to the project category.');
      err.status = 400;
      throw err;
    }

    return this.getProjectCategoryById(id);
  }

  // ─── TOGGLE STATUS ────────────────────────────────────────────────────────

  /**
   * Toggle the is_active flag of a project category.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleProjectCategoryStatus(id, actorId) {
    const category = await this.getProjectCategoryById(id);

    const result = await ProjectCategoryModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle project category status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Project category "${category.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────

  /**
   * Soft-delete a project category.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteProjectCategory(id, actorId) {
    const category = await this.getProjectCategoryById(id);

    await ProjectCategoryModel.softDelete(id, actorId);

    return {
      message: `Project category "${category.name}" has been deleted successfully.`,
    };
  }
}

module.exports = ProjectCategoryService;
