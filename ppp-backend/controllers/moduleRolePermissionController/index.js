// controllers/moduleRolePermissionController/index.js
/**
 * Module Role Permission Controllers
 * Aggregates ActionController, ModuleController, PermissionController, RoleController, and UserRoleController.
 */

const ActionController = require('./action.controller');
const ModuleController = require('./module.controller');
const PermissionController = require('./permission.controller');
const RoleController = require('./role.controller');
const UserRoleController = require('./userRole.controller');

module.exports = {
  ActionController,
  ModuleController,
  PermissionController,
  RoleController,
  UserRoleController,
};
