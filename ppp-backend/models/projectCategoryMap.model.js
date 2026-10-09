// models/projectCategoryMap.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectCategoryMapModel {
  /**
   * Find categories assigned to a project.
   */
  static async findByProjectId(projectId) {
    const query = `
      SELECT
        pcm.id,
        pcm.project_id,
        pcm.category_id,
        c.name          AS category_name,
        c.description   AS category_description,
        c.is_onland     AS is_onland
      FROM project_categories_map pcm
      JOIN project_categories c ON c.id = pcm.category_id
      WHERE pcm.project_id = :projectId AND pcm.is_deleted = FALSE
      ORDER BY c.name
    `;

    return await db.query(query, {
      replacements: { projectId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Add a single category to a project.
   */
  static async add(projectId, categoryId, actorId = null, clientOptions = {}) {
    const query = `
      INSERT INTO project_categories_map (
        project_id, category_id, created_by, updated_by
      ) VALUES (
        :projectId, :categoryId, :actorId, :actorId
      )
      ON CONFLICT (project_id, category_id)
      DO UPDATE SET is_deleted = FALSE, updated_at = NOW(), updated_by = :actorId
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectId, categoryId, actorId },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Sync categories for a project (bulk replace).
   */
  static async syncCategories(projectId, categoryIds = [], actorId = null, clientOptions = {}) {
    await db.query(
      `UPDATE project_categories_map
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :actorId
       WHERE project_id = :projectId AND is_deleted = FALSE`,
      {
        replacements: { projectId, actorId },
        type: QueryTypes.BULKUPDATE,
        transaction: clientOptions.transaction,
      }
    );

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      for (const catId of categoryIds) {
        if (catId) {
          await this.add(projectId, catId, actorId, clientOptions);
        }
      }
    }

    return await this.findByProjectId(projectId);
  }
}

module.exports = ProjectCategoryMapModel;
