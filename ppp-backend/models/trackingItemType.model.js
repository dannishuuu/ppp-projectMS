// models/trackingItemType.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class TrackingItemTypeModel {
  /**
   * Find all tracking item types with optional filters
   * @param {object} options - { limit, offset, search, isActive, isWbs, isLeaf, sortBy }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = true,
      isWbs = null,
      isLeaf = null,
      sortBy = 'created_at',
    } = options;

    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (isWbs !== null && isWbs !== undefined) {
      where += ` AND is_wbs = :isWbs`;
      replacements.isWbs = isWbs;
    }

    if (isLeaf !== null && isLeaf !== undefined) {
      where += ` AND is_leaf = :isLeaf`;
      replacements.isLeaf = isLeaf;
    }

    if (search && search.trim()) {
      where += ` AND (code ILIKE :search OR name ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tracking_item_types ${where}`;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['code', 'name', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Sort and paginate
    const query = `SELECT * FROM tracking_item_types ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  /**
   * Find a tracking item type by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM tracking_item_types WHERE id = :id AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Find a tracking item type by code
   */
  static async findByCode(code) {
    const query = 'SELECT * FROM tracking_item_types WHERE code = :code AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { code },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Find a tracking item type by name
   */
  static async findByName(name) {
    const query = 'SELECT * FROM tracking_item_types WHERE name = :name AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { name },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Create a new tracking item type
   */
  static async create(data) {
    const {
      code,
      name,
      description,
      isWbs,
      isLeaf,
      createdBy,
    } = data;

    const query = `
      INSERT INTO tracking_item_types (code, name, description, is_wbs, is_leaf, created_by)
      VALUES (:code, :name, :description, :isWbs, :isLeaf, :createdBy)
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        code,
        name,
        description: description || null,
        isWbs: !!isWbs,
        isLeaf: !!isLeaf,
        createdBy: createdBy || null,
      },
      type: QueryTypes.SELECT,
    });

    return rows[0];
  }

  /**
   * Update an existing tracking item type
   */
  static async update(id, data) {
    const {
      code,
      name,
      description,
      isWbs,
      isLeaf,
      isActive,
      updatedBy,
    } = data;

    const setClauses = [];
    const replacements = { id };

    if (code !== undefined) {
      setClauses.push('code = :code');
      replacements.code = code;
    }
    if (name !== undefined) {
      setClauses.push('name = :name');
      replacements.name = name;
    }
    if (description !== undefined) {
      setClauses.push('description = :description');
      replacements.description = description;
    }
    if (isWbs !== undefined) {
      setClauses.push('is_wbs = :isWbs');
      replacements.isWbs = isWbs;
    }
    if (isLeaf !== undefined) {
      setClauses.push('is_leaf = :isLeaf');
      replacements.isLeaf = isLeaf;
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
      UPDATE tracking_item_types
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
   * Soft delete a tracking item type
   */
  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE tracking_item_types 
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
   * Restore a soft-deleted tracking item type
   */
  static async restore(id) {
    const query = `
      UPDATE tracking_item_types 
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
   * Get all active tracking item types (typically for dropdowns)
   */
  static async getActive() {
    const query = `
      SELECT id, code, name, description, is_wbs, is_leaf 
      FROM tracking_item_types 
      WHERE is_active = true AND is_deleted = false
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Get WBS-capable tracking item types (can have children)
   */
  static async getWbsCapable() {
    const query = `
      SELECT id, code, name, description 
      FROM tracking_item_types 
      WHERE is_wbs = true AND is_active = true AND is_deleted = false
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Get leaf tracking item types (cannot have children)
   */
  static async getLeafTypes() {
    const query = `
      SELECT id, code, name, description 
      FROM tracking_item_types 
      WHERE is_leaf = true AND is_active = true AND is_deleted = false
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Check if a type code exists
   */
  static async codeExists(code, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM tracking_item_types WHERE code = :code AND is_deleted = false';
    const replacements = { code };

    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }

  /**
   * Check if a type name exists
   */
  static async nameExists(name, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM tracking_item_types WHERE name = :name AND is_deleted = false';
    const replacements = { name };

    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = TrackingItemTypeModel;
