// models/rolePermission.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class RolePermissionModel {
  /**
   * Find all active permissions granted to a specific role.
   */
  static async findByRoleId(roleId) {
    const query = `
      SELECT 
        rp.id,
        rp.role_id,
        rp.permission_id,
        p.code AS permission_code,
        p.name AS permission_name,
        m.name AS module_name,
        m.code AS module_code,
        a.name AS action_name,
        a.code AS action_code
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id AND p.is_deleted = FALSE AND p.is_active = TRUE
      JOIN modules m ON m.id = p.module_id AND m.is_deleted = FALSE
      JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE
      WHERE rp.role_id = :roleId
        AND rp.is_deleted = FALSE
        AND rp.is_active = TRUE
      ORDER BY m.name ASC, a.name ASC;
    `;
    const rows = await db.query(query, {
      replacements: { roleId },
      type: QueryTypes.SELECT,
    });
    return rows;
  }

  /**
   * Sync / Replace permissions for a given role.
   * Soft deletes unselected permissions and inserts / reactivates selected ones.
   */
  static async syncRolePermissions(roleId, permissionIds = [], actorId = null) {
    // 1. Soft-delete current active permissions for this role that are not in the new list
    if (permissionIds.length > 0) {
      await db.query(
        `
        UPDATE role_permissions
        SET is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = :actorId
        WHERE role_id = :roleId
          AND permission_id NOT IN (:permissionIds)
          AND is_deleted = FALSE;
        `,
        {
          replacements: { roleId, permissionIds, actorId },
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      // If empty array passed, remove all
      await db.query(
        `
        UPDATE role_permissions
        SET is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = :actorId
        WHERE role_id = :roleId
          AND is_deleted = FALSE;
        `,
        {
          replacements: { roleId, actorId },
          type: QueryTypes.UPDATE,
        }
      );
      return [];
    }

    // 2. Insert or reactivate permissions
    for (const permId of permissionIds) {
      const existing = await db.query(
        `
        SELECT id, is_deleted, is_active 
        FROM role_permissions 
        WHERE role_id = :roleId AND permission_id = :permId;
        `,
        {
          replacements: { roleId, permId },
          type: QueryTypes.SELECT,
        }
      );

      if (existing.length > 0) {
        if (existing[0].is_deleted || !existing[0].is_active) {
          await db.query(
            `
            UPDATE role_permissions
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
          INSERT INTO role_permissions (role_id, permission_id, is_active, created_by, updated_by)
          VALUES (:roleId, :permId, TRUE, :actorId, :actorId);
          `,
          {
            replacements: { roleId, permId, actorId },
            type: QueryTypes.INSERT,
          }
        );
      }
    }

    return this.findByRoleId(roleId);
  }
}

module.exports = RolePermissionModel;
