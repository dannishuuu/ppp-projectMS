// routes/organizationRoles/organization.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const OrgController = require('../../controllers/organizationController/organization.controller');

// ─── Collection routes ────────────────────────────────────────────────────────
router.get('/',     authMiddleware, OrgController.getOrganizations);
router.post('/',    authMiddleware, OrgController.createOrganization);

// ─── Member routes ────────────────────────────────────────────────────────────
router.get('/:id',                    authMiddleware, OrgController.getOrganizationById);
router.put('/:id',                    authMiddleware, OrgController.updateOrganization);
router.patch('/:id/toggle-status',    authMiddleware, OrgController.toggleOrganizationStatus);
router.delete('/:id',                 authMiddleware, OrgController.deleteOrganization);

module.exports = router;
