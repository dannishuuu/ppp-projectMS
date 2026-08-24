const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const BuildingTypeController = require('../../controllers/foundationService/buildingTypes.controller');

router.get('/',     authMiddleware, BuildingTypeController.getBuildingTypes);
router.post('/',    authMiddleware, BuildingTypeController.createBuildingType);

router.get('/:id',                    authMiddleware, BuildingTypeController.getBuildingTypeById);
router.put('/:id',                    authMiddleware, BuildingTypeController.updateBuildingType);
router.patch('/:id/toggle-status',    authMiddleware, BuildingTypeController.toggleBuildingTypeStatus);
router.delete('/:id',                 authMiddleware, BuildingTypeController.deleteBuildingType);

module.exports = router;