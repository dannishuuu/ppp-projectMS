const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class RegionModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', isActive = null, countryId = null, sortBy = 'name' } = options;
    let where = 'WHERE r.is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) { where += ` AND r.is_active = :isActive`; replacements.isActive = isActive; }
    if (countryId) { where += ` AND r.country_id = :countryId`; replacements.countryId = countryId; }
    if (search && search.trim()) { where += ` AND (r.name ILIKE :search OR r.code ILIKE :search)`; replacements.search = `%${search.trim()}%`; }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM regions r ${where}`, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'code', 'created_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit; replacements.offset = offset;
    const rows = await db.query(`
      SELECT r.*, c.name as country_name 
      FROM regions r
      LEFT JOIN countries c ON c.id = r.country_id
      ${where} 
      ORDER BY r.${validSortBy} ASC 
      LIMIT :limit OFFSET :offset
    `, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query('SELECT * FROM regions WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name, countryId, excludeId = null) {
    let query = 'SELECT * FROM regions WHERE name = :name AND country_id = :countryId AND is_deleted = false';
    const replacements = { name, countryId };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const { countryId, name, code, createdBy } = data;
    const rows = await db.query(`
      INSERT INTO regions (country_id, name, code, created_by) 
      VALUES (:countryId, :name, :code, :createdBy) RETURNING *`,
      { replacements: { countryId, name, code: code || null, createdBy: createdBy || null }, type: QueryTypes.SELECT });
    return rows[0];
  }

  static async update(id, data) {
    const { countryId, name, code, isActive, updatedBy } = data;
    const setClauses = []; const replacements = { id };
    if (countryId !== undefined) { setClauses.push('country_id = :countryId'); replacements.countryId = countryId; }
    if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
    if (code !== undefined) { setClauses.push('code = :code'); replacements.code = code; }
    if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
    if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }
    setClauses.push('updated_at = NOW()');
    if (setClauses.length === 1) return null;

    const rows = await db.query(`UPDATE regions SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const rows = await db.query(`UPDATE regions SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async hasZones(id) {
    const rows = await db.query(`SELECT COUNT(*) as count FROM zones WHERE region_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}
module.exports = RegionModel;