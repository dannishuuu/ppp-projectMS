// models/projectOrganization.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ProjectOrganizationModel {
  /**
   * Find organizations associated with a project.
   */
  static async findByProjectId(projectId) {
    const query = `
      SELECT
        po.id,
        po.project_id,
        po.organization_id,
        po.organization_type_id,
        po.created_at,
        o.name                     AS organization_name,
        o.email                    AS organization_email,
        o.phone                    AS organization_phone,
        ot.name                    AS organization_type_name,
        ot.org_type_code           AS organization_type_code
      FROM project_organizations po
      JOIN organizations o         ON o.id  = po.organization_id
      JOIN organization_types ot   ON ot.id = po.organization_type_id
      WHERE po.project_id = :projectId AND po.is_deleted = FALSE
      ORDER BY ot.name, o.name
    `;

    return await db.query(query, {
      replacements: { projectId },
      type: QueryTypes.SELECT,
    });
  }

  /**
   * Add a single organization to a project.
   */
  static async add(data, clientOptions = {}) {
    const { projectId, organizationId, organizationTypeId, createdBy = null } = data;

    const query = `
      INSERT INTO project_organizations (
        project_id,
        organization_id,
        organization_type_id,
        created_by,
        updated_by
      ) VALUES (
        :projectId,
        :organizationId,
        :organizationTypeId,
        :createdBy,
        :createdBy
      )
      ON CONFLICT (project_id, organization_id, organization_type_id)
      DO UPDATE SET is_deleted = FALSE, updated_at = NOW(), updated_by = :createdBy
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: { projectId, organizationId, organizationTypeId, createdBy },
      type: QueryTypes.SELECT,
      transaction: clientOptions.transaction,
    });

    return rows[0];
  }

  /**
   * Remove an organization from a project (soft delete).
   */
  static async remove(id, actorId, clientOptions = {}) {
    const query = `
      UPDATE project_organizations
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

  /**
   * Replace all organizations for a project in a transaction.
   */
  static async syncOrganizations(projectId, organizations = [], actorId = null, clientOptions = {}) {
    // 1. Soft-delete existing relations
    await db.query(
      `UPDATE project_organizations
       SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = :actorId
       WHERE project_id = :projectId AND is_deleted = FALSE`,
      {
        replacements: { projectId, actorId },
        type: QueryTypes.BULKUPDATE,
        transaction: clientOptions.transaction,
      }
    );

    // 2. Re-insert or restore desired ones
    if (Array.isArray(organizations) && organizations.length > 0) {
      for (const org of organizations) {
        if (org.organizationId && org.organizationTypeId) {
          await this.add(
            {
              projectId,
              organizationId: org.organizationId,
              organizationTypeId: org.organizationTypeId,
              createdBy: actorId,
            },
            clientOptions
          );
        }
      }
    }

    return await this.findByProjectId(projectId);
  }
}

module.exports = ProjectOrganizationModel;
