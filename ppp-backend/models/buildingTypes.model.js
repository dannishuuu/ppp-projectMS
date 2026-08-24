// models/buildingType.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class BuildingTypeModel {
  /**
   * Find all building types with optional filters
   * @param {object} options - { limit, offset, search, isActive, sortBy }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = null,
      sortBy = 'name',
    } = options;

    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (search && search.trim()) {
      where += ` AND (name ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM building_types ${where}`;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['name', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'name';

    // Sort and paginate
    const query = `SELECT * FROM building_types ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  /**
   * Find a building type by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM building_types WHERE id = :id AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Find a building type by name
   */
  static async findByName(name, excludeId = null) {
    let query = 'SELECT * FROM building_types WHERE name = :name AND is_deleted = false';
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

  /**
   * Create a new building type
   */
  static async create(data) {
    const { name, description, createdBy } = data;

    const query = `
      INSERT INTO building_types (
        name, description, created_by
      )
      VALUES (:name, :description, :createdBy)
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        name,
        description: description || null,
        createdBy: createdBy || null,
      },
      type: QueryTypes.SELECT,
    });

    return rows[0];
  }

  /**
   * Update an existing building type
   */
  static async update(id, data) {
    const { name, description, isActive, updatedBy } = data;

    const setClauses = [];
    const replacements = { id };

    if (name !== undefined) {
      setClauses.push('name = :name');
      replacements.name = name;
    }
    if (description !== undefined) {
      setClauses.push('description = :description');
      replacements.description = description;
    }
    if (isActive !== undefined) {
      setClauses.push('is_active = :isActive');
      replacements.isActive = isActive;
    }
    if (updatedBy !== undefined) {
      setClauses.push('updated_by = :updatedBy');
      replacements.updatedBy = updatedBy;
    }

    setClauses.push('updated_at = NOW()');

    if (setClauses.length === 1) return null;

    const query = `
      UPDATE building_types
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Soft delete a building type
   */
  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE building_types 
      SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: { id, deletedBy: deletedBy || null },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Restore a soft-deleted building type
   */
  static async restore(id) {
    const query = `
      UPDATE building_types 
      SET is_deleted = false, deleted_at = null, deleted_by = null
      WHERE id = :id AND is_deleted = true
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });

    return rows[0] || null;
  }

  /**
   * Check if the building type is assigned to any buildings
   */
  static async hasBuildings(id) {
    const query = `
      SELECT COUNT(*) as count FROM buildings 
      WHERE building_type_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = BuildingTypeModel;