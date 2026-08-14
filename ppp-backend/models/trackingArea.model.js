// models/trackingArea.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class TrackingAreaModel {
  /**
   * Find all tracking areas with optional filters
   * @param {object} options - { limit, offset, search, isActive, trackingItemTypeId, parentId }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = null,
      trackingItemTypeId = null,
      parentId = null,
      sortBy = 'order_index',
    } = options;

    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (trackingItemTypeId) {
      where += ` AND tracking_item_type_id = :trackingItemTypeId`;
      replacements.trackingItemTypeId = trackingItemTypeId;
    }

    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === null) {
        where += ` AND parent_id IS NULL`;
      } else {
        where += ` AND parent_id = :parentId`;
        replacements.parentId = parentId;
      }
    }

    if (search && search.trim()) {
      where += ` AND (name ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tracking_areas ${where}`;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['name', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Sort and paginate
    const query = `SELECT * FROM tracking_areas ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  /**
   * Find a tracking area by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM tracking_areas WHERE id = :id AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Find a tracking area by name within a parent scope
   */
  static async findByName(name, parentId = null, excludeId = null) {
    let query = 'SELECT * FROM tracking_areas WHERE name = :name AND is_deleted = false';
    const replacements = { name };

    if (parentId === null) {
      query += ' AND parent_id IS NULL';
    } else {
      query += ' AND parent_id = :parentId';
      replacements.parentId = parentId;
    }

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
   * Create a new tracking area
   */
  static async create(data) {
    const {
      trackingItemTypeId,
      parentId,
      name,
      description,
      createdBy,
    } = data;

    const query = `
      INSERT INTO tracking_areas (
        tracking_item_type_id, parent_id, name, description, created_by
      )
      VALUES (:trackingItemTypeId, :parentId, :name, :description, :createdBy)
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        trackingItemTypeId,
        parentId: parentId || null,
        name,
        description: description || null,
        createdBy: createdBy || null,
      },
      type: QueryTypes.SELECT,
    });

    return rows[0];
  }

  /**
   * Update an existing tracking area
   */
  static async update(id, data) {
    const {
      trackingItemTypeId,
      parentId,
      name,
      description,
      isActive,
      updatedBy,
    } = data;

    const setClauses = [];
    const replacements = { id };

    if (trackingItemTypeId !== undefined) {
      setClauses.push('tracking_item_type_id = :trackingItemTypeId');
      replacements.trackingItemTypeId = trackingItemTypeId;
    }
    if (parentId !== undefined) {
      setClauses.push('parent_id = :parentId');
      replacements.parentId = parentId;
    }
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
      UPDATE tracking_areas
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
   * Soft delete a tracking area
   */
  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE tracking_areas 
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
   * Restore a soft-deleted tracking area
   */
  static async restore(id) {
    const query = `
      UPDATE tracking_areas 
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
   * Get all pillars (top-level areas with no parent)
   */
  static async getPillars(trackingItemTypeId = null) {
    let query = `
      SELECT * FROM tracking_areas 
      WHERE parent_id IS NULL AND is_active = true AND is_deleted = false
    `;
    const replacements = {};

    if (trackingItemTypeId) {
      query += ' AND tracking_item_type_id = :trackingItemTypeId';
      replacements.trackingItemTypeId = trackingItemTypeId;
    }

    query += ' ORDER BY created_at ASC';

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Get all phases (areas with a parent)
   */
  static async getPhases(parentId = null) {
    let query = `
      SELECT * FROM tracking_areas 
      WHERE parent_id IS NOT NULL AND is_active = true AND is_deleted = false
    `;
    const replacements = {};

    if (parentId) {
      query += ' AND parent_id = :parentId';
      replacements.parentId = parentId;
    }

    query += ' ORDER BY created_at ASC';

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Get children of a tracking area
   */
  static async getChildren(parentId) {
    const query = `
      SELECT * FROM tracking_areas 
      WHERE parent_id = :parentId AND is_deleted = false
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, {
      replacements: { parentId },
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  /**
   * Get full hierarchy (pillar with all its phases)
   */
  static async getHierarchy(trackingItemTypeId = null) {
    // Get all pillars (top-level)
    const pillars = await this.getPillars(trackingItemTypeId);

    // For each pillar, get its phases
    for (const pillar of pillars) {
      pillar.phases = await this.getChildren(pillar.id);
    }

    return pillars;
  }

  /**
   * Check if an area has children
   */
  static async hasChildren(id) {
    const query = `
      SELECT COUNT(*) as count FROM tracking_areas 
      WHERE parent_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }

  /**
   * Check if an area has checklists
   */
  static async hasChecklists(id) {
    const query = `
      SELECT COUNT(*) as count FROM checklists 
      WHERE tracking_area_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = TrackingAreaModel;
