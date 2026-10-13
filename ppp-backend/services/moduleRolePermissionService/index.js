// services/moduleRolePermissionService/index.js
/**
 * Module Role Permission Services
 * Aggregates ActionService, ModuleService, PermissionService, RoleService, and UserRoleService.
 */

const ActionService = require('./action.service');
const ModuleService = require('./module.service');
const PermissionService = require('./permission.service');
const RoleService = require('./role.service');
const UserRoleService = require('./userRole.service');

module.exports = {
  ActionService,
  ModuleService,
  PermissionService,
  RoleService,
  UserRoleService,
};
