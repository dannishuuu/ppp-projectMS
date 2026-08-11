// routes/projectController/projectReviewers.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ProjectReviewersController = require('../../controllers/projectController/projectReviewers.controller');

// Collection routes
router.get('/', authMiddleware, ProjectReviewersController.getReviewers);

// Single resource routes
router.get('/:id', authMiddleware, ProjectReviewersController.getReviewerById);

// Proposal-related routes
router.get('/proposal/:proposalId', authMiddleware, ProjectReviewersController.getReviewersByProposalId);

// Action routes
router.patch('/:id/status', authMiddleware, ProjectReviewersController.updateReviewStatus);

module.exports = router;