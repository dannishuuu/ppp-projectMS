// models/projectTrackingType.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectTrackingTypeModel {
  /**
   * Find tracking types assigned to a project (Level 1).
   */
  static async findByProjectId(projectId) {
    const query = `
      SELECT
        ptt.id,
        ptt.project_id,
        ptt.tracking_item_type_id,
        ptt.weight,
        ptt.created_at,
        ptt.updated_at,
        tit.code        AS tracking_item_type_code,
        tit.name        AS tracking_item_type_name,
        tit.description AS tracking_item_type_description,
        tit.is_wbs      AS is_wbs,
        tit.is_leaf     AS is_leaf,

        -- Aggregated areas count
        COALESCE(
          (SELECT COUNT(*) FROM project_tracking_areas pta
           WHERE pta.project_tracking_type_id = ptt.id AND pta.is_deleted = FALSE), 0
        ) AS areas_count
      FROM project_tracking_types ptt
      JOIN tracking_item_types tit ON tit.id = ptt.tracking_item_type_id
      WHERE ptt.project_id = :projectId AND ptt.is_deleted = FALSE
      ORDER BY tit.name ASC
    `;

    return await db.query(query, {
      replacements: { projectId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Find single tracking type by id.
   */
  static async findById(id) {
    const query = `
      SELECT
        ptt.*,
        tit.code AS tracking_item_type_code,
        tit.name AS tracking_item_type_name
      FROM project_tracking_types ptt
      JOIN tracking_item_types tit ON tit.id = ptt.tracking_item_type_id
      WHERE ptt.id = :id AND ptt.is_deleted = FALSE
      LIMIT 1
    `;

    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Create or update a project tracking type.
   */
  static async upsert(data, clientOptions = {}) {
    const { projectId, trackingItemTypeId, weight, actorId = null } = data;

    const query = `
      INSERT INTO project_tracking_types (
        project_id,
        tracking_item_type_id,
        weight,
        created_by,
        updated_by
      ) VALUES (
        :projectId,
        :trackingItemTypeId,
        :weight,
        :actorId,
        :actorId
      )
      ON CONFLICT (project_id, tracking_item_type_id)
      DO UPDATE SET
        weight = :weight,
        is_deleted = FALSE,
        updated_at = NOW(),
        updated_by = :actorId
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectId, trackingItemTypeId, weight, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Update weight for a tracking type.
   */
  static async updateWeight(id, weight, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_types
      SET weight = :weight,
          updated_at = NOW(),
          updated_by = :actorId
      WHERE id = :id AND is_deleted = FALSE
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { id, weight, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0] || null;
  }

  /**
   * Soft-delete a tracking type.
   */
  static async delete(id, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_types
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :actorId
      WHERE id = :id AND is_deleted = FALSE
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { id, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0] || null;
  }
}

module.exports = ProjectTrackingTypeModel;
