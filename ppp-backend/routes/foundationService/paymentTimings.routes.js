const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const PaymentTimingController = require('../../controllers/foundationService/paymentTimings.controller');

router.get('/',     authMiddleware, PaymentTimingController.getPaymentTimings);
router.post('/',    authMiddleware, PaymentTimingController.createPaymentTiming);

router.get('/:id',                    authMiddleware, PaymentTimingController.getPaymentTimingById);
router.put('/:id',                    authMiddleware, PaymentTimingController.updatePaymentTiming);
router.patch('/:id/toggle-status',    authMiddleware, PaymentTimingController.togglePaymentTimingStatus);
router.delete('/:id',                 authMiddleware, PaymentTimingController.deletePaymentTiming);

module.exports = router;