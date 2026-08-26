const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const UnitController = require('../../controllers/buildingController/buildingUnits.controller');

router.get('/', authMiddleware, UnitController.getUnits);
router.post('/', authMiddleware, UnitController.createUnit);

router.get('/:id', authMiddleware, UnitController.getUnitById);
router.put('/:id', authMiddleware, UnitController.updateUnit);
router.patch('/:id/toggle-status', authMiddleware, UnitController.toggleUnitStatus);
router.delete('/:id', authMiddleware, UnitController.deleteUnit);

module.exports = router;