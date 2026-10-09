// controllers/projectController/pppProject.controller.js
const PppProjectService = require('../../services/projectService/pppProject.service');

exports.getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId,
      categoryId,
      organizationId,
      isActive,
    } = req.query;

    const result = await PppProjectService.getProjects({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      statusId: statusId || null,
      categoryId: categoryId || null,
      organizationId: organizationId || null,
      isActive: isActive !== undefined ? isActive === 'true' : null,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await PppProjectService.getProjectById(req.params.id);
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const project = await PppProjectService.createProject(req.body, actorId);
    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const updated = await PppProjectService.updateProject(req.params.id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { statusId } = req.body;
    const updated = await PppProjectService.changeStatus(req.params.id, statusId, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const result = await PppProjectService.deleteProject(req.params.id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.convertProposal = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { proposalId } = req.params;
    const project = await PppProjectService.convertProposalToProject(proposalId, req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Proposal successfully converted to official project.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};
