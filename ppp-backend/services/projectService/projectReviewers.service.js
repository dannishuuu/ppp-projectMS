// services/projectService/projectReviewers.service.js
const ProposalReviewerModel = require('../../models/proposalReviewer.model');

class ProjectReviewersService {
  /**
   * Get all proposal reviewers with pagination and filtering.
   * @param {object} options - { page, limit, search, proposalId, status }
   */
  static async getReviewers(options = {}) {
    const { page = 1, limit = 10, search = '', proposalId = null, status = 'all', reviewerId = null } = options;
    const offset = (page - 1) * limit;

    // Build base WHERE clause
    let whereClause = 'WHERE pr.is_deleted = FALSE';
    const replacements = {};

    if (reviewerId) {
      whereClause += ' AND pr.reviewer_id = :reviewerId';
      replacements.reviewerId = reviewerId;
    }

    if (proposalId) {
      whereClause += ' AND pr.proposal_id = :proposalId';
      replacements.proposalId = proposalId;
    }

    if (status !== 'all') {
      whereClause += ' AND pr.status = :status';
      replacements.status = status;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM proposal_reviewers pr
      ${whereClause}
    `;
    const countResult = await ProposalReviewerModel.query(countQuery, replacements);
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Data query with joins
    const dataQuery = `
      SELECT 
        pr.id,
        pr.proposal_id,
        pr.reviewer_id,
        pr.assigned_by,
        pr.assigned_at,
        pr.due_date,
        pr.status,
        pr.remarks,
        pr.is_deleted,
        pr.created_at,
        pr.updated_at,
        -- Reviewer info
        u.first_name || ' ' || u.last_name AS reviewer_name,
        u.email AS reviewer_email,
        u.username AS reviewer_username,
        -- Assigned by info
        ab.first_name || ' ' || ab.last_name AS assigned_by_name,
        -- Proposal info
        pp.proposed_project_name AS proposal_name,
        -- Total approvers count for this proposal (reviewers who completed their review)
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pr.proposal_id 
         AND pr2.status = 'Completed' 
         AND pr2.is_deleted = FALSE) AS total_approvers,
        -- Total reviewers count for this proposal
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pr.proposal_id 
         AND pr2.is_deleted = FALSE) AS total_revieweers
      FROM proposal_reviewers pr
      JOIN users u ON u.id = pr.reviewer_id
      JOIN users ab ON ab.id = pr.assigned_by
      LEFT JOIN project_proposals pp ON pp.id = pr.proposal_id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const dataReplacements = {
      ...replacements,
      limit: limit,
      offset: offset,
    };

    const rows = await ProposalReviewerModel.query(dataQuery, dataReplacements);

    console.log('Backend response sample:', JSON.stringify(rows[0], null, 2));

    return {
      reviewers: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single proposal reviewer by ID.
   * @param {string} id
   */
  static async getReviewerById(id, userId = null) {
    const query = `
      SELECT 
        pr.id,
        pr.proposal_id,
        pr.reviewer_id,
        pr.assigned_by,
        pr.assigned_at,
        pr.due_date,
        pr.status,
        pr.remarks,
        pr.is_deleted,
        pr.created_at,
        pr.updated_at,
        pr.deleted_at,
        pr.deleted_by,
        -- Reviewer info
        u.first_name || ' ' || u.last_name AS reviewer_name,
        u.email AS reviewer_email,
        u.username AS reviewer_username,
        u.phone AS reviewer_phone,
        -- Assigned by info
        ab.first_name || ' ' || ab.last_name AS assigned_by_name,
        ab.email AS assigned_by_email,
        -- Proposal info
        pp.proposed_project_name AS proposal_name,
        pp.description AS proposal_description,
        pp.status_id AS proposal_status_id,
        ps.name AS proposal_status_name,
        -- Total approvers count for this proposal (reviewers who completed their review)
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pr.proposal_id 
         AND pr2.status = 'Completed' 
         AND pr2.is_deleted = FALSE) AS total_approvers,
        -- Total reviewers count for this proposal
        (SELECT COUNT(*) FROM proposal_reviewers pr2 
         WHERE pr2.proposal_id = pr.proposal_id 
         AND pr2.is_deleted = FALSE) AS total_revieweers
      FROM proposal_reviewers pr
      JOIN users u ON u.id = pr.reviewer_id
      JOIN users ab ON ab.id = pr.assigned_by
      LEFT JOIN project_proposals pp ON pp.id = pr.proposal_id
      LEFT JOIN proposal_statuses ps ON ps.id = pp.status_id
      WHERE pr.id = :id AND pr.is_deleted = FALSE
    `;

    const rows = await ProposalReviewerModel.query(query, { id });
    
    if (rows.length === 0) {
      const err = new Error('Proposal reviewer not found.');
      err.status = 404;
      throw err;
    }

    const reviewer = rows[0];

    if (userId && reviewer.reviewer_id !== userId) {
      const err = new Error('You are not authorized to access this review.');
      err.status = 403;
      throw err;
    }

    return reviewer;
  }

  /**
   * Get reviewers by proposal ID.
   * @param {string} proposalId
   */
  static async getReviewersByProposalId(proposalId) {
    return ProposalReviewerModel.findByProposalId(proposalId);
  }

  /**
   * Update review status (approve/reject).
   * @param {string} id
   * @param {string} status - 'Approved' or 'Rejected'
   * @param {string} [remarks]
   * @param {string} [actorId]
   * @param {string} [decisionId]
   */
  static async updateReviewStatus(id, status, remarks = '', actorId = null, decisionId = null) {
    const query = `
      UPDATE proposal_reviewers
      SET status = :status,
          remarks = :remarks,
          decision_id = :decisionId,
          updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE AND status = 'Pending'
        ${actorId ? 'AND reviewer_id = :actorId' : ''}
      RETURNING id, proposal_id, reviewer_id, status, remarks, decision_id, updated_at
    `;

    const replacements = { id, status, remarks, decisionId };
    if (actorId) replacements.actorId = actorId;

    const rows = await ProposalReviewerModel.query(query, replacements);

    if (rows.length === 0) {
      const err = new Error(actorId
        ? 'Review not found, already processed, or you are not assigned as the reviewer.'
        : 'Review not found or already processed.');
      err.status = actorId ? 403 : 400;
      throw err;
    }

    return rows[0];
  }
}

module.exports = ProjectReviewersService;