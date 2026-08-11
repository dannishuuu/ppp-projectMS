// routes/foundationService/currency.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const CurrencyController = require('../../controllers/foundationService/currency.controller');

router.get('/',     authMiddleware, CurrencyController.getCurrencies);
router.post('/',    authMiddleware, CurrencyController.createCurrency);

router.get('/:id',                    authMiddleware, CurrencyController.getCurrencyById);
router.put('/:id',                    authMiddleware, CurrencyController.updateCurrency);
router.patch('/:id/toggle-status',    authMiddleware, CurrencyController.toggleCurrencyStatus);
router.delete('/:id',                 authMiddleware, CurrencyController.deleteCurrency);

module.exports = router;
