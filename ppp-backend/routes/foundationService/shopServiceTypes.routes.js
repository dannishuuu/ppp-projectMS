const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const ShopServiceTypeController = require('../../controllers/foundationService/shopServiceTypes.controller');

router.get('/',     authMiddleware, ShopServiceTypeController.getShopServiceTypes);
router.post('/',    authMiddleware, ShopServiceTypeController.createShopServiceType);

router.get('/:id',                    authMiddleware, ShopServiceTypeController.getShopServiceTypeById);
router.put('/:id',                    authMiddleware, ShopServiceTypeController.updateShopServiceType);
router.patch('/:id/toggle-status',    authMiddleware, ShopServiceTypeController.toggleShopServiceTypeStatus);
router.delete('/:id',                 authMiddleware, ShopServiceTypeController.deleteShopServiceType);

module.exports = router;