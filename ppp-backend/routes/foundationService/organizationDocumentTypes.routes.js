// routes/foundationService/organizationDocumentTypes.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const OrganizationDocumentTypesController = require('../../controllers/foundationService/organizationDocumentTypes.controller');

router.get('/',    authMiddleware, OrganizationDocumentTypesController.getOrganizationDocumentTypes);
router.post('/',   authMiddleware, OrganizationDocumentTypesController.createOrganizationDocumentType);

router.get('/:id',                   authMiddleware, OrganizationDocumentTypesController.getOrganizationDocumentTypeById);
router.put('/:id',                   authMiddleware, OrganizationDocumentTypesController.updateOrganizationDocumentType);
router.patch('/:id/toggle-status',   authMiddleware, OrganizationDocumentTypesController.toggleOrganizationDocumentType);
router.delete('/:id',                authMiddleware, OrganizationDocumentTypesController.deleteOrganizationDocumentType);

module.exports = router;
