// services/moduleRolePermissionService/userRole.service.js
const UserRoleModel = require('../../models/userRole.model');
const UserModel = require('../../models/users.model');
const RoleModel = require('../../models/role.model');

class UserRoleService {
  /**
   * Get all active roles assigned to a user.
   * @param {string} userId
   */
  static async getUserRoles(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    return UserRoleModel.findByUserId(userId);
  }

  /**
   * Assign / replace roles for a user.
   * @param {string} userId
   * @param {string[]} roleIds
   * @param {string} actorId
   */
  static async assignRolesToUser(userId, roleIds = [], actorId = null) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    // Verify all role IDs exist and are active
    for (const roleId of roleIds) {
      const role = await RoleModel.findById(roleId);
      if (!role) {
        const err = new Error(`Role with ID "${roleId}" not found.`);
        err.status = 404;
        throw err;
      }
      if (!role.is_active) {
        const err = new Error(`Cannot assign inactive role "${role.name}".`);
        err.status = 400;
        throw err;
      }
    }

    await UserRoleModel.syncUserRoles(userId, roleIds, actorId);
    return UserRoleModel.findByUserId(userId);
  }

  /**
   * Remove a single role from a user.
   * @param {string} userId
   * @param {string} roleId
   * @param {string} actorId
   */
  static async removeRoleFromUser(userId, roleId, actorId = null) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    const currentRoles = await UserRoleModel.findByUserId(userId);
    const updatedRoleIds = currentRoles
      .map((r) => r.role_id)
      .filter((id) => id !== roleId);

    await UserRoleModel.syncUserRoles(userId, updatedRoleIds, actorId);
    return { success: true, message: 'Role removed from user.' };
  }

  /**
   * Resolves the user's active roles and permissions (called by Auth middleware).
   * @param {string} userId
   */
  static async getUserPermissionsAndRoles(userId) {
    return UserRoleModel.getUserPermissionsAndRoles(userId);
  }
}

module.exports = UserRoleService;
