const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class ShopServiceTypeModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', isActive = null, sortBy = 'name' } = options;
    let where = 'WHERE is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (search && search.trim()) {
      where += ` AND (name ILIKE :search OR amharic_name ILIKE :search OR afaan_oromo_name ILIKE :search OR description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM shop_service_types ${where}`, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit; replacements.offset = offset;
    
    const rows = await db.query(`SELECT * FROM shop_service_types ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query('SELECT * FROM shop_service_types WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name, excludeId = null) {
    let query = 'SELECT * FROM shop_service_types WHERE name = :name AND is_deleted = false';
    const replacements = { name };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const { name, amharicName, afaanOromoName, description, createdBy } = data;
    const rows = await db.query(`
      INSERT INTO shop_service_types (name, amharic_name, afaan_oromo_name, description, created_by) 
      VALUES (:name, :amharicName, :afaanOromoName, :description, :createdBy) RETURNING *`,
      { replacements: { name, amharicName: amharicName || null, afaanOromoName: afaanOromoName || null, description: description || null, createdBy: createdBy || null }, type: QueryTypes.SELECT });
    return rows[0];
  }

  static async update(id, data) {
    const { name, amharicName, afaanOromoName, description, isActive, updatedBy } = data;
    const setClauses = []; const replacements = { id };
    
    if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
    if (amharicName !== undefined) { setClauses.push('amharic_name = :amharicName'); replacements.amharicName = amharicName; }
    if (afaanOromoName !== undefined) { setClauses.push('afaan_oromo_name = :afaanOromoName'); replacements.afaanOromoName = afaanOromoName; }
    if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
    if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
    if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }
    
    setClauses.push('updated_at = NOW()');
    if (setClauses.length === 1) return null;

    const rows = await db.query(`UPDATE shop_service_types SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const rows = await db.query(`UPDATE shop_service_types SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }
}
module.exports = ShopServiceTypeModel;