// services/projectService/projectProposal.service.js
const ProjectProposalModel = require('../../models/projectProposal.model');
const ProposalCategoryModel = require('../../models/proposalCategory.model');
const ProposalReviewerModel = require('../../models/proposalReviewer.model');
const ProposalStatusModel   = require('../../models/proposalStatus.model');
const db = require('../../config/database');

class ProjectProposalService {
  /**
   * Get a paginated, filtered list of project proposals.
   * @param {object} options - { page, limit, search, statusId, organizationId, categoryId }
   */
  static async getProposals(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId = null,
      organizationId = null,
      categoryId = null,
    } = options;

    const offset = (page - 1) * limit;

    const { rows, total } = await ProjectProposalModel.findAll({
      limit,
      offset,
      search,
      statusId,
      organizationId,
      categoryId,
    });

    return {
      proposals: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single proposal by UUID.
   * @param {string} id
   */
  static async getProposalById(id) {
    const proposal = await ProjectProposalModel.findById(id);
    if (!proposal) {
      const err = new Error('Project proposal not found.');
      err.status = 404;
      throw err;
    }
    return proposal;
  }

  /**
   * Create a new project proposal.
   * @param {object} payload
   * @param {string} actorId
   */
  static async createProposal(payload, actorId) {
    const { organizationId, statusId, proposedProjectName, categoryIds } = payload;

    if (!proposedProjectName || !proposedProjectName.trim()) {
      const err = new Error('Proposed project name is required.');
      err.status = 400;
      throw err;
    }
    if (!organizationId) {
      const err = new Error('Organization is required.');
      err.status = 400;
      throw err;
    }
    if (!statusId) {
      const err = new Error('Proposal status is required.');
      err.status = 400;
      throw err;
    }

    const created = await ProjectProposalModel.create({
      organizationId,
      statusId,
      proposedProjectName:   proposedProjectName.trim(),
      description:           payload.description           || null,
      landRequested:         payload.landRequested         || null,
      proposedCapitalAmount: payload.proposedCapitalAmount ?? null,
      currencyId:            payload.currencyId            || null,
      remarks:               payload.remarks               || null,
      attachedDocuments:     payload.attachedDocuments     || null,
      submittedAt:           payload.submittedAt           || null,
      createdBy: actorId,
    });

    // Assign categories if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await ProposalCategoryModel.bulkAssign(created.id, categoryIds);
    }

    return this.getProposalById(created.id);
  }

  /**
   * Update an existing project proposal.
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updateProposal(id, payload, actorId) {
    await this.getProposalById(id);

    if (payload.proposedProjectName !== undefined && !payload.proposedProjectName?.trim()) {
      const err = new Error('Proposed project name cannot be empty.');
      err.status = 400;
      throw err;
    }

    const updated = await ProjectProposalModel.update(id, {
      organizationId:        payload.organizationId,
      statusId:              payload.statusId,
      proposedProjectName:   payload.proposedProjectName?.trim(),
      description:           payload.description,
      landRequested:         payload.landRequested,
      proposedCapitalAmount: payload.proposedCapitalAmount,
      currencyId:            payload.currencyId,
      remarks:               payload.remarks,
      attachedDocuments:     payload.attachedDocuments,
      submittedAt:           payload.submittedAt,
      convertedProjectId:    payload.convertedProjectId,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    // Update categories if provided
    if (payload.categoryIds !== undefined) {
      if (Array.isArray(payload.categoryIds) && payload.categoryIds.length > 0) {
        await ProposalCategoryModel.bulkAssign(id, payload.categoryIds);
      } else {
        // If empty array provided, delete all categories
        await ProposalCategoryModel.deleteByProposalId(id);
      }
    }

    return this.getProposalById(id);
  }

  /**
   * Change only the status of a proposal (quick status transitions).
   * @param {string} id
   * @param {string} statusId
   * @param {string} actorId
   */
  static async changeStatus(id, statusId, actorId) {
    if (!statusId) {
      const err = new Error('Status ID is required.');
      err.status = 400;
      throw err;
    }
    await this.getProposalById(id);

    await ProjectProposalModel.update(id, { statusId, updatedBy: actorId });
    return this.getProposalById(id);
  }

  /**
   * Submit a proposal for review:
   *   1. Validates reviewerIds are provided.
   *   2. Bulk-assigns reviewers into proposal_reviewers.
   *   3. Finds the status with step = 1, updates the proposal status + submitted_at.
   *
   * @param {string}   id          - proposal UUID
   * @param {string[]} reviewerIds - array of user UUIDs to assign as reviewers
   * @param {string}   [dueDate]   - optional ISO date string for reviewer due date
   * @param {string}   actorId     - authenticated user performing the submission
   */
  static async submitProposal(id, reviewerIds, dueDate, actorId) {
    // 1. Validate proposal exists
    const proposal = await this.getProposalById(id);

    if (proposal.submitted_at) {
      const err = new Error('Proposal has already been submitted.');
      err.status = 409;
      throw err;
    }

    // 2. Validate at least one reviewer
    if (!reviewerIds || reviewerIds.length === 0) {
      const err = new Error('At least one reviewer must be assigned before submitting.');
      err.status = 400;
      throw err;
    }

    // 3. Find the step=1 status (the "under review" state)
    const step1Status = await ProposalStatusModel.findByStep(1);
    if (!step1Status) {
      const err = new Error('No workflow status with step 1 is configured. Please set up the next review step in the Foundation settings.');
      err.status = 422;
      throw err;
    }

    // 4. Bulk-assign reviewers
    const assignments = reviewerIds.map((reviewerId) => ({
      proposalId: id,
      reviewerId,
      assignedBy: actorId,
      dueDate: dueDate || null,
    }));
    await ProposalReviewerModel.bulkAssign(assignments);

    // 5. Update proposal: status → step 1, submitted_at → now
    await ProjectProposalModel.update(id, {
      statusId:    step1Status.id,
      submittedAt: new Date().toISOString(),
      updatedBy:   actorId,
    });

    return this.getProposalById(id);
  }

  /**
   * Get assigned reviewers for a proposal.
   * @param {string} id - proposal UUID
   */
  static async getProposalReviewers(id) {
    await this.getProposalById(id);
    return ProposalReviewerModel.findByProposalId(id);
  }

  /**
   * Soft delete a proposal.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteProposal(id, actorId) {
    const proposal = await this.getProposalById(id);
    await ProjectProposalModel.softDelete(id, actorId);
    return { message: `Proposal "${proposal.proposed_project_name}" deleted successfully.` };
  }
}

module.exports = ProjectProposalService;
