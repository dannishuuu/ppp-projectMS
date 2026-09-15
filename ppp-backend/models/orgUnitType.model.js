// models/orgUnitType.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class OrgUnitTypeModel {
  /**
   * Find all org unit types with optional filters
   * @param {object} options - { limit, offset, search, isActive, sortBy }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = null,
      sortBy = 'sort_order',
    } = options;

    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (search && search.trim()) {
      where += ` AND (name ILIKE :search OR code ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM org_unit_types ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['sort_order', 'name', 'code', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'sort_order';
    // sort_order always ascending; name-based sorts default ascending too
    const orderSql = validSortBy === 'sort_order'
      ? 'sort_order ASC, name ASC'
      : `${validSortBy} ASC`;

    const query = `
      SELECT * FROM org_unit_types ${where}
      ORDER BY ${orderSql}
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const query = 'SELECT * FROM org_unit_types WHERE id = :id AND is_deleted = false';
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByCode(code, excludeId = null) {
    let query = 'SELECT * FROM org_unit_types WHERE UPPER(code) = UPPER(:code) AND is_deleted = false';
    const replacements = { code };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const query = `
      INSERT INTO org_unit_types (
        code, name, name_amharic, name_afaan_oromo, description, sort_order, is_active, created_by
      )
      VALUES (
        :code, :name, :nameAmharic, :nameAfaanOromo, :description, COALESCE(:sortOrder, 0), COALESCE(:isActive, true), :createdBy
      )
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: {
        code: data.code,
        name: data.name,
        nameAmharic: data.nameAmharic || null,
        nameAfaanOromo: data.nameAfaanOromo || null,
        description: data.description || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        createdBy: data.createdBy || null,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const replacements = { id };

    const fields = {
      code: 'code',
      name: 'name',
      nameAmharic: 'name_amharic',
      nameAfaanOromo: 'name_afaan_oromo',
      description: 'description',
      sortOrder: 'sort_order',
      isActive: 'is_active',
      updatedBy: 'updated_by',
    };

    for (const [key, column] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        setClauses.push(`${column} = :${key}`);
        replacements[key] = data[key];
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()');

    const query = `
      UPDATE org_unit_types
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE org_unit_types
      SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  /**
   * Whether any (non-deleted) org units reference this type
   */
  static async hasUnits(id) {
    const query = `
      SELECT COUNT(*) as count FROM company_organization_units
      WHERE unit_type_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = OrgUnitTypeModel;
