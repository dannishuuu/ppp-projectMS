// routes/projectController/projectProposal.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ProposalController = require('../../controllers/projectController/projectProposal.controller');

// Collection routes
router.get('/',   authMiddleware, ProposalController.getProposals);
router.post('/',  authMiddleware, ProposalController.createProposal);

// Single resource routes
router.get('/:id',                  authMiddleware, ProposalController.getProposalById);
router.put('/:id',                  authMiddleware, ProposalController.updateProposal);
router.delete('/:id',               authMiddleware, ProposalController.deleteProposal);

// Action routes
router.patch('/:id/change-status',  authMiddleware, ProposalController.changeStatus);
router.patch('/:id/submit',         authMiddleware, ProposalController.submitProposal);
router.get('/:id/reviewers',        authMiddleware, ProposalController.getProposalReviewers);

module.exports = router;
