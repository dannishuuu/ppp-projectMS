// models/projectTrackingArea.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectTrackingAreaModel {
  /**
   * Find tracking areas under a project tracking type (Level 2).
   */
  static async findByTrackingTypeId(projectTrackingTypeId) {
    const query = `
      SELECT
        pta.id,
        pta.project_tracking_type_id,
        pta.tracking_area_id,
        pta.weight,
        pta.created_at,
        pta.updated_at,
        ta.name        AS tracking_area_name,
        ta.description AS tracking_area_description,
        ta.parent_id   AS tracking_area_parent_id,

        -- Aggregated checklists count and completion
        COALESCE(
          (SELECT COUNT(*) FROM project_tracking_checklists ptc
           WHERE ptc.project_tracking_area_id = pta.id AND ptc.is_deleted = FALSE), 0
        ) AS checklists_count,
        COALESCE(
          (SELECT COUNT(*) FROM project_tracking_checklists ptc
           WHERE ptc.project_tracking_area_id = pta.id AND ptc.is_completed = TRUE AND ptc.is_deleted = FALSE), 0
        ) AS completed_checklists_count
      FROM project_tracking_areas pta
      JOIN tracking_areas ta ON ta.id = pta.tracking_area_id
      WHERE pta.project_tracking_type_id = :projectTrackingTypeId AND pta.is_deleted = FALSE
      ORDER BY ta.name ASC
    `;

    return await db.query(query, {
      replacements: { projectTrackingTypeId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Find single tracking area by id.
   */
  static async findById(id) {
    const query = `
      SELECT
        pta.*,
        ta.name AS tracking_area_name,
        ta.description AS tracking_area_description
      FROM project_tracking_areas pta
      JOIN tracking_areas ta ON ta.id = pta.tracking_area_id
      WHERE pta.id = :id AND pta.is_deleted = FALSE
      LIMIT 1
    `;

    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Upsert a tracking area record.
   */
  static async upsert(data, clientOptions = {}) {
    const { projectTrackingTypeId, trackingAreaId, weight, actorId = null } = data;

    const query = `
      INSERT INTO project_tracking_areas (
        project_tracking_type_id,
        tracking_area_id,
        weight,
        created_by,
        updated_by
      ) VALUES (
        :projectTrackingTypeId,
        :trackingAreaId,
        :weight,
        :actorId,
        :actorId
      )
      ON CONFLICT (project_tracking_type_id, tracking_area_id)
      DO UPDATE SET
        weight = :weight,
        is_deleted = FALSE,
        updated_at = NOW(),
        updated_by = :actorId
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectTrackingTypeId, trackingAreaId, weight, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Update weight for an area.
   */
  static async updateWeight(id, weight, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_areas
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
   * Soft-delete a tracking area.
   */
  static async delete(id, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_areas
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

module.exports = ProjectTrackingAreaModel;
