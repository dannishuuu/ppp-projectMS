const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const BusinessSectorController = require('../../controllers/foundationService/businessSector.controller');

router.get('/', authMiddleware, BusinessSectorController.getBusinessSectors);
router.post('/', authMiddleware, BusinessSectorController.createBusinessSector);

router.get('/:id', authMiddleware, BusinessSectorController.getBusinessSectorById);
router.put('/:id', authMiddleware, BusinessSectorController.updateBusinessSector);
router.patch('/:id/toggle-status', authMiddleware, BusinessSectorController.toggleBusinessSectorStatus);
router.delete('/:id', authMiddleware, BusinessSectorController.deleteBusinessSector);

module.exports = router;