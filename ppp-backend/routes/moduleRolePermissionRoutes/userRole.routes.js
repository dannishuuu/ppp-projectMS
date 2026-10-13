// routes/moduleRolePermissionRoutes/userRole.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { UserRoleController } = require('../../controllers/moduleRolePermissionController');

router.use(authMiddleware);

// Get current user's resolved permissions and roles
router.get('/my-permissions', (req, res, next) => {
  req.params.userId = req.user?.id;
  return UserRoleController.getUserPermissionsAndRoles(req, res, next);
});

// User roles assignment and retrieval
router.get('/users/:userId/roles', UserRoleController.getUserRoles);
router.post('/users/:userId/roles', UserRoleController.assignRolesToUser);
router.put('/users/:userId/roles', UserRoleController.assignRolesToUser);
router.delete('/users/:userId/roles/:roleId', UserRoleController.removeRoleFromUser);

// Get specific user's resolved permissions and roles
router.get('/users/:userId/permissions', UserRoleController.getUserPermissionsAndRoles);

module.exports = router;
