const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const UnitController = require('../../controllers/buildingController/buildingUnits.controller');

router.get('/', authMiddleware, UnitController.getUnits);
router.post('/', authMiddleware, UnitController.createUnit);

router.get('/:id', authMiddleware, UnitController.getUnitById);
router.put('/:id', authMiddleware, UnitController.updateUnit);
router.patch('/:id/toggle-status', authMiddleware, UnitController.toggleUnitStatus);
router.patch('/:id/toggle-rented', authMiddleware, UnitController.toggleUnitRented);
router.patch('/:id/toggle-for-rent', authMiddleware, UnitController.toggleUnitForRent);
router.delete('/:id', authMiddleware, UnitController.deleteUnit);

module.exports = router;