// routes/foundationService/projectStatus.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ProjectStatusController = require('../../controllers/foundationService/projectStatus.controller');

router.get('/',    authMiddleware, ProjectStatusController.getProjectStatuses);
router.post('/',   authMiddleware, ProjectStatusController.createProjectStatus);

router.get('/:id',                   authMiddleware, ProjectStatusController.getProjectStatusById);
router.put('/:id',                   authMiddleware, ProjectStatusController.updateProjectStatus);
router.patch('/:id/toggle-status',   authMiddleware, ProjectStatusController.toggleProjectStatus);
router.delete('/:id',                authMiddleware, ProjectStatusController.deleteProjectStatus);

module.exports = router;
