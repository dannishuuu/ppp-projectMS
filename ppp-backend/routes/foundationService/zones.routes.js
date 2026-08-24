const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ZoneController = require('../../controllers/foundationService/zones.controller');

router.get('/',     authMiddleware, ZoneController.getZones);
router.post('/',    authMiddleware, ZoneController.createZone);

router.get('/:id',                    authMiddleware, ZoneController.getZoneById);
router.put('/:id',                    authMiddleware, ZoneController.updateZone);
router.patch('/:id/toggle-status',    authMiddleware, ZoneController.toggleZoneStatus);
router.delete('/:id',                 authMiddleware, ZoneController.deleteZone);

module.exports = router;