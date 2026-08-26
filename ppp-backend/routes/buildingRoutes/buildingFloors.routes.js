const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const FloorController = require('../../controllers/buildingController/buildingFloors.controller');

router.get('/', authMiddleware, FloorController.getFloors);
router.post('/', authMiddleware, FloorController.createFloor);

router.get('/:id', authMiddleware, FloorController.getFloorById);
router.put('/:id', authMiddleware, FloorController.updateFloor);
router.patch('/:id/toggle-status', authMiddleware, FloorController.toggleFloorStatus);
router.delete('/:id', authMiddleware, FloorController.deleteFloor);

module.exports = router;