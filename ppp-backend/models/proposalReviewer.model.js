// models/proposalReviewer.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProposalReviewerModel {
  /**
   * Generic query execution helper.
   * @param {string} query
   * @param {object} replacements
   */
  static async query(query, replacements = {}) {
    return db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Bulk insert reviewer assignments.
   * @param {Array<{ proposalId: string, reviewerId: string, assignedBy: string, dueDate?: string }>} assignments
   * @param {object} [transaction] - Optional Sequelize transaction object
   */
  static async bulkAssign(assignments, transaction = null) {
    if (!assignments || assignments.length === 0) return [];

    const valueStrings = [];
    const replacements = {};

    assignments.forEach((assign, index) => {
      const dueDateValue = assign.dueDate ? `:dueDate_${index}::timestamptz` : 'NULL';
      valueStrings.push(`(:proposalId_${index}, :reviewerId_${index}, :assignedBy_${index}, ${dueDateValue})`);
      replacements[`proposalId_${index}`] = assign.proposalId;
      replacements[`reviewerId_${index}`] = assign.reviewerId;
      replacements[`assignedBy_${index}`] = assign.assignedBy;
      if (assign.dueDate) {
        replacements[`dueDate_${index}`] = assign.dueDate;
      }
    });

    const query = `
      INSERT INTO proposal_reviewers (proposal_id, reviewer_id, assigned_by, due_date)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (proposal_id, reviewer_id) DO UPDATE 
      SET status = 'Pending', updated_at = NOW()
      RETURNING id, proposal_id, reviewer_id
    `;

    return db.query(query, {
      replacements,
      type: QueryTypes.INSERT,
      transaction,
    });
  }

  /**
   * Find by ID.
   */
  static async findById(id) {
    const query = `
      SELECT pr.*, 
             u.first_name || ' ' || u.last_name AS reviewer_name,
             u.email AS reviewer_email,
             ab.first_name || ' ' || ab.last_name AS assigned_by_name
      FROM proposal_reviewers pr
      JOIN users u ON u.id = pr.reviewer_id
      JOIN users ab ON ab.id = pr.assigned_by
      WHERE pr.id = :id AND pr.is_deleted = FALSE
    `;
    const result = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return result[0] || null;
  }

  /**
   * Update status.
   */
  static async updateStatus(id, status, userId = null) {
    const query = `
      UPDATE proposal_reviewers
      SET status = :status,
          updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, proposal_id, reviewer_id, status
    `;
    const result = await db.query(query, {
      replacements: { id, status },
      type: QueryTypes.UPDATE,
    });
    return result[0] || null;
  }

  /**
   * List assignments for a proposal.
   */
  static async findByProposalId(proposalId) {
    const query = `
      SELECT pr.*, 
             u.first_name || ' ' || u.last_name AS reviewer_name,
             u.email AS reviewer_email,
             ab.first_name || ' ' || ab.last_name AS assigned_by_name
      FROM proposal_reviewers pr
      JOIN users u ON u.id = pr.reviewer_id
      JOIN users ab ON ab.id = pr.assigned_by
      WHERE pr.proposal_id = :proposalId AND pr.is_deleted = FALSE
    `;
    return db.query(query, {
      replacements: { proposalId },
      type: QueryTypes.SELECT,
    });
  }
}

module.exports = ProposalReviewerModel;
