// routes/projectController/trackingArea.routes.js
const express = require('express');
const TrackingAreaController = require('../../controllers/projectController/trackingArea.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

/**
 * Public/Non-authenticated routes (can be protected as needed)
 */

// Get all tracking areas with pagination
router.get('/', TrackingAreaController.getTrackingAreas);

// Get all pillars (top-level areas)
router.get('/pillars', TrackingAreaController.getPillars);

// Get all phases (child areas)
router.get('/phases', TrackingAreaController.getPhases);

// Get full hierarchy
router.get('/hierarchy', TrackingAreaController.getHierarchy);

// Get a single tracking area by ID
router.get('/:id', TrackingAreaController.getTrackingAreaById);

// Get children of a tracking area
router.get('/:id/children', TrackingAreaController.getChildren);

// Check if an area has children
router.get('/:id/has-children', TrackingAreaController.hasChildren);

// Check if an area has checklists
router.get('/:id/has-checklists', TrackingAreaController.hasChecklists);

/**
 * Protected routes (authentication required)
 */

// Create a new tracking area
router.post('/', authMiddleware, TrackingAreaController.createTrackingArea);

// Update a tracking area
router.put('/:id', authMiddleware, TrackingAreaController.updateTrackingArea);

// Delete a tracking area (soft delete)
router.delete('/:id', authMiddleware, TrackingAreaController.deleteTrackingArea);

// Restore a deleted tracking area
router.post('/:id/restore', authMiddleware, TrackingAreaController.restoreTrackingArea);

module.exports = router;
