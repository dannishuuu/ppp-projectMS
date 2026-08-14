// models/checklist.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ChecklistModel {
  /**
   * Find all checklists with optional filters
   * @param {object} options - { limit, offset, search, isActive, trackingAreaId, isCompleted }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = null,
      trackingAreaId = null,
      sortBy = 'created_at',
    } = options;

    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (trackingAreaId) {
      where += ` AND tracking_area_id = :trackingAreaId`;
      replacements.trackingAreaId = trackingAreaId;
    }

    if (search && search.trim()) {
      where += ` AND (name ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM checklists ${where}`;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['name', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Sort and paginate
    const query = `SELECT * FROM checklists ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  /**
   * Find a checklist by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM checklists WHERE id = :id AND is_deleted = false';
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  /**
   * Find a checklist by name within a tracking area
   */
  static async findByName(name, trackingAreaId, excludeId = null) {
    let query = 'SELECT * FROM checklists WHERE name = :name AND tracking_area_id = :trackingAreaId AND is_deleted = false';
    const replacements = { name, trackingAreaId };

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
   * Create a new checklist
   */
  static async create(data) {
    const {
      trackingAreaId,
      name,
      description,
      createdBy,
    } = data;

    const query = `
      INSERT INTO checklists (
        tracking_area_id, name, description, created_by
      )
      VALUES (:trackingAreaId, :name, :description, :createdBy)
      RETURNING *
    `;

    const rows = await db.query(query, {
      replacements: {
        trackingAreaId,
        name,
        description: description || null,
        createdBy: createdBy || null,
      },
      type: QueryTypes.SELECT,
    });

    return rows[0];
  }

  /**
   * Update an existing checklist
   */
  static async update(id, data) {
    const {
      trackingAreaId,
      name,
      description,
      isActive,
      updatedBy,
    } = data;

    const setClauses = [];
    const replacements = { id };

    if (trackingAreaId !== undefined) {
      setClauses.push('tracking_area_id = :trackingAreaId');
      replacements.trackingAreaId = trackingAreaId;
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
      UPDATE checklists
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
   * Soft delete a checklist
   */
  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE checklists 
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
   * Restore a soft-deleted checklist
   */
  static async restore(id) {
    const query = `
      UPDATE checklists 
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
   * Get all checklists for a tracking area
   */
  static async getByTrackingAreaId(trackingAreaId) {
    const query = `
      SELECT * FROM checklists 
      WHERE tracking_area_id = :trackingAreaId AND is_deleted = false
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, {
      replacements: { trackingAreaId },
      type: QueryTypes.SELECT,
    });

    return rows;
  }
}

module.exports = ChecklistModel;
