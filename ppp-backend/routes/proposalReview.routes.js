const express = require('express');
const router = express.Router();
const ProposalReviewController = require('../controllers/proposalReview.controller');
const authMiddleware = require('../middlewares/auth');

// Submit a review
router.post('/:id/submit', authMiddleware, ProposalReviewController.submitReview);

// Get reviews by proposal ID
router.get('/proposal/:proposalId', authMiddleware, ProposalReviewController.getReviewsByProposalId);

// Get review by assignment ID
router.get('/:id', authMiddleware, ProposalReviewController.getReviewByAssignmentId);

module.exports = router;