const ProposalReviewModel = require('../models/proposalReview.model');
const ProposalReviewerModel = require('../models/proposalReviewer.model');
const ProjectProposalModel = require('../models/projectProposal.model');
const ProposalStatusModel = require('../models/proposalStatus.model');

class ProposalReviewService {
  static async submitReview(data) {
    const { assignmentId, decisionId, comments, userId } = data;

    // Get the reviewer assignment
    const assignment = await ProposalReviewerModel.findById(assignmentId);
    if (!assignment) {
      const err = new Error('Review assignment not found');
      err.status = 404;
      throw err;
    }

    if (assignment.status !== 'Pending') {
      const err = new Error('This review has already been submitted');
      err.status = 400;
      throw err;
    }

    // Create the review record
    const review = await ProposalReviewModel.create({
      proposalId: assignment.proposal_id,
      reviewerId: assignment.reviewer_id,
      decisionId,
      comments,
      assignmentId,
    });

    // Update the reviewer assignment status to Completed
    await ProposalReviewerModel.updateStatus(assignmentId, 'Completed', userId);

    // Update proposal status to step 2 if not already >= 2
    const proposal = await ProjectProposalModel.findById(assignment.proposal_id);
    if (proposal && proposal.status_step < 2) {
      // Get the "Under Review" status (step = 2)
      const underReviewStatus = await ProposalStatusModel.findByStep(2);
      if (underReviewStatus) {
        await ProjectProposalModel.updateStatus(assignment.proposal_id, underReviewStatus.id, userId);
      }
    }

    return review;
  }

  static async getReviewsByProposalId(proposalId) {
    return ProposalReviewModel.findByProposalId(proposalId);
  }

  static async getReviewByAssignmentId(assignmentId) {
    return ProposalReviewModel.findByAssignmentId(assignmentId);
  }
}

module.exports = ProposalReviewService;