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

  /**
   * Get review decision statistics for a proposal
   * Returns count and percentage for each decision
   */
  static async getReviewStatistics(proposalId) {
    const sql = `
      SELECT 
        rd.id as decision_id,
        rd.name as decision_name,
        rd.description as decision_description,
        rd.weight as decision_weight,
        COUNT(pr.id) as count,
        ROUND((COUNT(pr.id)::numeric / (SELECT COUNT(*) FROM proposal_reviews WHERE proposal_id = :proposalId AND is_deleted = FALSE)::numeric) * 100, 2) as percentage
      FROM proposal_reviews pr
      JOIN review_decisions rd ON rd.id = pr.decision_id
      WHERE pr.proposal_id = :proposalId AND pr.is_deleted = FALSE
      GROUP BY rd.id, rd.name, rd.description, rd.weight
      ORDER BY rd.weight DESC, rd.name ASC
    `;
    
    const result = await ProposalReviewModel.query(sql, { proposalId });
    
    // Also get total reviewers count
    const totalSql = `
      SELECT COUNT(*) as total
      FROM proposal_reviews
      WHERE proposal_id = :proposalId AND is_deleted = FALSE
    `;
    const totalResult = await ProposalReviewModel.query(totalSql, { proposalId });
    const total = parseInt(totalResult[0]?.total || 0, 10);
    
    return {
      statistics: result,
      total,
    };
  }

  /**
   * Proceed with proposal based on review statistics
   * Automatically determines next status or requires manual selection on tie
   */
  static async proceedProposal(proposalId, manualStatusId = null, userId = null) {
    // Get review statistics
    const { statistics } = await this.getReviewStatistics(proposalId);
    
    if (!statistics || statistics.length === 0) {
      const err = new Error('No review statistics available for this proposal');
      err.status = 400;
      throw err;
    }

    // Group by weight and calculate totals
    const weightGroups = {
      positive: { count: 0, percentage: 0 }, // weight = 1
      neutral: { count: 0, percentage: 0 },  // weight = 0
      negative: { count: 0, percentage: 0 }, // weight = -1
    };

    statistics.forEach(stat => {
      const weight = parseInt(stat.decision_weight, 10);
      const count = parseInt(stat.count, 10);
      const percentage = parseFloat(stat.percentage || 0);

      if (weight === 1) {
        weightGroups.positive.count += count;
        weightGroups.positive.percentage += percentage;
      } else if (weight === 0) {
        weightGroups.neutral.count += count;
        weightGroups.neutral.percentage += percentage;
      } else if (weight === -1) {
        weightGroups.negative.count += count;
        weightGroups.negative.percentage += percentage;
      }
    });

    // Determine which weight group has highest percentage
    const maxPercentage = Math.max(
      weightGroups.positive.percentage,
      weightGroups.neutral.percentage,
      weightGroups.negative.percentage
    );

    // Check for tie (multiple groups with same max percentage)
    const tiedGroups = [];
    if (weightGroups.positive.percentage === maxPercentage) tiedGroups.push('positive');
    if (weightGroups.neutral.percentage === maxPercentage) tiedGroups.push('neutral');
    if (weightGroups.negative.percentage === maxPercentage) tiedGroups.push('negative');

    // If there's a tie and no manual selection provided, require manual selection
    if (tiedGroups.length > 1 && !manualStatusId) {
      const err = new Error('Multiple decisions have equal percentages. Manual selection required.');
      err.status = 409; // Conflict status
      err.requiresManualSelection = true;
      err.tiedGroups = tiedGroups;
      err.weightGroups = weightGroups;
      throw err;
    }

    let targetStep;

    // If manual status provided, use it
    if (manualStatusId) {
      // Update proposal status directly with provided status
      await ProjectProposalModel.updateStatus(proposalId, manualStatusId, userId);
      return {
        message: 'Proposal status updated successfully with manual selection',
        statusId: manualStatusId,
        wasManual: true,
      };
    }

    // Otherwise, determine automatically based on winner
    if (weightGroups.positive.percentage === maxPercentage) {
      targetStep = 3; // Approved
    } else if (weightGroups.neutral.percentage === maxPercentage) {
      targetStep = 5; // Pending Further Review
    } else if (weightGroups.negative.percentage === maxPercentage) {
      targetStep = 4; // Rejected
    }

    // Find status by step
    const targetStatus = await ProposalStatusModel.findByStep(targetStep);
    if (!targetStatus) {
      const err = new Error(`No status configured for step ${targetStep}`);
      err.status = 422;
      throw err;
    }

    // Update proposal status
    await ProjectProposalModel.updateStatus(proposalId, targetStatus.id, userId);

    return {
      message: 'Proposal status updated successfully based on review decisions',
      statusId: targetStatus.id,
      statusName: targetStatus.name,
      step: targetStep,
      wasManual: false,
      weightGroups,
    };
  }
}

module.exports = ProposalReviewService;