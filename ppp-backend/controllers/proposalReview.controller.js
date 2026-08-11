const ProposalReviewService = require('../services/proposalReview.service');

exports.submitReview = async (req, res, next) => {
  try {
    const { decisionId, comments } = req.body;
    const assignmentId = req.params.id;
    const userId = req.user?.id;

    const review = await ProposalReviewService.submitReview({
      assignmentId,
      decisionId,
      comments,
      userId,
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.getReviewsByProposalId = async (req, res, next) => {
  try {
    const reviews = await ProposalReviewService.getReviewsByProposalId(req.params.proposalId);
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.getReviewByAssignmentId = async (req, res, next) => {
  try {
    const review = await ProposalReviewService.getReviewByAssignmentId(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.getReviewStatistics = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const statistics = await ProposalReviewService.getReviewStatistics(proposalId);
    return res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    next(error);
  }
};

exports.proceedProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { manualStatusId } = req.body;
    const userId = req.user?.id;
    
    const result = await ProposalReviewService.proceedProposal(proposalId, manualStatusId, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Handle tie situation specially
    if (error.requiresManualSelection) {
      return res.status(409).json({
        success: false,
        requiresManualSelection: true,
        message: error.message,
        tiedGroups: error.tiedGroups,
        weightGroups: error.weightGroups,
      });
    }
    next(error);
  }
};
