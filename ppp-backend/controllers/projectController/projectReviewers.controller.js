// controllers/projectController/projectReviewers.controller.js
const ProjectReviewersService = require('../../services/projectService/projectReviewers.service');

exports.getReviewers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      proposalId,
      status = 'all',
    } = req.query;

    const result = await ProjectReviewersService.getReviewers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      proposalId: proposalId || null,
      status,
      reviewerId: req.user?.id,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getReviewerById = async (req, res, next) => {
  try {
    const reviewer = await ProjectReviewersService.getReviewerById(req.params.id, req.user?.id);
    return res.status(200).json({ success: true, data: reviewer });
  } catch (error) {
    next(error);
  }
};

exports.getReviewersByProposalId = async (req, res, next) => {
  try {
    const reviewers = await ProjectReviewersService.getReviewersByProposalId(req.params.proposalId);
    return res.status(200).json({ success: true, data: reviewers });
  } catch (error) {
    next(error);
  }
};

exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status, remarks, decisionId } = req.body;
    const actorId = req.user?.id;
    const updated = await ProjectReviewersService.updateReviewStatus(req.params.id, status, remarks, actorId, decisionId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};