// routes/companyRoutes/companies.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const CompanyController = require('../../controllers/companyController/companies.controller');

router.get('/',  authMiddleware, CompanyController.getCompanies);
router.post('/', authMiddleware, CompanyController.createCompany);

router.get('/:id',                 authMiddleware, CompanyController.getCompanyById);
router.put('/:id',                 authMiddleware, CompanyController.updateCompany);
router.patch('/:id/toggle-status', authMiddleware, CompanyController.toggleCompanyStatus);
router.delete('/:id',              authMiddleware, CompanyController.deleteCompany);

module.exports = router;
