// controllers/foundationService/proposalStatus.controller.js
const ProposalStatusService = require('../../services/foundationService/proposalStatus.service');

exports.getProposalStatuses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const result = await ProposalStatusService.getProposalStatuses({
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

exports.getProposalStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await ProposalStatusService.getProposalStatusById(id);
    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

exports.createProposalStatus = async (req, res, next) => {
  try {
    const actorId = req.user?.id;
    const status = await ProposalStatusService.createProposalStatus(req.body, actorId);
    return res.status(201).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

exports.updateProposalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const updated = await ProposalStatusService.updateProposalStatus(id, req.body, actorId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleProposalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProposalStatusService.toggleProposalStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deleteProposalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;
    const result = await ProposalStatusService.deleteProposalStatus(id, actorId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
