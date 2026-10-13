// routes/moduleRolePermissionRoutes/module.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { ModuleController } = require('../../controllers/moduleRolePermissionController');

router.use(authMiddleware);

router.get('/', ModuleController.getModules);
router.get('/:id', ModuleController.getModuleById);
router.post('/', ModuleController.createModule);
router.put('/:id', ModuleController.updateModule);
router.patch('/:id/toggle-status', ModuleController.toggleModuleStatus);
router.delete('/:id', ModuleController.deleteModule);

module.exports = router;
