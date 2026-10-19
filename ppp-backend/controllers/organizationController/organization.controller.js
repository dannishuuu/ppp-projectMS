// controllers/organizationController/organization.controller.js
const OrganizationService = require('../../services/organizationService/organization.service');

// ─── LIST ─────────────────────────────────────────────────────────────────────
// GET /api/v1/organizations
exports.getOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', typeId = null } = req.query;
    const result = await OrganizationService.getOrganizations({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      typeId,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────────────────
// GET /api/v1/organizations/:id
exports.getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await OrganizationService.getOrganizationById(id);
    return res.status(200).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
// POST /api/v1/organizations
exports.createOrganization = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const org = await OrganizationService.createOrganization(req.body, actorId);
    return res.status(201).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// PUT /api/v1/organizations/:id
exports.updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await OrganizationService.updateOrganization(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
// PATCH /api/v1/organizations/:id/toggle-status
exports.toggleOrganizationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationService.toggleOrganizationStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
// DELETE /api/v1/organizations/:id
exports.deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationService.deleteOrganization(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── ORGANIZATION DOCUMENTS ───────────────────────────────────────────────────
// GET /api/v1/organizations/:id/documents
exports.getOrganizationDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentTypeId = null, verified = 'all' } = req.query;
    const result = await OrganizationService.getOrganizationDocuments(id, { documentTypeId, verified });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/organizations/:id/documents/:documentId
exports.getOrganizationDocumentById = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await OrganizationService.getOrganizationDocumentById(documentId);
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/organizations/:id/documents
exports.addOrganizationDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const doc = await OrganizationService.addOrganizationDocument(id, req.body, actorId);
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/organizations/:id/documents/:documentId
exports.updateOrganizationDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const actorId = req.user?.id;
    const updated = await OrganizationService.updateOrganizationDocument(documentId, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/organizations/:id/documents/:documentId/verify
exports.verifyOrganizationDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const actorId = req.user?.id;
    const updated = await OrganizationService.verifyOrganizationDocument(documentId, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/organizations/:id/documents/:documentId
exports.deleteOrganizationDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationService.deleteOrganizationDocument(documentId, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
