// routes/projectController/projectTracking.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const TrackingController = require('../../controllers/projectController/projectTracking.controller');

// Project WBS Tree
router.get('/projects/:projectId/tree',            authMiddleware, TrackingController.getProjectWbsTree);
router.post('/projects/:projectId/initialize',     authMiddleware, TrackingController.initializeProjectWbs);
router.put('/projects/:projectId/type-weights',    authMiddleware, TrackingController.updateTypeWeights);

// Level 2 Area weight adjustment
router.put('/types/:projectTrackingTypeId/area-weights', authMiddleware, TrackingController.updateAreaWeights);

// Level 3 Checklist weight & status adjustment
router.put('/areas/:projectTrackingAreaId/checklist-weights', authMiddleware, TrackingController.updateChecklistWeights);
router.patch('/checklists/:checklistId/toggle-complete',      authMiddleware, TrackingController.toggleChecklistCompletion);

// Performance logs
router.post('/checklists/:checklistId/logs',       authMiddleware, TrackingController.addPerformanceLog);
router.get('/checklists/:checklistId/logs',        authMiddleware, TrackingController.getChecklistLogs);

module.exports = router;
