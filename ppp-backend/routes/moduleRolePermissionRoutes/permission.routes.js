// routes/moduleRolePermissionRoutes/permission.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { PermissionController } = require('../../controllers/moduleRolePermissionController');

router.use(authMiddleware);

router.get('/', PermissionController.getPermissions);
router.get('/matrix', PermissionController.getPermissionsGroupedByModule);
router.get('/grouped', PermissionController.getPermissionsGroupedByModule);
router.post('/batch-generate', PermissionController.batchGenerateForModule);
router.get('/:id', PermissionController.getPermissionById);
router.post('/', PermissionController.createPermission);
router.put('/:id', PermissionController.updatePermission);
router.patch('/:id/toggle-status', PermissionController.togglePermissionStatus);
router.delete('/:id', PermissionController.deletePermission);

module.exports = router;
