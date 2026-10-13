// services/moduleRolePermissionService/role.service.js
const RoleModel = require('../../models/role.model');
const RolePermissionModel = require('../../models/rolePermission.model');

class RoleService {
  /**
   * Get a paginated, filtered list of roles.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  static async getRoles(options = {}) {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await RoleModel.findAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      search,
      status,
      sortBy,
    });

    return {
      roles: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single role by ID with its full list of assigned permissions.
   * @param {string} id
   */
  static async getRoleById(id) {
    const role = await RoleModel.findById(id);
    if (!role) {
      const err = new Error('Role not found.');
      err.status = 404;
      throw err;
    }
    return role;
  }

  /**
   * Create a new role, with optional initial permission assignments.
   * @param {object} payload - { name, code, description, isSystem, isActive, permissionIds }
   * @param {string} actorId
   */
  static async createRole(payload, actorId = null) {
    const { name, code, description, isSystem, is_system, isActive, is_active, permissionIds } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Role name is required.');
      err.status = 400;
      throw err;
    }

    if (!code || !code.trim()) {
      const err = new Error('Role code is required.');
      err.status = 400;
      throw err;
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Check uniqueness
    const existingCode = await RoleModel.findByCode(cleanCode);
    if (existingCode) {
      const err = new Error(`Role with code "${cleanCode}" already exists.`);
      err.status = 409;
      throw err;
    }

    const existingName = await RoleModel.findByName(name.trim());
    if (existingName) {
      const err = new Error(`Role with name "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const created = await RoleModel.create(
      {
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
        isSystem: isSystem !== undefined ? isSystem : (is_system || false),
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true),
      },
      actorId
    );

    // If initial permissions are passed, sync them
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      await RolePermissionModel.syncRolePermissions(created.id, permissionIds, actorId);
    }

    return this.getRoleById(created.id);
  }

  /**
   * Update an existing role and optionally sync its permissions.
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updateRole(id, payload, actorId = null) {
    const existing = await this.getRoleById(id);

    const { name, description, isActive, is_active, permissionIds } = payload;

    if (name) {
      const conflictName = await RoleModel.findByName(name.trim(), id);
      if (conflictName) {
        const err = new Error(`Role with name "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    await RoleModel.update(
      id,
      {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description?.trim() : existing.description,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : existing.is_active),
      },
      actorId
    );

    // If permissionIds array is supplied, sync role permissions
    if (Array.isArray(permissionIds)) {
      await RolePermissionModel.syncRolePermissions(id, permissionIds, actorId);
    }

    return this.getRoleById(id);
  }

  /**
   * Toggle role status (active / inactive).
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleRoleStatus(id, actorId = null) {
    const role = await this.getRoleById(id);

    if (role.is_system) {
      const err = new Error('System-defined roles cannot be deactivated.');
      err.status = 400;
      throw err;
    }

    const newStatus = !role.is_active;
    await RoleModel.update(id, { isActive: newStatus }, actorId);
    return this.getRoleById(id);
  }

  /**
   * Soft-delete a custom role.
   * System-defined roles (is_system = true) are protected and cannot be deleted.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteRole(id, actorId = null) {
    const role = await this.getRoleById(id);

    if (role.is_system) {
      const err = new Error('System-defined roles cannot be deleted.');
      err.status = 403;
      throw err;
    }

    await RoleModel.softDelete(id, actorId);
    return { success: true, message: `Role "${role.name}" deleted successfully.` };
  }

  /**
   * Get all active permissions for a specific role.
   * @param {string} roleId
   */
  static async getRolePermissions(roleId) {
    await this.getRoleById(roleId);
    return RolePermissionModel.findByRoleId(roleId);
  }

  /**
   * Assign / replace permissions for a role.
   * @param {string} roleId
   * @param {string[]} permissionIds
   * @param {string} actorId
   */
  static async assignPermissions(roleId, permissionIds = [], actorId = null) {
    await this.getRoleById(roleId);
    await RolePermissionModel.syncRolePermissions(roleId, permissionIds, actorId);
    return this.getRoleById(roleId);
  }
}

module.exports = RoleService;
