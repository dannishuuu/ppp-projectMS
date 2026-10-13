// models/permission.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_PERMISSION_FIELDS = `
  p.id,
  p.module_id,
  p.action_id,
  p.code,
  p.name,
  p.description,
  p.is_active,
  p.created_at,
  p.updated_at,
  m.name AS module_name,
  m.code AS module_code,
  a.name AS action_name,
  a.code AS action_code,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class PermissionModel {
  static async findAll(options = {}) {
    const { limit = 200, offset = 0, search = '', moduleId = null, status = 'all' } = options;

    let where = `WHERE p.is_deleted = FALSE`;
    const replacements = {};

    if (search && search.trim()) {
      where += ` AND (p.name ILIKE :search OR p.code ILIKE :search OR p.description ILIKE :search OR m.name ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (moduleId) {
      where += ` AND p.module_id = :moduleId`;
      replacements.moduleId = moduleId;
    }

    if (status !== 'all') {
      where += ` AND p.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM permissions p
      JOIN modules m ON m.id = p.module_id AND m.is_deleted = FALSE
      JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    replacements.limit = limit;
    replacements.offset = offset;

    const query = `
      SELECT ${PUBLIC_PERMISSION_FIELDS}
      FROM permissions p
      JOIN modules m ON m.id = p.module_id AND m.is_deleted = FALSE
      JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE
      LEFT JOIN users creator ON creator.id = p.created_by
      LEFT JOIN users updater ON updater.id = p.updated_by
      ${where}
      ORDER BY m.name ASC, a.name ASC
      LIMIT :limit OFFSET :offset
    `;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT ${PUBLIC_PERMISSION_FIELDS}
      FROM permissions p
      JOIN modules m ON m.id = p.module_id AND m.is_deleted = FALSE
      JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE
      LEFT JOIN users creator ON creator.id = p.created_by
      LEFT JOIN users updater ON updater.id = p.updated_by
      WHERE p.id = :id AND p.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByCode(code) {
    const query = `
      SELECT id, module_id, action_id, code, name
      FROM permissions
      WHERE LOWER(code) = LOWER(:code) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { code },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByModuleAndAction(moduleId, actionId) {
    const query = `
      SELECT id, module_id, action_id, code, name
      FROM permissions
      WHERE module_id = :moduleId AND action_id = :actionId AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { moduleId, actionId },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Grouped permissions by module for building the Frontend Permission Matrix.
   */
  static async findAllGroupedByModule() {
    const query = `
      SELECT 
        m.id AS module_id,
        m.name AS module_name,
        m.code AS module_code,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'code', p.code,
            'name', p.name,
            'description', p.description,
            'action_id', a.id,
            'action_code', a.code,
            'action_name', a.name,
            'is_active', p.is_active
          ) ORDER BY a.name ASC
        ) AS permissions
      FROM modules m
      JOIN permissions p ON p.module_id = m.id AND p.is_deleted = FALSE AND p.is_active = TRUE
      JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE AND a.is_active = TRUE
      WHERE m.is_deleted = FALSE AND m.is_active = TRUE
      GROUP BY m.id, m.name, m.code
      ORDER BY m.name ASC;
    `;
    const rows = await db.query(query, {
      type: QueryTypes.SELECT,
    });
    return rows;
  }

  static async create(data, actorId = null) {
    const query = `
      INSERT INTO permissions (
        module_id,
        action_id,
        code,
        name,
        description,
        is_active,
        created_by,
        updated_by
      )
      VALUES (
        :moduleId,
        :actionId,
        LOWER(:code),
        :name,
        :description,
        COALESCE(:isActive, TRUE),
        :actorId,
        :actorId
      )
      RETURNING id, module_id, action_id, code, name, description, is_active, created_at, updated_at;
    `;
    const rows = await db.query(query, {
      replacements: {
        moduleId: data.moduleId || data.module_id,
        actionId: data.actionId || data.action_id,
        code: data.code,
        name: data.name,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : data.is_active,
        actorId,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, data, actorId = null) {
    const query = `
      UPDATE permissions
      SET
        name = COALESCE(:name, name),
        description = CASE WHEN :description IS NOT NULL THEN :description ELSE description END,
        is_active = CASE WHEN :isActive IS NOT NULL THEN :isActive ELSE is_active END,
        updated_by = :actorId,
        updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, module_id, action_id, code, name, description, is_active, created_at, updated_at;
    `;
    const rows = await db.query(query, {
      replacements: {
        id,
        name: data.name || null,
        description: data.description !== undefined ? data.description : null,
        isActive: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : null),
        actorId,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async softDelete(id, actorId = null) {
    const query = `
      UPDATE permissions
      SET
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = :actorId
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id;
    `;
    const rows = await db.query(query, {
      replacements: { id, actorId },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }
}

module.exports = PermissionModel;
