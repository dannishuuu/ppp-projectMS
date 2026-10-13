// ppp-backend/modules/index.js
/**
 * RBAC Modules export interface
 * Provides access to Action, Module, Permission, Role, RolePermission, and UserRole models.
 */

const ActionModel = require('../models/action.model');
const ModuleModel = require('../models/module.model');
const PermissionModel = require('../models/permission.model');
const RoleModel = require('../models/role.model');
const RolePermissionModel = require('../models/rolePermission.model');
const UserRoleModel = require('../models/userRole.model');

module.exports = {
  Action: ActionModel,
  ActionModel,

  Module: ModuleModel,
  ModuleModel,

  Permission: PermissionModel,
  PermissionModel,

  Role: RoleModel,
  RoleModel,

  RolePermission: RolePermissionModel,
  RolePermissionModel,

  UserRole: UserRoleModel,
  UserRoleModel,
};
