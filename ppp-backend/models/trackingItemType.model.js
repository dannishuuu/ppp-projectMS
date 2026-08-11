// models/trackingItemType.model.js
const db = require('../config/database');

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
      sortBy = 'sort_order',
    } = options;

    let query = 'SELECT * FROM tracking_item_types WHERE is_deleted = false';
    const params = [];
    let paramCount = 1;

    if (isActive !== null) {
      query += ` AND is_active = $${paramCount}`;
      params.push(isActive);
      paramCount++;
    }

    if (isWbs !== null) {
      query += ` AND is_wbs = $${paramCount}`;
      params.push(isWbs);
      paramCount++;
    }

    if (isLeaf !== null) {
      query += ` AND is_leaf = $${paramCount}`;
      params.push(isLeaf);
      paramCount++;
    }

    if (search && search.trim()) {
      query += ` AND (code ILIKE $${paramCount} OR name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM tracking_item_types WHERE is_deleted = false ${
        isActive !== null ? `AND is_active = ${isActive}` : ''
      } ${isWbs !== null ? `AND is_wbs = ${isWbs}` : ''} ${
        isLeaf !== null ? `AND is_leaf = ${isLeaf}` : ''
      } ${search ? `AND (code ILIKE '%${search}%' OR name ILIKE '%${search}%' OR description ILIKE '%${search}%')` : ''}`,
      []
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Sort and paginate
    query += ` ORDER BY ${sortBy} ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return { rows: result.rows, total };
  }

  /**
   * Find a tracking item type by ID
   */
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM tracking_item_types WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a tracking item type by code
   */
  static async findByCode(code) {
    const result = await db.query(
      'SELECT * FROM tracking_item_types WHERE code = $1 AND is_deleted = false',
      [code]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a tracking item type by name
   */
  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM tracking_item_types WHERE name = $1 AND is_deleted = false',
      [name]
    );
    return result.rows[0] || null;
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
      sortOrder,
      defaultWeight,
      createdBy,
    } = data;

    const result = await db.query(
      `INSERT INTO tracking_item_types (code, name, description, is_wbs, is_leaf, sort_order, default_weight, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [code, name, description, isWbs, isLeaf, sortOrder, defaultWeight, createdBy]
    );

    return result.rows[0];
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
      sortOrder,
      defaultWeight,
      isActive,
      updatedBy,
    } = data;

    let query = 'UPDATE tracking_item_types SET ';
    const params = [];
    let paramCount = 1;
    const updates = [];

    if (code !== undefined) {
      updates.push(`code = $${paramCount}`);
      params.push(code);
      paramCount++;
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (isWbs !== undefined) {
      updates.push(`is_wbs = $${paramCount}`);
      params.push(isWbs);
      paramCount++;
    }
    if (isLeaf !== undefined) {
      updates.push(`is_leaf = $${paramCount}`);
      params.push(isLeaf);
      paramCount++;
    }
    if (sortOrder !== undefined) {
      updates.push(`sort_order = $${paramCount}`);
      params.push(sortOrder);
      paramCount++;
    }
    if (defaultWeight !== undefined) {
      updates.push(`default_weight = $${paramCount}`);
      params.push(defaultWeight);
      paramCount++;
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(isActive);
      paramCount++;
    }

    if (updatedBy !== undefined) {
      updates.push(`updated_by = $${paramCount}`);
      params.push(updatedBy);
      paramCount++;
    }

    updates.push(`updated_at = now()`);

    if (updates.length === 0) return null;

    query += updates.join(', ');
    query += ` WHERE id = $${paramCount} AND is_deleted = false RETURNING *`;
    params.push(id);

    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a tracking item type
   */
  static async softDelete(id, deletedBy) {
    const result = await db.query(
      `UPDATE tracking_item_types 
       SET is_deleted = true, deleted_at = now(), deleted_by = $1, is_active = false
       WHERE id = $2 AND is_deleted = false
       RETURNING *`,
      [deletedBy, id]
    );

    return result.rows[0] || null;
  }

  /**
   * Restore a soft-deleted tracking item type
   */
  static async restore(id) {
    const result = await db.query(
      `UPDATE tracking_item_types 
       SET is_deleted = false, deleted_at = null, deleted_by = null
       WHERE id = $1 AND is_deleted = true
       RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all active tracking item types (typically for dropdowns)
   */
  static async getActive() {
    const result = await db.query(
      `SELECT id, code, name, description, is_wbs, is_leaf, sort_order, default_weight 
       FROM tracking_item_types 
       WHERE is_active = true AND is_deleted = false
       ORDER BY sort_order ASC`
    );

    return result.rows;
  }

  /**
   * Get WBS-capable tracking item types (can have children)
   */
  static async getWbsCapable() {
    const result = await db.query(
      `SELECT id, code, name, description, sort_order 
       FROM tracking_item_types 
       WHERE is_wbs = true AND is_active = true AND is_deleted = false
       ORDER BY sort_order ASC`
    );

    return result.rows;
  }

  /**
   * Get leaf tracking item types (cannot have children)
   */
  static async getLeafTypes() {
    const result = await db.query(
      `SELECT id, code, name, description, sort_order 
       FROM tracking_item_types 
       WHERE is_leaf = true AND is_active = true AND is_deleted = false
       ORDER BY sort_order ASC`
    );

    return result.rows;
  }

  /**
   * Check if a type code exists
   */
  static async codeExists(code, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM tracking_item_types WHERE code = $1 AND is_deleted = false';
    const params = [code];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0]?.count || 0) > 0;
  }

  /**
   * Check if a type name exists
   */
  static async nameExists(name, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM tracking_item_types WHERE name = $1 AND is_deleted = false';
    const params = [name];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0]?.count || 0) > 0;
  }
}

module.exports = TrackingItemTypeModel;
