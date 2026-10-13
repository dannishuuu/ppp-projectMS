// services/moduleRolePermissionService/permission.service.js
const PermissionModel = require('../../models/permission.model');
const ModuleModel = require('../../models/module.model');
const ActionModel = require('../../models/action.model');

class PermissionService {
  /**
   * Get a paginated, filtered list of permissions.
   * @param {object} options - { page, limit, search, moduleId, status }
   */
  static async getPermissions(options = {}) {
    const { page = 1, limit = 200, search = '', moduleId = null, status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await PermissionModel.findAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      search,
      moduleId,
      status,
    });

    return {
      permissions: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single permission by ID.
   * @param {string} id
   */
  static async getPermissionById(id) {
    const permission = await PermissionModel.findById(id);
    if (!permission) {
      const err = new Error('Permission not found.');
      err.status = 404;
      throw err;
    }
    return permission;
  }

  /**
   * Get all active permissions grouped by module.
   * Used directly by the frontend to render the Role-Permission matrix checkbox grid.
   */
  static async getPermissionsGroupedByModule() {
    const grouped = await PermissionModel.findAllGroupedByModule();
    return grouped;
  }

  /**
   * Create a new permission.
   * @param {object} payload - { moduleId, actionId, code, name, description, isActive }
   * @param {string} actorId
   */
  static async createPermission(payload, actorId = null) {
    const moduleId = payload.moduleId || payload.module_id;
    const actionId = payload.actionId || payload.action_id;
    const { description, isActive, is_active } = payload;

    if (!moduleId) {
      const err = new Error('Module ID is required.');
      err.status = 400;
      throw err;
    }

    if (!actionId) {
      const err = new Error('Action ID is required.');
      err.status = 400;
      throw err;
    }

    const mod = await ModuleModel.findById(moduleId);
    if (!mod) {
      const err = new Error('Selected module does not exist.');
      err.status = 404;
      throw err;
    }

    const act = await ActionModel.findById(actionId);
    if (!act) {
      const err = new Error('Selected action does not exist.');
      err.status = 404;
      throw err;
    }

    // Check if (module_id, action_id) pair already exists
    const existingPair = await PermissionModel.findByModuleAndAction(moduleId, actionId);
    if (existingPair) {
      const err = new Error(`Permission for "${mod.name}" and action "${act.name}" already exists.`);
      err.status = 409;
      throw err;
    }

    // Auto-derive code if not provided: e.g. "project.create"
    const code = (payload.code && payload.code.trim())
      ? payload.code.trim().toLowerCase()
      : `${mod.code}.${act.code}`.toLowerCase();

    // Check code uniqueness
    const existingCode = await PermissionModel.findByCode(code);
    if (existingCode) {
      const err = new Error(`Permission with code "${code}" already exists.`);
      err.status = 409;
      throw err;
    }

    // Auto-derive name if not provided: e.g. "Create Projects"
    const name = (payload.name && payload.name.trim())
      ? payload.name.trim()
      : `${act.name} ${mod.name}`;

    const created = await PermissionModel.create(
      {
        moduleId,
        actionId,
        code,
        name,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true),
      },
      actorId
    );

    return this.getPermissionById(created.id);
  }

  /**
   * Batch auto-generate permissions for a module across multiple action IDs.
   * @param {string} moduleId
   * @param {string[]} actionIds
   * @param {string} actorId
   */
  static async batchGenerateForModule(moduleId, actionIds = [], actorId = null) {
    const mod = await ModuleModel.findById(moduleId);
    if (!mod) {
      const err = new Error('Module not found.');
      err.status = 404;
      throw err;
    }

    const results = [];
    for (const actionId of actionIds) {
      const act = await ActionModel.findById(actionId);
      if (!act) continue;

      const existingPair = await PermissionModel.findByModuleAndAction(moduleId, actionId);
      if (existingPair) continue;

      const code = `${mod.code}.${act.code}`.toLowerCase();
      const existingCode = await PermissionModel.findByCode(code);
      if (existingCode) continue;

      const name = `${act.name} ${mod.name}`;
      const created = await PermissionModel.create(
        {
          moduleId,
          actionId,
          code,
          name,
          description: `Allows user to ${act.name.toLowerCase()} ${mod.name.toLowerCase()}`,
          isActive: true,
        },
        actorId
      );
      results.push(created);
    }

    return results;
  }

  /**
   * Update an existing permission.
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updatePermission(id, payload, actorId = null) {
    const existing = await this.getPermissionById(id);

    const { name, description, isActive, is_active } = payload;

    await PermissionModel.update(
      id,
      {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description?.trim() : existing.description,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : existing.is_active),
      },
      actorId
    );

    return this.getPermissionById(id);
  }

  /**
   * Toggle permission status.
   * @param {string} id
   * @param {string} actorId
   */
  static async togglePermissionStatus(id, actorId = null) {
    const permission = await this.getPermissionById(id);
    const newStatus = !permission.is_active;

    await PermissionModel.update(id, { isActive: newStatus }, actorId);
    return this.getPermissionById(id);
  }

  /**
   * Soft-delete a permission.
   * @param {string} id
   * @param {string} actorId
   */
  static async deletePermission(id, actorId = null) {
    await this.getPermissionById(id);
    await PermissionModel.softDelete(id, actorId);
    return { success: true, message: 'Permission deleted successfully.' };
  }
}

module.exports = PermissionService;
