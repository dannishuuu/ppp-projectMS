// routes/moduleRolePermissionRoutes/action.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { ActionController } = require('../../controllers/moduleRolePermissionController');

router.use(authMiddleware);

router.get('/', ActionController.getActions);
router.get('/:id', ActionController.getActionById);
router.post('/', ActionController.createAction);
router.put('/:id', ActionController.updateAction);
router.patch('/:id/toggle-status', ActionController.toggleActionStatus);
router.delete('/:id', ActionController.deleteAction);

module.exports = router;
