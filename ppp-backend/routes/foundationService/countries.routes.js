// routes/foundationService/countries.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const CountryController = require('../../controllers/foundationService/countries.controller');

router.get('/',     authMiddleware, CountryController.getCountries);
router.post('/',    authMiddleware, CountryController.createCountry);

router.get('/:id',                    authMiddleware, CountryController.getCountryById);
router.put('/:id',                    authMiddleware, CountryController.updateCountry);
router.patch('/:id/toggle-status',    authMiddleware, CountryController.toggleCountryStatus);
router.delete('/:id',                 authMiddleware, CountryController.deleteCountry);

module.exports = router;