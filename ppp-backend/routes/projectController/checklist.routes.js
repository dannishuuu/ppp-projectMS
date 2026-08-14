// routes/projectController/checklist.routes.js
const express = require('express');
const ChecklistController = require('../../controllers/projectController/checklist.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

/**
 * Public/Non-authenticated routes (can be protected as needed)
 */

// Get all checklists with pagination
router.get('/', ChecklistController.getChecklists);

// Get checklists by tracking area
router.get('/tracking-area/:trackingAreaId', ChecklistController.getChecklistsByTrackingArea);

// Get a single checklist by ID
router.get('/:id', ChecklistController.getChecklistById);

/**
 * Protected routes (authentication required)
 */

// Create a new checklist
router.post('/', authMiddleware, ChecklistController.createChecklist);

// Update a checklist
router.put('/:id', authMiddleware, ChecklistController.updateChecklist);

// Delete a checklist (soft delete)
router.delete('/:id', authMiddleware, ChecklistController.deleteChecklist);

// Restore a deleted checklist
router.post('/:id/restore', authMiddleware, ChecklistController.restoreChecklist);

module.exports = router;
