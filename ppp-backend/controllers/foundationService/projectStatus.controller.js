// controllers/foundationService/projectStatus.controller.js
const ProjectStatusService = require('../../services/foundationService/projectStatus.service');

exports.getProjectStatuses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await ProjectStatusService.getProjectStatuses({
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

exports.getProjectStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await ProjectStatusService.getProjectStatusById(id);
    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

exports.createProjectStatus = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const status = await ProjectStatusService.createProjectStatus(req.body, actorId);
    return res.status(201).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ProjectStatusService.updateProjectStatus(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProjectStatusService.toggleProjectStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProjectStatusService.deleteProjectStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
