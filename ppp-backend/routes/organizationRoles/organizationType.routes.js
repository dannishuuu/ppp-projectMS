// routes/organizationRoles/organizationType.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const OrgTypeController = require('../../controllers/organizationController/organizationType.controller');

// ─── Collection routes ────────────────────────────────────────────────────────
router.get('/',     authMiddleware, OrgTypeController.getOrganizationTypes);
router.post('/',    authMiddleware, OrgTypeController.createOrganizationType);

// ─── Member routes ────────────────────────────────────────────────────────────
router.get('/:id',                    authMiddleware, OrgTypeController.getOrganizationTypeById);
router.put('/:id',                    authMiddleware, OrgTypeController.updateOrganizationType);
router.patch('/:id/toggle-status',    authMiddleware, OrgTypeController.toggleOrganizationTypeStatus);
router.delete('/:id',                 authMiddleware, OrgTypeController.deleteOrganizationType);

module.exports = router;
