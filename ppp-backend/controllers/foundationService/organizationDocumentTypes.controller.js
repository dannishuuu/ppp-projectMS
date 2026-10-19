// controllers/foundationService/organizationDocumentTypes.controller.js
const OrganizationDocumentTypesService = require('../../services/foundationService/organizationDocumentTypes.service');

exports.getOrganizationDocumentTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await OrganizationDocumentTypesService.getOrganizationDocumentTypes({
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

exports.getOrganizationDocumentTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docType = await OrganizationDocumentTypesService.getOrganizationDocumentTypeById(id);
    return res.status(200).json({ success: true, data: docType });
  } catch (error) {
    next(error);
  }
};

exports.createOrganizationDocumentType = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const docType = await OrganizationDocumentTypesService.createOrganizationDocumentType(req.body, actorId);
    return res.status(201).json({ success: true, data: docType });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganizationDocumentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await OrganizationDocumentTypesService.updateOrganizationDocumentType(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleOrganizationDocumentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationDocumentTypesService.toggleOrganizationDocumentType(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrganizationDocumentType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await OrganizationDocumentTypesService.deleteOrganizationDocumentType(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
