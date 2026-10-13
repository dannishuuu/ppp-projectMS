// routes/moduleRolePermissionRoutes/role.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { RoleController } = require('../../controllers/moduleRolePermissionController');

router.use(authMiddleware);

router.get('/', RoleController.getRoles);
router.get('/:id', RoleController.getRoleById);
router.post('/', RoleController.createRole);
router.put('/:id', RoleController.updateRole);
router.patch('/:id/toggle-status', RoleController.toggleRoleStatus);
router.delete('/:id', RoleController.deleteRole);

// Role permissions management
router.get('/:id/permissions', RoleController.getRolePermissions);
router.post('/:id/permissions', RoleController.assignPermissions);
router.put('/:id/permissions', RoleController.assignPermissions);

module.exports = router;
