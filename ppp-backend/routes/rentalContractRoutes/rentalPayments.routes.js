const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const RentalPaymentsController = require('../../controllers/rentalContractController/rentalPayments.controller');

// Collection & Stats
router.get('/', authMiddleware, RentalPaymentsController.getPayments);
router.get('/stats', authMiddleware, RentalPaymentsController.getPaymentStats);
router.post('/', authMiddleware, RentalPaymentsController.createPayment);

// Single payment actions
router.get('/:id', authMiddleware, RentalPaymentsController.getPaymentById);
router.put('/:id', authMiddleware, RentalPaymentsController.updatePayment);
router.patch('/:id/pay', authMiddleware, RentalPaymentsController.recordPayment);
router.delete('/:id', authMiddleware, RentalPaymentsController.deletePayment);

module.exports = router;
