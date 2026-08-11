// controllers/organizationController/organizationType.controller.js
const OrganizationTypeService = require('../../services/organizationService/organizationType.service');

// ─── LIST ─────────────────────────────────────────────────────────────────────
// GET /api/v1/organization-types
exports.getOrganizationTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await OrganizationTypeService.getOrganizationTypes({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────────────────
// GET /api/v1/organization-types/:id
exports.getOrganizationTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgType = await OrganizationTypeService.getOrganizationTypeById(id);
    return res.status(200).json({ success: true, data: orgType });
  } catch (error) {
    next(error);
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
// POST /api/v1/organization-types
exports.createOrganizationType = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const orgType = await OrganizationTypeService.createOrganizationType(req.body, actorId);
    return res.status(201).json({ success: true, data: orgType });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// PUT /api/v1/organization-types/:id
exports.updateOrganizationType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await OrganizationTypeService.updateOrganizationType(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
// PATCH /api/v1/organization-types/:id/toggle-status
exports.toggleOrganizationTypeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationTypeService.toggleOrganizationTypeStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
// DELETE /api/v1/organization-types/:id
exports.deleteOrganizationType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationTypeService.deleteOrganizationType(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
