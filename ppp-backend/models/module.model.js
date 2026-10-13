// models/module.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_MODULE_FIELDS = `
  m.id,
  m.name,
  m.code,
  m.description,
  m.is_active,
  m.created_at,
  m.updated_at,
  m.created_by,
  m.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class ModuleModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all', sortBy = 'name' } = options;

    let where = `WHERE m.is_deleted = FALSE`;
    const replacements = {};

    if (search && search.trim()) {
      where += ` AND (m.name ILIKE :search OR m.code ILIKE :search OR m.description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    if (status !== 'all') {
      where += ` AND m.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM modules m
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
      SELECT ${PUBLIC_MODULE_FIELDS}
      FROM modules m
      LEFT JOIN users creator ON creator.id = m.created_by
      LEFT JOIN users updater ON updater.id = m.updated_by
      ${where}
      ORDER BY m.${validSortBy} ASC
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
      SELECT ${PUBLIC_MODULE_FIELDS}
      FROM modules m
      LEFT JOIN users creator ON creator.id = m.created_by
      LEFT JOIN users updater ON updater.id = m.updated_by
      WHERE m.id = :id AND m.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByCode(code, excludeId = null) {
    let query = `
      SELECT id, name, code 
      FROM modules
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

  static async create(data, actorId = null) {
    const query = `
      INSERT INTO modules (
        name,
        code,
        description,
        is_active,
        created_by,
        updated_by
      )
      VALUES (
        :name,
        LOWER(:code),
        :description,
        COALESCE(:isActive, TRUE),
        :actorId,
        :actorId
      )
      RETURNING id, name, code, description, is_active, created_at, updated_at;
    `;
    const rows = await db.query(query, {
      replacements: {
        name: data.name,
        code: data.code,
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
      UPDATE modules
      SET
        name = COALESCE(:name, name),
        code = CASE WHEN :code IS NOT NULL THEN LOWER(:code) ELSE code END,
        description = CASE WHEN :description IS NOT NULL THEN :description ELSE description END,
        is_active = CASE WHEN :isActive IS NOT NULL THEN :isActive ELSE is_active END,
        updated_by = :actorId,
        updated_at = NOW()
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, name, code, description, is_active, created_at, updated_at;
    `;
    const rows = await db.query(query, {
      replacements: {
        id,
        name: data.name || null,
        code: data.code || null,
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
      UPDATE modules
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

module.exports = ModuleModel;
