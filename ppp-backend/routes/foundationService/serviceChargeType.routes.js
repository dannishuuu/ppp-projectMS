const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ServiceChargeTypeController = require('../../controllers/foundationService/serviceChargeType.controller');

router.get('/', authMiddleware, ServiceChargeTypeController.getServiceChargeTypes);
router.post('/', authMiddleware, ServiceChargeTypeController.createServiceChargeType);

router.get('/:id', authMiddleware, ServiceChargeTypeController.getServiceChargeTypeById);
router.put('/:id', authMiddleware, ServiceChargeTypeController.updateServiceChargeType);
router.patch('/:id/toggle-status', authMiddleware, ServiceChargeTypeController.toggleServiceChargeTypeStatus);
router.delete('/:id', authMiddleware, ServiceChargeTypeController.deleteServiceChargeType);

module.exports = router;