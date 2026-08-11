// routes/foundationService/proposalStatus.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ProposalStatusController = require('../../controllers/foundationService/proposalStatus.controller');

router.get('/',    authMiddleware, ProposalStatusController.getProposalStatuses);
router.post('/',   authMiddleware, ProposalStatusController.createProposalStatus);

router.get('/:id',                   authMiddleware, ProposalStatusController.getProposalStatusById);
router.put('/:id',                   authMiddleware, ProposalStatusController.updateProposalStatus);
router.patch('/:id/toggle-status',   authMiddleware, ProposalStatusController.toggleProposalStatus);
router.delete('/:id',                authMiddleware, ProposalStatusController.deleteProposalStatus);

module.exports = router;
