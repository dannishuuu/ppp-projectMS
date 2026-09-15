// models/company.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class CompanyModel {
  /**
   * Find all companies with optional filters
   * @param {object} options - { limit, offset, search, isActive, sortBy, sortOrder }
   */
  static async findAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      search = '',
      isActive = null,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = options;

    let where = 'WHERE c.is_deleted = false';
    const replacements = {};

    if (isActive !== null && isActive !== undefined) {
      where += ` AND c.is_active = :isActive`;
      replacements.isActive = isActive;
    }

    if (search && search.trim()) {
      where += ` AND (c.name ILIKE :search OR c.code ILIKE :search OR c.tin ILIKE :search OR c.email ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM companies c ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.total || 0, 10);

    // Validate sortBy column name to prevent SQL injection
    const allowedSortColumns = ['name', 'code', 'created_at', 'updated_at', 'registration_date'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM company_organization_units u
          WHERE u.company_id = c.id AND u.is_deleted = false) AS org_units_count
      FROM companies c
      ${where}
      ORDER BY c.${validSortBy} ${validSortOrder} LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM company_organization_units u
          WHERE u.company_id = c.id AND u.is_deleted = false) AS org_units_count
      FROM companies c
      WHERE c.id = :id AND c.is_deleted = false
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByCode(code, excludeId = null) {
    let query = 'SELECT * FROM companies WHERE UPPER(code) = UPPER(:code) AND is_deleted = false';
    const replacements = { code };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async findByTin(tin, excludeId = null) {
    let query = 'SELECT * FROM companies WHERE tin = :tin AND is_deleted = false';
    const replacements = { tin };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async create(data) {
    const query = `
      INSERT INTO companies (
        code, name, name_amharic, name_afaan_oromo, tin, registration_number,
        registration_date, phone, email, website, address, logo_url, description,
        is_active, created_by
      )
      VALUES (
        :code, :name, :nameAmharic, :nameAfaanOromo, :tin, :registrationNumber,
        :registrationDate, :phone, :email, :website, :address, :logoUrl, :description,
        COALESCE(:isActive, true), :createdBy
      )
      RETURNING *
    `;
    const rows = await db.query(query, {
      replacements: {
        code: data.code,
        name: data.name,
        nameAmharic: data.nameAmharic || null,
        nameAfaanOromo: data.nameAfaanOromo || null,
        tin: data.tin || null,
        registrationNumber: data.registrationNumber || null,
        registrationDate: data.registrationDate || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        address: data.address || null,
        logoUrl: data.logoUrl || null,
        description: data.description || null,
        isActive: data.isActive,
        createdBy: data.createdBy || null,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, data) {
    const setClauses = [];
    const replacements = { id };

    const fields = {
      code: 'code',
      name: 'name',
      nameAmharic: 'name_amharic',
      nameAfaanOromo: 'name_afaan_oromo',
      tin: 'tin',
      registrationNumber: 'registration_number',
      registrationDate: 'registration_date',
      phone: 'phone',
      email: 'email',
      website: 'website',
      address: 'address',
      logoUrl: 'logo_url',
      description: 'description',
      isActive: 'is_active',
      updatedBy: 'updated_by',
    };

    for (const [key, column] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        setClauses.push(`${column} = :${key}`);
        replacements[key] = data[key];
      }
    }

    if (setClauses.length === 0) return null;
    setClauses.push('updated_at = NOW()');

    const query = `
      UPDATE companies
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE companies
      SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async restore(id) {
    const query = `
      UPDATE companies
      SET is_deleted = false, deleted_at = null, deleted_by = null
      WHERE id = :id AND is_deleted = true
      RETURNING *
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  /**
   * Whether the company still has non-deleted organization units
   */
  static async hasOrgUnits(id) {
    const query = `
      SELECT COUNT(*) as count FROM company_organization_units
      WHERE company_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = CompanyModel;
