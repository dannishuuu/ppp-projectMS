const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const AreaUnitController = require('../../controllers/foundationService/areaUnits.controller');

router.get('/', authMiddleware, AreaUnitController.getAreaUnits);
router.post('/', authMiddleware, AreaUnitController.createAreaUnit);

router.get('/:id', authMiddleware, AreaUnitController.getAreaUnitById);
router.put('/:id', authMiddleware, AreaUnitController.updateAreaUnit);
router.patch('/:id/toggle-status', authMiddleware, AreaUnitController.toggleAreaUnitStatus);
router.delete('/:id', authMiddleware, AreaUnitController.deleteAreaUnit);

module.exports = router;