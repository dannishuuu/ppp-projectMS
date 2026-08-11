// models/projectCategory.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_CATEGORY_FIELDS = `
  pc.id,
  pc.name,
  pc.description,
  pc.is_active,
  pc.created_at,
  pc.updated_at,
  pc.created_by,
  pc.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class ProjectCategoryModel {
  // ─── READ ────────────────────────────────────────────────────────────────

  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all' } = options;

    let where = `WHERE pc.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND pc.name ILIKE :search`;
      replacements.search = `%${search}%`;
    }

    if (status !== 'all') {
      where += ` AND pc.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM project_categories pc
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const query = `
      SELECT ${PUBLIC_CATEGORY_FIELDS}
      FROM project_categories pc
      LEFT JOIN users creator ON creator.id = pc.created_by
      LEFT JOIN users updater ON updater.id = pc.updated_by
      ${where}
      ORDER BY pc.created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT ${PUBLIC_CATEGORY_FIELDS}
      FROM project_categories pc
      LEFT JOIN users creator ON creator.id = pc.created_by
      LEFT JOIN users updater ON updater.id = pc.updated_by
      WHERE pc.id = :id AND pc.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name FROM project_categories
      WHERE LOWER(name) = LOWER(:name) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { name },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  static async create({ name, description, createdBy }) {
    const query = `
      INSERT INTO project_categories (name, description, created_by, updated_by)
      VALUES (:name, :description, :createdBy, :createdBy)
      RETURNING id, name, description, is_active, created_at, updated_at
    `;
    const rows = await db.query(query, {
      replacements: { name, description: description || null, createdBy },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  static async update(id, { name, description, updatedBy }) {
    const setClauses = [];
    const replacements = { id, updatedBy };

    if (name !== undefined) {
      setClauses.push('name = :name');
      replacements.name = name;
    }
    if (description !== undefined) {
      setClauses.push('description = :description');
      replacements.description = description;
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');

    const query = `
      UPDATE project_categories
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  // ─── STATUS TOGGLE ───────────────────────────────────────────────────────

  static async toggleStatus(id, updatedBy) {
    const query = `
      UPDATE project_categories
      SET is_active    = NOT is_active,
          updated_at   = NOW(),
          updated_by   = :updatedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, is_active
    `;
    const rows = await db.query(query, {
      replacements: { id, updatedBy },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  // ─── SOFT DELETE ─────────────────────────────────────────────────────────

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE project_categories
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :deletedBy
      WHERE id = :id AND is_deleted = FALSE
    `;
    await db.query(query, { replacements: { id, deletedBy } });
  }
}

module.exports = ProjectCategoryModel;
