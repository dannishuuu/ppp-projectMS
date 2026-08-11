// routes/projectController/documentSequence.routes.js
const express = require('express');
const DocumentSequenceController = require('../../controllers/projectController/documentSequence.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// GET all sequences (paginated, filterable)
router.get('/', DocumentSequenceController.getAll);

// GET single sequence by ID
router.get('/:id', DocumentSequenceController.getById);

// Protected routes
// POST create a new sequence config
router.post('/', authMiddleware, DocumentSequenceController.create);

// PUT update sequence config
router.put('/:id', authMiddleware, DocumentSequenceController.update);

// DELETE (soft delete) a sequence
router.delete('/:id', authMiddleware, DocumentSequenceController.remove);

// POST reset counter for a sequence
router.post('/:id/reset', authMiddleware, DocumentSequenceController.reset);

module.exports = router;
