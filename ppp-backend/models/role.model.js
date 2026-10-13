// models/role.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_ROLE_FIELDS = `
  r.id,
  r.name,
  r.code,
  r.description,
  r.is_system,
  r.is_active,
  r.created_at,
  r.updated_at,
  r.created_by,
  r.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name,
  COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.is_deleted = FALSE AND ur.is_active = TRUE) AS user_count,
  COUNT(DISTINCT rp.permission_id) FILTER (WHERE rp.is_deleted = FALSE AND rp.is_active = TRUE) AS permission_count
`;

class RoleModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all', sortBy = 'name' } = options;

    let where = `WHERE r.is_deleted = FALSE`;
    const replacements = {};

    if (search && search.trim()) {
      where += ` AND (r.name ILIKE :search OR r.code ILIKE :search OR r.description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (status !== 'all') {
      where += ` AND r.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM roles r
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'code', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit;
    replacements.offset = offset;

    const query = `
      SELECT ${PUBLIC_ROLE_FIELDS}
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN users creator ON creator.id = r.created_by
      LEFT JOIN users updater ON updater.id = r.updated_by
      ${where}
      GROUP BY r.id, creator.first_name, creator.last_name, updater.first_name, updater.last_name
      ORDER BY r.is_system DESC, r.${validSortBy} ASC
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
      SELECT 
        r.id,
        r.name,
        r.code,
        r.description,
        r.is_system,
        r.is_active,
        r.created_at,
        r.updated_at,
        creator.first_name || ' ' || creator.last_name AS created_by_name,
        updater.first_name || ' ' || updater.last_name AS updated_by_name,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'permission_id', p.id,
              'code', p.code,
              'name', p.name,
              'module_code', m.code,
              'module_name', m.name,
              'action_code', a.code,
              'action_name', a.name
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.is_deleted = FALSE AND rp.is_active = TRUE
      LEFT JOIN permissions p ON p.id = rp.permission_id AND p.is_deleted = FALSE AND p.is_active = TRUE
      LEFT JOIN modules m ON m.id = p.module_id AND m.is_deleted = FALSE
      LEFT JOIN actions a ON a.id = p.action_id AND a.is_deleted = FALSE
      LEFT JOIN users creator ON creator.id = r.created_by
      LEFT JOIN users updater ON updater.id = r.updated_by
      WHERE r.id = :id AND r.is_deleted = FALSE
      GROUP BY r.id, creator.first_name, creator.last_name, updater.first_name, updater.last_name;
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByCode(code, excludeId = null) {
    let query = `
      SELECT id, name, code, is_system, is_active
      FROM roles
      WHERE LOWER(code) = LOWER(:code) AND is_deleted = FALSE
    `;
    const replacements = { code };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByName(name, excludeId = null) {
    let query = `
      SELECT id, name, code, is_system, is_active
      FROM roles
      WHERE LOWER(name) = LOWER(:name) AND is_deleted = FALSE
    `;
    const replacements = { name };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async create(data, actorId = null) {
    const query = `
      INSERT INTO roles (
        name,
        code,
        description,
        is_system,
        is_active,
        created_by,
        updated_by
      )
      VALUES (
        :name,
        UPPER(:code),
        :description,
        COALESCE(:isSystem, FALSE),
        COALESCE(:isActive, TRUE),
        :actorId,
        :actorId
      )
      RETURNING id, name, code, description, is_system, is_active, created_at, updated_at;
    `;
    const rows = await db.query(query, {
      replacements: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        isSystem: data.isSystem !== undefined ? data.isSystem : (data.is_system || false),
        isActive: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true),
        actorId,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, data, actorId = null) {
    const query = `
      UPDATE roles
      SET
        name = COALESCE(:name, name),
        description = CASE WHEN :description IS NOT NULL THEN :description ELSE description END,
        is_active = CASE WHEN :isActive IS NOT NULL THEN :isActive ELSE is_active END,
        updated_by = :actorId,
        updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, name, code, description, is_system, is_active, created_at, updated_at;
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
    // Prevent deleting built-in system roles
    const checkQuery = `SELECT is_system FROM roles WHERE id = :id AND is_deleted = FALSE;`;
    const existing = await db.query(checkQuery, { replacements: { id }, type: QueryTypes.SELECT });
    if (existing[0]?.is_system) {
      throw new Error('System-defined roles cannot be deleted.');
    }

    const query = `
      UPDATE roles
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

module.exports = RoleModel;
