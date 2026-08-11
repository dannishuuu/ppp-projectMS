// models/proposalCategory.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProposalCategoryModel {
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
   * Bulk assign categories to a proposal.
   * @param {string} proposalId
   * @param {Array<string>} categoryIds
   */
  static async bulkAssign(proposalId, categoryIds) {
    if (!categoryIds || categoryIds.length === 0) return [];

    // First, delete existing categories for this proposal
    await db.query(
      `DELETE FROM proposal_categories WHERE proposal_id = :proposalId`,
      { replacements: { proposalId } }
    );

    // Then insert new categories
    const valueStrings = [];
    const replacements = { proposalId };

    categoryIds.forEach((categoryId, index) => {
      valueStrings.push(`(:proposalId, :categoryId_${index})`);
      replacements[`categoryId_${index}`] = categoryId;
    });

    const query = `
      INSERT INTO proposal_categories (proposal_id, category_id)
      VALUES ${valueStrings.join(', ')}
      RETURNING id, proposal_id, category_id
    `;

    return db.query(query, {
      replacements,
      type: QueryTypes.INSERT,
    });
  }

  /**
   * Get all categories for a proposal.
   * @param {string} proposalId
   */
  static async findByProposalId(proposalId) {
    const query = `
      SELECT 
        pc.id,
        pc.proposal_id,
        pc.category_id,
        cat.name as category_name,
        cat.description as category_description
      FROM proposal_categories pc
      JOIN project_categories cat ON cat.id = pc.category_id
      WHERE pc.proposal_id = :proposalId
      ORDER BY cat.name ASC
    `;
    return this.query(query, { proposalId });
  }

  /**
   * Delete categories for a proposal.
   * @param {string} proposalId
   */
  static async deleteByProposalId(proposalId) {
    await db.query(
      `DELETE FROM proposal_categories WHERE proposal_id = :proposalId`,
      { replacements: { proposalId } }
    );
  }

  /**
   * Get category IDs for a proposal (simple array).
   * @param {string} proposalId
   */
  static async getCategoryIds(proposalId) {
    const query = `
      SELECT category_id
      FROM proposal_categories
      WHERE proposal_id = :proposalId
    `;
    const rows = await this.query(query, { proposalId });
    return rows.map(row => row.category_id);
  }
}

module.exports = ProposalCategoryModel;
