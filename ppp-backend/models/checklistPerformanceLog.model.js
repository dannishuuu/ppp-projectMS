// models/checklistPerformanceLog.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ChecklistPerformanceLogModel {
  /**
   * Find performance logs for a specific checklist item.
   */
  static async findByChecklistId(projectTrackingChecklistId) {
    const query = `
      SELECT
        cpl.id,
        cpl.project_tracking_checklist_id,
        cpl.period_date,
        cpl.performance_value,
        cpl.remarks,
        cpl.log_version,
        cpl.created_at,
        cpl.updated_at,
        TRIM(u.first_name || ' ' || u.last_name) AS created_by_name
      FROM checklist_performance_logs cpl
      LEFT JOIN users u ON u.id = cpl.created_by
      WHERE cpl.project_tracking_checklist_id = :projectTrackingChecklistId
        AND cpl.is_deleted = FALSE
      ORDER BY cpl.period_date DESC, cpl.log_version DESC
    `;

    return await db.query(query, {
      replacements: { projectTrackingChecklistId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Create a new snapshot log.
   */
  static async create(data, clientOptions = {}) {
    const {
      projectTrackingChecklistId,
      periodDate,
      performanceValue,
      remarks = null,
      actorId = null,
    } = data;

    // log_version is auto-assigned by database trigger fn_set_checklist_perf_log_version()
    const query = `
      INSERT INTO checklist_performance_logs (
        project_tracking_checklist_id,
        period_date,
        performance_value,
        remarks,
        log_version,
        created_by,
        updated_by
      ) VALUES (
        :projectTrackingChecklistId,
        :periodDate,
        :performanceValue,
        :remarks,
        0, -- dummy initial value, replaced by trigger
        :actorId,
        :actorId
      )
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        projectTrackingChecklistId,
        periodDate,
        performanceValue,
        remarks,
        actorId,
      },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Soft-delete a log record.
   */
  static async delete(id, actorId, clientOptions = {}) {
    const query = `
      UPDATE checklist_performance_logs
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

module.exports = ChecklistPerformanceLogModel;
