// services/moduleRolePermissionService/action.service.js
const ActionModel = require('../../models/action.model');

class ActionService {
  /**
   * Get a paginated, filtered list of actions.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  static async getActions(options = {}) {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await ActionModel.findAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      search,
      status,
      sortBy,
    });

    return {
      actions: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get an action by ID.
   * @param {string} id
   */
  static async getActionById(id) {
    const action = await ActionModel.findById(id);
    if (!action) {
      const err = new Error('Action not found.');
      err.status = 404;
      throw err;
    }
    return action;
  }

  /**
   * Create a new action.
   * @param {object} payload - { name, code, description, isActive }
   * @param {string} actorId
   */
  static async createAction(payload, actorId = null) {
    const { name, code, description, isActive, is_active } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Action name is required.');
      err.status = 400;
      throw err;
    }

    if (!code || !code.trim()) {
      const err = new Error('Action code is required.');
      err.status = 400;
      throw err;
    }

    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check code uniqueness
    const existing = await ActionModel.findByCode(cleanCode);
    if (existing) {
      const err = new Error(`Action with code "${cleanCode}" already exists.`);
      err.status = 409;
      throw err;
    }

    const created = await ActionModel.create(
      {
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true),
      },
      actorId
    );

    return this.getActionById(created.id);
  }

  /**
   * Update an existing action.
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updateAction(id, payload, actorId = null) {
    const existing = await this.getActionById(id);

    const { name, code, description, isActive, is_active } = payload;

    let cleanCode = undefined;
    if (code) {
      cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const conflict = await ActionModel.findByCode(cleanCode, id);
      if (conflict) {
        const err = new Error(`Action with code "${cleanCode}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    await ActionModel.update(
      id,
      {
        name: name !== undefined ? name.trim() : existing.name,
        code: cleanCode !== undefined ? cleanCode : existing.code,
        description: description !== undefined ? description?.trim() : existing.description,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : existing.is_active),
      },
      actorId
    );

    return this.getActionById(id);
  }

  /**
   * Toggle action status (active / inactive).
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleActionStatus(id, actorId = null) {
    const action = await this.getActionById(id);
    const newStatus = !action.is_active;

    await ActionModel.update(id, { isActive: newStatus }, actorId);
    return this.getActionById(id);
  }

  /**
   * Soft-delete an action.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteAction(id, actorId = null) {
    await this.getActionById(id);
    await ActionModel.softDelete(id, actorId);
    return { success: true, message: 'Action deleted successfully.' };
  }
}

module.exports = ActionService;
