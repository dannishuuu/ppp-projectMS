const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const FloorTypeController = require('../../controllers/foundationService/floorTypes.controller');

router.get('/', authMiddleware, FloorTypeController.getFloorTypes);
router.post('/', authMiddleware, FloorTypeController.createFloorType);

router.get('/:id', authMiddleware, FloorTypeController.getFloorTypeById);
router.put('/:id', authMiddleware, FloorTypeController.updateFloorType);
router.patch('/:id/toggle-status', authMiddleware, FloorTypeController.toggleFloorTypeStatus);
router.delete('/:id', authMiddleware, FloorTypeController.deleteFloorType);

module.exports = router;