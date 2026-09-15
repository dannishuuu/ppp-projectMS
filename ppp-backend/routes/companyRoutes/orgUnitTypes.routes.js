// routes/companyRoutes/orgUnitTypes.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const OrgUnitTypeController = require('../../controllers/companyController/orgUnitTypes.controller');

router.get('/',  authMiddleware, OrgUnitTypeController.getOrgUnitTypes);
router.post('/', authMiddleware, OrgUnitTypeController.createOrgUnitType);

router.get('/:id',                 authMiddleware, OrgUnitTypeController.getOrgUnitTypeById);
router.put('/:id',                 authMiddleware, OrgUnitTypeController.updateOrgUnitType);
router.patch('/:id/toggle-status', authMiddleware, OrgUnitTypeController.toggleOrgUnitTypeStatus);
router.delete('/:id',              authMiddleware, OrgUnitTypeController.deleteOrgUnitType);

module.exports = router;
