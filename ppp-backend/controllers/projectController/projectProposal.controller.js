// controllers/projectController/projectProposal.controller.js
const ProjectProposalService = require('../../services/projectService/projectProposal.service');

exports.getProposals = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId,
      organizationId,
      categoryId,
    } = req.query;

    const result = await ProjectProposalService.getProposals({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      statusId: statusId || null,
      organizationId: organizationId || null,
      categoryId: categoryId || null,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getProposalById = async (req, res, next) => {
  try {
    const proposal = await ProjectProposalService.getProposalById(req.params.id);
    return res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

exports.createProposal = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const proposal = await ProjectProposalService.createProposal(req.body, actorId);
    return res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

exports.updateProposal = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const updated = await ProjectProposalService.updateProposal(req.params.id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { statusId } = req.body;
    const updated = await ProjectProposalService.changeStatus(req.params.id, statusId, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.submitProposal = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const { reviewerIds, dueDate } = req.body;
    const updated = await ProjectProposalService.submitProposal(req.params.id, reviewerIds, dueDate, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getProposalReviewers = async (req, res, next) => {
  try {
    const reviewers = await ProjectProposalService.getProposalReviewers(req.params.id);
    return res.status(200).json({ success: true, data: reviewers });
  } catch (error) {
    next(error);
  }
};

exports.deleteProposal = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const result = await ProjectProposalService.deleteProposal(req.params.id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
