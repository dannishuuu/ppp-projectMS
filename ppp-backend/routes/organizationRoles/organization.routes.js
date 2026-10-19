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

// ─── Organization documents ───────────────────────────────────────────────────
router.get('/:id/documents',                        authMiddleware, OrgController.getOrganizationDocuments);
router.post('/:id/documents',                       authMiddleware, OrgController.addOrganizationDocument);
router.get('/:id/documents/:documentId',            authMiddleware, OrgController.getOrganizationDocumentById);
router.put('/:id/documents/:documentId',            authMiddleware, OrgController.updateOrganizationDocument);
router.patch('/:id/documents/:documentId/verify',   authMiddleware, OrgController.verifyOrganizationDocument);
router.delete('/:id/documents/:documentId',         authMiddleware, OrgController.deleteOrganizationDocument);

module.exports = router;
