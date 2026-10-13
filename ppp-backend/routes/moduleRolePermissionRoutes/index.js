// routes/moduleRolePermissionRoutes/index.js
const actionRoutes = require('./action.routes');
const moduleRoutes = require('./module.routes');
const permissionRoutes = require('./permission.routes');
const roleRoutes = require('./role.routes');
const userRoleRoutes = require('./userRole.routes');

module.exports = {
  actionRoutes,
  moduleRoutes,
  permissionRoutes,
  roleRoutes,
  userRoleRoutes,
};
