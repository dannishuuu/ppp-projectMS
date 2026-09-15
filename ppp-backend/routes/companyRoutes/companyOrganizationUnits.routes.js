// routes/companyRoutes/companyOrganizationUnits.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const OrgUnitController = require('../../controllers/companyController/companyOrganizationUnits.controller');

// List flat units for a company (query: companyId required; parentId, unitTypeId, level, status, search, page, limit)
router.get('/', authMiddleware, OrgUnitController.getUnits);

// Nested tree for one company — must be registered before '/:id'
router.get('/tree/company/:companyId', authMiddleware, OrgUnitController.getCompanyTree);

router.post('/',                authMiddleware, OrgUnitController.createUnit);
router.get('/:id',              authMiddleware, OrgUnitController.getUnitById);
router.get('/:id/path',         authMiddleware, OrgUnitController.getUnitPath);
router.get('/:id/descendants',  authMiddleware, OrgUnitController.getUnitDescendants);
router.put('/:id',              authMiddleware, OrgUnitController.updateUnit);
router.patch('/:id/move',       authMiddleware, OrgUnitController.moveUnit);
router.patch('/:id/toggle-status', authMiddleware, OrgUnitController.toggleUnitStatus);
router.delete('/:id',           authMiddleware, OrgUnitController.deleteUnit);

module.exports = router;
