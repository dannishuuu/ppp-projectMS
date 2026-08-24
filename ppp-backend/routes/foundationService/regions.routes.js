const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const RegionController = require('../../controllers/foundationService/regions.controller');

router.get('/',     authMiddleware, RegionController.getRegions);
router.post('/',    authMiddleware, RegionController.createRegion);

router.get('/:id',                    authMiddleware, RegionController.getRegionById);
router.put('/:id',                    authMiddleware, RegionController.updateRegion);
router.patch('/:id/toggle-status',    authMiddleware, RegionController.toggleRegionStatus);
router.delete('/:id',                 authMiddleware, RegionController.deleteRegion);

module.exports = router;