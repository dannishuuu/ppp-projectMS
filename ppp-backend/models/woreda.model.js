const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class WoredaModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', isActive = null, zoneId = null, sortBy = 'name' } = options;
    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) { where += ` AND is_active = :isActive`; replacements.isActive = isActive; }
    if (zoneId) { where += ` AND zone_id = :zoneId`; replacements.zoneId = zoneId; }
    if (search && search.trim()) { where += ` AND name ILIKE :search`; replacements.search = `%${search.trim()}%`; }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM woredas ${where}`, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'created_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit; replacements.offset = offset;
    const rows = await db.query(`SELECT * FROM woredas ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query('SELECT * FROM woredas WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name, zoneId, excludeId = null) {
    let query = 'SELECT * FROM woredas WHERE name = :name AND zone_id = :zoneId AND is_deleted = false';
    const replacements = { name, zoneId };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const { zoneId, name, createdBy } = data;
    const rows = await db.query(`
      INSERT INTO woredas (zone_id, name, created_by) 
      VALUES (:zoneId, :name, :createdBy) RETURNING *`,
      { replacements: { zoneId, name, createdBy: createdBy || null }, type: QueryTypes.SELECT });
    return rows[0];
  }

  static async update(id, data) {
    const { zoneId, name, isActive, updatedBy } = data;
    const setClauses = []; const replacements = { id };
    if (zoneId !== undefined) { setClauses.push('zone_id = :zoneId'); replacements.zoneId = zoneId; }
    if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
    if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
    if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }
    setClauses.push('updated_at = NOW()');
    if (setClauses.length === 1) return null;

    const rows = await db.query(`UPDATE woredas SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const rows = await db.query(`UPDATE woredas SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async hasProjects(id) {
    const rows = await db.query(`SELECT COUNT(*) as count FROM ppp_projects WHERE woreda_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}
module.exports = WoredaModel;