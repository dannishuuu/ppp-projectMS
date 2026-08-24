const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ZoneModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', isActive = null, regionId = null, sortBy = 'name' } = options;
    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) { where += ` AND is_active = :isActive`; replacements.isActive = isActive; }
    if (regionId) { where += ` AND region_id = :regionId`; replacements.regionId = regionId; }
    if (search && search.trim()) { where += ` AND name ILIKE :search`; replacements.search = `%${search.trim()}%`; }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM zones ${where}`, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'created_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit; replacements.offset = offset;
    const rows = await db.query(`SELECT * FROM zones ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query('SELECT * FROM zones WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name, regionId, excludeId = null) {
    let query = 'SELECT * FROM zones WHERE name = :name AND region_id = :regionId AND is_deleted = false';
    const replacements = { name, regionId };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const { regionId, name, createdBy } = data;
    const rows = await db.query(`
      INSERT INTO zones (region_id, name, created_by) 
      VALUES (:regionId, :name, :createdBy) RETURNING *`,
      { replacements: { regionId, name, createdBy: createdBy || null }, type: QueryTypes.SELECT });
    return rows[0];
  }

  static async update(id, data) {
    const { regionId, name, isActive, updatedBy } = data;
    const setClauses = []; const replacements = { id };
    if (regionId !== undefined) { setClauses.push('region_id = :regionId'); replacements.regionId = regionId; }
    if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
    if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
    if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }
    setClauses.push('updated_at = NOW()');
    if (setClauses.length === 1) return null;

    const rows = await db.query(`UPDATE zones SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const rows = await db.query(`UPDATE zones SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async hasWoredas(id) {
    const rows = await db.query(`SELECT COUNT(*) as count FROM woredas WHERE zone_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}
module.exports = ZoneModel;