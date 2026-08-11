// models/documentSequence.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class DocumentSequenceModel {
  /**
   * Find sequence record by entityType and optional year
   */
  static async findByEntity(entityType) {
    const query = `
      SELECT * FROM document_sequences
      WHERE entity_type = :entityType 
        AND is_deleted = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const rows = await db.query(query, {
      replacements: { entityType },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Create a new sequence configuration record
   */
  static async create(data) {
    const {
      entityType,
      prefix,
      suffix = null,
      nextSequence = 1,
      paddingLength = 4,
      currentYear = null,
      resetYearly = false,
      createdBy = null,
    } = data;

    const query = `
      INSERT INTO document_sequences (
        entity_type, prefix, suffix, next_sequence, padding_length,
        current_year, reset_yearly, created_by, updated_by
      ) VALUES (
        :entityType, :prefix, :suffix, :nextSequence, :paddingLength,
        :currentYear, :resetYearly, :createdBy, :createdBy
      )
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        entityType,
        prefix,
        suffix,
        nextSequence,
        paddingLength,
        currentYear,
        resetYearly,
        createdBy,
      },
      type: QueryTypes.SELECT,
    });

    return rows[0];
  }

  /**
   * Atomically increment and return updated sequence record
   */
  static async incrementAndGet(id) {
    const query = `
      UPDATE document_sequences
      SET next_sequence = next_sequence + 1,
          updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Update year and reset sequence number to 2 (since 1 is consumed for the current document)
   */
  static async resetForYear(id, newYear) {
    const query = `
      UPDATE document_sequences
      SET next_sequence = 2,
          current_year = :newYear,
          updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: { id, newYear },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }
}

module.exports = DocumentSequenceModel;
