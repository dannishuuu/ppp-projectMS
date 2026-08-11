// models/organizationType.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_ORG_TYPE_FIELDS = `
  ot.id,
  ot.name,
  ot.description,
  ot.is_active,
  ot.created_at,
  ot.updated_at,
  ot.created_by,
  ot.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class OrganizationTypeModel {
  // ─── READ ────────────────────────────────────────────────────────────────

  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all' } = options;

    let where = `WHERE ot.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND ot.name ILIKE :search`;
      replacements.search = `%${search}%`;
    }

    if (status !== 'all') {
      where += ` AND ot.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM organization_types ot
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const query = `
      SELECT ${PUBLIC_ORG_TYPE_FIELDS}
      FROM organization_types ot
      LEFT JOIN users creator ON creator.id = ot.created_by
      LEFT JOIN users updater ON updater.id = ot.updated_by
      ${where}
      ORDER BY ot.created_at DESC
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
      SELECT ${PUBLIC_ORG_TYPE_FIELDS}
      FROM organization_types ot
      LEFT JOIN users creator ON creator.id = ot.created_by
      LEFT JOIN users updater ON updater.id = ot.updated_by
      WHERE ot.id = :id AND ot.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name FROM organization_types
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
      INSERT INTO organization_types (name, description, created_by, updated_by)
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

    if (setClauses.length === 0) return null; // nothing to update

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');

    const query = `
      UPDATE organization_types
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
      UPDATE organization_types
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
      UPDATE organization_types
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :deletedBy
      WHERE id = :id AND is_deleted = FALSE
    `;
    await db.query(query, { replacements: { id, deletedBy } });
  }
}

module.exports = OrganizationTypeModel;
