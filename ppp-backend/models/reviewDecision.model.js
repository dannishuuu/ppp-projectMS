const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ReviewDecisionModel {
  static async findAll(options = {}) {
    const { isActive = null, isDeleted = false } = options;
    
    let whereClause = 'WHERE is_deleted = :isDeleted';
    const replacements = { isDeleted };

    if (isActive !== null) {
      whereClause += ' AND is_active = :isActive';
      replacements.isActive = isActive;
    }

    const sql = `
      SELECT id, name, description, is_active, is_deleted, created_at, updated_at, created_by, updated_by, weight
      FROM review_decisions
      ${whereClause}
      ORDER BY weight ASC, name ASC
    `;

    const rows = await db.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows;
  }

  static async findById(id) {
    const sql = `
      SELECT id, name, description, is_active, is_deleted, created_at, updated_at, created_by, updated_by, weight
      FROM review_decisions
      WHERE id = :id AND is_deleted = FALSE
    `;
    const rows = await db.query(sql, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async create(data) {
    const { name, description, weight, createdBy } = data;
    const sql = `
      INSERT INTO review_decisions (name, description, weight, is_active, is_deleted, created_at, updated_at, created_by, updated_by)
      VALUES (:name, :description, :weight, TRUE, FALSE, NOW(), NOW(), :createdBy, :createdBy)
      RETURNING id, name, description, is_active, is_deleted, created_at, updated_at, created_by, updated_by, weight
    `;
    const rows = await db.query(sql, {
      replacements: { name, description, weight: weight || 0, createdBy },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, data) {
    const { name, description, weight, isActive, updatedBy } = data;
    const sql = `
      UPDATE review_decisions
      SET name = :name,
          description = :description,
          weight = :weight,
          is_active = :isActive,
          updated_at = NOW(),
          updated_by = :updatedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, name, description, is_active, is_deleted, created_at, updated_at, created_by, updated_by, weight
    `;
    const rows = await db.query(sql, {
      replacements: { id, name, description, weight, isActive, updatedBy },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async softDelete(id, deletedBy) {
    const sql = `
      UPDATE review_decisions
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :deletedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id
    `;
    const rows = await db.query(sql, {
      replacements: { id, deletedBy },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }
}

module.exports = ReviewDecisionModel;