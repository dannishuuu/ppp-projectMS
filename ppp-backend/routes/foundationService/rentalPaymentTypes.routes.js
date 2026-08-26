const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const RentalPaymentTypeController = require('../../controllers/foundationService/rentalPaymentTypes.controller');

router.get('/',     authMiddleware, RentalPaymentTypeController.getRentalPaymentTypes);
router.post('/',    authMiddleware, RentalPaymentTypeController.createRentalPaymentType);

router.get('/:id',                    authMiddleware, RentalPaymentTypeController.getRentalPaymentTypeById);
router.put('/:id',                    authMiddleware, RentalPaymentTypeController.updateRentalPaymentType);
router.patch('/:id/toggle-status',    authMiddleware, RentalPaymentTypeController.toggleRentalPaymentTypeStatus);
router.delete('/:id',                 authMiddleware, RentalPaymentTypeController.deleteRentalPaymentType);

module.exports = router;