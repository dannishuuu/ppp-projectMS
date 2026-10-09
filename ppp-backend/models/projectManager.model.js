// models/projectManager.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectManagerModel {
  /**
   * Find project managers for a project (active or all history).
   */
  static async findByProjectId(projectId, includeHistorical = false) {
    let where = `WHERE pm.project_id = :projectId AND pm.is_deleted = FALSE`;
    if (!includeHistorical) {
      where += ` AND pm.unassigned_at IS NULL`;
    }

    const query = `
      SELECT
        pm.id,
        pm.project_id,
        pm.user_id,
        pm.assigned_at,
        pm.assigned_by,
        pm.unassigned_at,
        pm.unassigned_by,
        pm.remarks,
        TRIM(u.first_name || ' ' || u.last_name) AS manager_name,
        u.email                                  AS manager_email,
        u.phone                                  AS manager_phone,
        TRIM(assigner.first_name || ' ' || assigner.last_name) AS assigned_by_name,
        TRIM(unassigner.first_name || ' ' || unassigner.last_name) AS unassigned_by_name
      FROM project_managers pm
      JOIN users u               ON u.id = pm.user_id
      LEFT JOIN users assigner   ON assigner.id = pm.assigned_by
      LEFT JOIN users unassigner ON unassigner.id = pm.unassigned_by
      ${where}
      ORDER BY pm.assigned_at DESC
    `;

    return await db.query(query, {
      replacements: { projectId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Assign a new project manager.
   */
  static async assign(data, clientOptions = {}) {
    const { projectId, userId, assignedBy = null, remarks = null } = data;

    const query = `
      INSERT INTO project_managers (
        project_id,
        user_id,
        assigned_by,
        remarks,
        created_by,
        updated_by
      ) VALUES (
        :projectId,
        :userId,
        :assignedBy,
        :remarks,
        :assignedBy,
        :assignedBy
      )
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectId, userId, assignedBy, remarks },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Unassign an active project manager.
   */
  static async unassign(projectId, userId, unassignedBy = null, remarks = null, clientOptions = {}) {
    const query = `
      UPDATE project_managers
      SET unassigned_at = NOW(),
          unassigned_by = :unassignedBy,
          remarks = COALESCE(:remarks, remarks),
          updated_at = NOW(),
          updated_by = :unassignedBy
      WHERE project_id = :projectId
        AND user_id = :userId
        AND unassigned_at IS NULL
        AND is_deleted = FALSE
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectId, userId, unassignedBy, remarks },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0] || null;
  }

  /**
   * Sync active project managers (replace active set).
   */
  static async syncManagers(projectId, managerUserIds = [], actorId = null, clientOptions = {}) {
    // Unassign currently active managers not in the new list
    const currentActive = await this.findByProjectId(projectId, false);
    const incomingSet = new Set(managerUserIds);

    for (const cur of currentActive) {
      if (!incomingSet.has(cur.user_id)) {
        await this.unassign(projectId, cur.user_id, actorId, 'Reassigned via project update', clientOptions);
      }
    }

    const currentSet = new Set(currentActive.map((c) => c.user_id));
    for (const userId of managerUserIds) {
      if (!currentSet.has(userId)) {
        await this.assign({ projectId, userId, assignedBy: actorId }, clientOptions);
      }
    }

    return await this.findByProjectId(projectId, false);
  }
}

module.exports = ProjectManagerModel;
