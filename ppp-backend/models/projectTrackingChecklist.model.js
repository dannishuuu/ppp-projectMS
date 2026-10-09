// models/projectTrackingChecklist.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectTrackingChecklistModel {
  /**
   * Find checklists under a project tracking area (Level 3).
   */
  static async findByTrackingAreaId(projectTrackingAreaId) {
    const query = `
      SELECT
        ptc.id,
        ptc.project_tracking_area_id,
        ptc.checklist_id,
        ptc.weight,
        ptc.is_completed,
        ptc.completed_at,
        ptc.completed_by,
        ptc.notes,
        ptc.created_at,
        ptc.updated_at,
        chk.name        AS checklist_name,
        chk.description AS checklist_description,
        TRIM(u.first_name || ' ' || u.last_name) AS completed_by_name,

        -- Most recent performance log snapshot
        (SELECT JSON_BUILD_OBJECT(
          'id', cpl.id,
          'period_date', cpl.period_date,
          'performance_value', cpl.performance_value,
          'remarks', cpl.remarks,
          'log_version', cpl.log_version
        )
        FROM checklist_performance_logs cpl
        WHERE cpl.project_tracking_checklist_id = ptc.id AND cpl.is_deleted = FALSE
        ORDER BY cpl.period_date DESC, cpl.log_version DESC
        LIMIT 1) AS latest_performance_log
      FROM project_tracking_checklists ptc
      JOIN checklists chk ON chk.id = ptc.checklist_id
      LEFT JOIN users u   ON u.id   = ptc.completed_by
      WHERE ptc.project_tracking_area_id = :projectTrackingAreaId AND ptc.is_deleted = FALSE
      ORDER BY chk.name ASC
    `;

    return await db.query(query, {
      replacements: { projectTrackingAreaId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Find single checklist by id.
   */
  static async findById(id) {
    const query = `
      SELECT
        ptc.*,
        chk.name AS checklist_name,
        chk.description AS checklist_description,
        TRIM(u.first_name || ' ' || u.last_name) AS completed_by_name
      FROM project_tracking_checklists ptc
      JOIN checklists chk ON chk.id = ptc.checklist_id
      LEFT JOIN users u   ON u.id   = ptc.completed_by
      WHERE ptc.id = :id AND ptc.is_deleted = FALSE
      LIMIT 1
    `;

    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Upsert a tracking checklist item.
   */
  static async upsert(data, clientOptions = {}) {
    const { projectTrackingAreaId, checklistId, weight, actorId = null, notes = null } = data;

    const query = `
      INSERT INTO project_tracking_checklists (
        project_tracking_area_id,
        checklist_id,
        weight,
        notes,
        created_by,
        updated_by
      ) VALUES (
        :projectTrackingAreaId,
        :checklistId,
        :weight,
        :notes,
        :actorId,
        :actorId
      )
      ON CONFLICT (project_tracking_area_id, checklist_id)
      DO UPDATE SET
        weight = :weight,
        notes = COALESCE(:notes, project_tracking_checklists.notes),
        is_deleted = FALSE,
        updated_at = NOW(),
        updated_by = :actorId
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectTrackingAreaId, checklistId, weight, notes, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Toggle completion state.
   */
  static async toggleCompletion(id, isCompleted, notes = null, actorId = null) {
    const query = `
      UPDATE project_tracking_checklists
      SET is_completed = :isCompleted,
          completed_at = CASE WHEN :isCompleted = TRUE THEN NOW() ELSE NULL END,
          completed_by = CASE WHEN :isCompleted = TRUE THEN :actorId ELSE NULL END,
          notes = COALESCE(:notes, notes),
          updated_at = NOW(),
          updated_by = :actorId
      WHERE id = :id AND is_deleted = FALSE
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { id, isCompleted, notes, actorId },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Update weight.
   */
  static async updateWeight(id, weight, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_checklists
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
   * Soft-delete a checklist item.
   */
  static async delete(id, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_tracking_checklists
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

module.exports = ProjectTrackingChecklistModel;
