const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const BuildingController = require('../../controllers/buildingController/buildings.controller');

router.get('/', authMiddleware, BuildingController.getBuildings);
router.post('/', authMiddleware, BuildingController.createBuilding);

router.get('/:id', authMiddleware, BuildingController.getBuildingById);
router.put('/:id', authMiddleware, BuildingController.updateBuilding);
router.patch('/:id/toggle-status', authMiddleware, BuildingController.toggleBuildingStatus);
router.delete('/:id', authMiddleware, BuildingController.deleteBuilding);

module.exports = router;