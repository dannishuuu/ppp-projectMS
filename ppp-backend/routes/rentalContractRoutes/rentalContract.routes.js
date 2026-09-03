const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const RentalContractController = require('../../controllers/rentalContractController/rentalContract.controller');
const RentalPaymentsController = require('../../controllers/rentalContractController/rentalPayments.controller');

// Collection & Summary
router.get('/', authMiddleware, RentalContractController.getContracts);
router.get('/summary', authMiddleware, RentalContractController.getContractSummary);
router.post('/', authMiddleware, RentalContractController.createContract);

// Individual contract
router.get('/:id', authMiddleware, RentalContractController.getContractById);
router.put('/:id', authMiddleware, RentalContractController.updateContract);
router.patch('/:id/toggle-status', authMiddleware, RentalContractController.toggleContractStatus);
router.delete('/:id', authMiddleware, RentalContractController.deleteContract);

// Sub-resource routes: Payments & Schedules for contract
router.get('/:contractId/payments', authMiddleware, RentalPaymentsController.getPaymentsByContract);
router.post('/:contractId/generate-schedule', authMiddleware, RentalPaymentsController.generateSchedule);

module.exports = router;
