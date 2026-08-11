const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProposalReviewModel {
  static async query(sql, replacements = {}) {
    try {
      const result = await db.query(sql, {
        replacements,
        type: QueryTypes.SELECT
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async execute(sql, replacements = {}) {
    try {
      const result = await db.query(sql, {
        replacements,
        type: QueryTypes.INSERT
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async create(data) {
    const { proposalId, reviewerId, decisionId, comments, assignmentId } = data;
    const sql = `
      INSERT INTO proposal_reviews (
        proposal_id, reviewer_id, decision_id, comments, reviewed_at, is_deleted, created_at, updated_at, assignment_id
      )
      VALUES (
        :proposalId, :reviewerId, :decisionId, :comments, NOW(), FALSE, NOW(), NOW(), :assignmentId
      )
      RETURNING id, proposal_id, reviewer_id, decision_id, comments, reviewed_at, is_deleted, created_at, updated_at, assignment_id
    `;
    const result = await this.execute(sql, { proposalId, reviewerId, decisionId, comments, assignmentId });
    return result[0];
  }

  static async findByAssignmentId(assignmentId) {
    const sql = `
      SELECT id, proposal_id, reviewer_id, decision_id, comments, reviewed_at, is_deleted, created_at, updated_at, deleted_at, assignment_id
      FROM proposal_reviews
      WHERE assignment_id = :assignmentId AND is_deleted = FALSE
    `;
    const result = await this.query(sql, { assignmentId });
    return result[0] || null;
  }

  static async findByProposalId(proposalId) {
    const sql = `
      SELECT pr.id, pr.proposal_id, pr.reviewer_id, pr.decision_id, pr.comments, pr.reviewed_at, 
             pr.is_deleted, pr.created_at, pr.updated_at, pr.deleted_at, pr.assignment_id,
             rd.name as decision_name, rd.description as decision_description,
             u.first_name || ' ' || u.last_name as reviewer_name, u.email as reviewer_email
      FROM proposal_reviews pr
      LEFT JOIN review_decisions rd ON rd.id = pr.decision_id
      JOIN users u ON u.id = pr.reviewer_id
      WHERE pr.proposal_id = :proposalId AND pr.is_deleted = FALSE
      ORDER BY pr.created_at DESC
    `;
    const result = await this.query(sql, { proposalId });
    return result;
  }
}

module.exports = ProposalReviewModel;