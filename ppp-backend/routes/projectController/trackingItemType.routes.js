// routes/projectController/trackingItemType.routes.js
const express = require('express');
const TrackingItemTypeController = require('../../controllers/projectController/trackingItemType.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

/**
 * Public/Non-authenticated routes (can be protected as needed)
 */

// Get all tracking item types with pagination
router.get('/', TrackingItemTypeController.getTrackingItemTypes);

// Get all active tracking item types (for dropdowns)
router.get('/active', TrackingItemTypeController.getActiveTrackingItemTypes);

// Get WBS-capable tracking item types (parent types)
router.get('/wbs-capable', TrackingItemTypeController.getWbsCapableTypes);

// Get leaf tracking item types (final types)
router.get('/leaf', TrackingItemTypeController.getLeafTypes);

// Get a single tracking item type by ID
router.get('/:id', TrackingItemTypeController.getTrackingItemTypeById);

// Check if a type can have children
router.get('/:id/can-have-children', TrackingItemTypeController.canHaveChildren);

// Check if a type is a leaf node
router.get('/:id/is-leaf', TrackingItemTypeController.isLeafNode);

// Get default weight for a type
router.get('/:id/default-weight', TrackingItemTypeController.getDefaultWeight);

/**
 * Protected routes (authentication required)
 */

// Create a new tracking item type
router.post('/', authMiddleware, TrackingItemTypeController.createTrackingItemType);

// Update a tracking item type
router.put('/:id', authMiddleware, TrackingItemTypeController.updateTrackingItemType);

// Delete a tracking item type (soft delete)
router.delete('/:id', authMiddleware, TrackingItemTypeController.deleteTrackingItemType);

// Restore a deleted tracking item type
router.post('/:id/restore', authMiddleware, TrackingItemTypeController.restoreTrackingItemType);

module.exports = router;
