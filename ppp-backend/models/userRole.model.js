// models/userRole.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class UserRoleModel {
  /**
   * Get all active roles assigned to a user.
   */
  static async findByUserId(userId) {
    const query = `
      SELECT 
        ur.id AS user_role_id,
        ur.user_id,
        ur.role_id,
        r.name AS role_name,
        r.code AS role_code,
        r.description AS role_description,
        r.is_system
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id AND r.is_deleted = FALSE AND r.is_active = TRUE
      WHERE ur.user_id = :userId
        AND ur.is_deleted = FALSE
        AND ur.is_active = TRUE
      ORDER BY r.name ASC;
    `;
    const rows = await db.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
    return rows;
  }

  /**
   * Sync / Replace roles assigned to a user.
   */
  static async syncUserRoles(userId, roleIds = [], actorId = null) {
    if (roleIds.length > 0) {
      await db.query(
        `
        UPDATE user_roles
        SET is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = :actorId
        WHERE user_id = :userId
          AND role_id NOT IN (:roleIds)
          AND is_deleted = FALSE;
        `,
        {
          replacements: { userId, roleIds, actorId },
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      await db.query(
        `
        UPDATE user_roles
        SET is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = :actorId
        WHERE user_id = :userId
          AND is_deleted = FALSE;
        `,
        {
          replacements: { userId, actorId },
          type: QueryTypes.UPDATE,
        }
      );
      return [];
    }

    for (const roleId of roleIds) {
      const existing = await db.query(
        `
        SELECT id, is_deleted, is_active
        FROM user_roles
        WHERE user_id = :userId AND role_id = :roleId;
        `,
        {
          replacements: { userId, roleId },
          type: QueryTypes.SELECT,
        }
      );

      if (existing.length > 0) {
        if (existing[0].is_deleted || !existing[0].is_active) {
          await db.query(
            `
            UPDATE user_roles
            SET is_deleted = FALSE,
                is_active = TRUE,
                deleted_at = NULL,
                deleted_by = NULL,
                updated_at = NOW(),
                updated_by = :actorId
            WHERE id = :id;
            `,
            {
              replacements: { id: existing[0].id, actorId },
              type: QueryTypes.UPDATE,
            }
          );
        }
      } else {
        await db.query(
          `
          INSERT INTO user_roles (user_id, role_id, is_active, created_by, updated_by)
          VALUES (:userId, :roleId, TRUE, :actorId, :actorId);
          `,
          {
            replacements: { userId, roleId, actorId },
            type: QueryTypes.INSERT,
          }
        );
      }
    }

    return this.findByUserId(userId);
  }

  /**
   * Resolves all active roles and permissions for a user.
   * This is called by auth middleware and profile endpoints.
   */
  static async getUserPermissionsAndRoles(userId) {
    const query = `
      SELECT 
        COALESCE(
          ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL),
          '{}'
        ) AS roles,
        COALESCE(
          ARRAY_AGG(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL),
          '{}'
        ) AS permissions
      FROM user_roles ur
      JOIN roles r 
        ON r.id = ur.role_id 
       AND r.is_active = TRUE 
       AND r.is_deleted = FALSE
      LEFT JOIN role_permissions rp 
        ON rp.role_id = r.id 
       AND rp.is_active = TRUE 
       AND rp.is_deleted = FALSE
      LEFT JOIN permissions p 
        ON p.id = rp.permission_id 
       AND p.is_active = TRUE 
       AND p.is_deleted = FALSE
      WHERE ur.user_id = :userId
        AND ur.is_active = TRUE
        AND ur.is_deleted = FALSE;
    `;
    const rows = await db.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
    return rows[0] || { roles: [], permissions: [] };
  }
}

module.exports = UserRoleModel;
