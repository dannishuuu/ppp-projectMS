const express = require('express');
const router = express.Router();
const ReviewDecisionController = require('../controllers/reviewDecision.controller');
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, ReviewDecisionController.getDecisions);
router.get('/:id', authMiddleware, ReviewDecisionController.getDecisionById);
router.post('/', authMiddleware, ReviewDecisionController.createDecision);
router.put('/:id', authMiddleware, ReviewDecisionController.updateDecision);
router.delete('/:id', authMiddleware, ReviewDecisionController.deleteDecision);

module.exports = router;