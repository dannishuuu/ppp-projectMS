const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_RENTAL_PAYMENT_TYPE_FIELDS = `
  pt.id,
  pt.name,
  pt.payment_type_code,
  pt.name_amharic,
  pt.duration_days,
  pt.description,
  pt.is_active,
  pt.created_at,
  pt.updated_at,
  pt.created_by,
  pt.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class RentalPaymentTypeModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', isActive = null, sortBy = 'name' } = options;
    let where = 'WHERE pt.is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND pt.is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (search && search.trim()) {
      where += ` AND (pt.name ILIKE :search OR pt.payment_type_code ILIKE :search OR pt.name_amharic ILIKE :search OR pt.description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(`SELECT COUNT(*) as total FROM rental_payment_types pt ${where}`, { replacements, type: QueryTypes.SELECT });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const validSortBy = ['name', 'payment_type_code', 'duration_days', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'name';
    replacements.limit = limit;
    replacements.offset = offset;
    
    const rows = await db.query(`
      SELECT ${PUBLIC_RENTAL_PAYMENT_TYPE_FIELDS}
      FROM rental_payment_types pt
      LEFT JOIN users creator ON creator.id = pt.created_by
      LEFT JOIN users updater ON updater.id = pt.updated_by
      ${where}
      ORDER BY pt.${validSortBy} ASC
      LIMIT :limit OFFSET :offset
    `, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query(`
      SELECT ${PUBLIC_RENTAL_PAYMENT_TYPE_FIELDS}
      FROM rental_payment_types pt
      LEFT JOIN users creator ON creator.id = pt.created_by
      LEFT JOIN users updater ON updater.id = pt.updated_by
      WHERE pt.id = :id AND pt.is_deleted = false
    `, { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByCode(code, excludeId = null) {
    let query = 'SELECT * FROM rental_payment_types WHERE payment_type_code = :code AND is_deleted = false';
    const replacements = { code };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByName(name, excludeId = null) {
    let query = 'SELECT * FROM rental_payment_types WHERE LOWER(name) = LOWER(:name) AND is_deleted = false';
    const replacements = { name };
    if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const { name, paymentTypeCode, nameAmharic, durationDays, description, createdBy } = data;
    const rows = await db.query(`
      INSERT INTO rental_payment_types (name, payment_type_code, name_amharic, duration_days, description, created_by, updated_by) 
      VALUES (:name, :paymentTypeCode, :nameAmharic, :durationDays, :description, :createdBy, :createdBy) RETURNING *`,
      { replacements: { name, paymentTypeCode, nameAmharic: nameAmharic || null, durationDays, description: description || null, createdBy: createdBy || null }, type: QueryTypes.SELECT });
    return rows[0];
  }

  static async update(id, data) {
    const { name, paymentTypeCode, nameAmharic, durationDays, description, isActive, updatedBy } = data;
    const setClauses = [];
    const replacements = { id };
    
    if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
    if (paymentTypeCode !== undefined) { setClauses.push('payment_type_code = :paymentTypeCode'); replacements.paymentTypeCode = paymentTypeCode; }
    if (nameAmharic !== undefined) { setClauses.push('name_amharic = :nameAmharic'); replacements.nameAmharic = nameAmharic; }
    if (durationDays !== undefined) { setClauses.push('duration_days = :durationDays'); replacements.durationDays = durationDays; }
    if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
    if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
    if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }
    
    setClauses.push('updated_at = NOW()');
    if (setClauses.length === 1) return null;

    const rows = await db.query(`UPDATE rental_payment_types SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const rows = await db.query(`UPDATE rental_payment_types SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }
}
module.exports = RentalPaymentTypeModel;