// models/currency.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_CURRENCY_FIELDS = `
  c.id,
  c.code,
  c.name,
  c.symbol,
  c.is_active,
  c.created_at,
  c.updated_at,
  c.created_by,
  c.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class CurrencyModel {
  static async findAll(options = {}) {
    const { limit = 100, offset = 0, search = '', status = 'all' } = options;

    let where = `WHERE c.is_deleted = FALSE`;
    const replacements = {};

    if (search) {
      where += ` AND (c.code ILIKE :search OR c.name ILIKE :search)`;
      replacements.search = `%${search}%`;
    }

    if (status !== 'all') {
      where += ` AND c.is_active = :isActive`;
      replacements.isActive = status === 'active';
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM currencies c
      ${where}
    `;
    const countResult = await db.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });
    const total = parseInt(countResult[0]?.total || 0, 10);

    const query = `
      SELECT ${PUBLIC_CURRENCY_FIELDS}
      FROM currencies c
      LEFT JOIN users creator ON creator.id = c.created_by
      LEFT JOIN users updater ON updater.id = c.updated_by
      ${where}
      ORDER BY c.code ASC
      LIMIT :limit OFFSET :offset
    `;
    replacements.limit = limit;
    replacements.offset = offset;

    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows, total };
  }

  static async findById(id) {
    const query = `
      SELECT ${PUBLIC_CURRENCY_FIELDS}
      FROM currencies c
      LEFT JOIN users creator ON creator.id = c.created_by
      LEFT JOIN users updater ON updater.id = c.updated_by
      WHERE c.id = :id AND c.is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async findByCode(code) {
    const query = `
      SELECT id, code FROM currencies
      WHERE LOWER(code) = LOWER(:code) AND is_deleted = FALSE
    `;
    const rows = await db.query(query, {
      replacements: { code },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async create({ code, name, symbol, createdBy }) {
    const query = `
      INSERT INTO currencies (code, name, symbol, created_by, updated_by)
      VALUES (:code, :name, :symbol, :createdBy, :createdBy)
      RETURNING id, code, name, symbol, is_active, created_at, updated_at
    `;
    const rows = await db.query(query, {
      replacements: {
        code: code.toUpperCase(),
        name,
        symbol: symbol || null,
        createdBy,
      },
      type: QueryTypes.SELECT,
    });
    return rows[0];
  }

  static async update(id, { code, name, symbol, updatedBy }) {
    const setClauses = [];
    const replacements = { id, updatedBy };

    if (code !== undefined) {
      setClauses.push('code = :code');
      replacements.code = code.toUpperCase();
    }
    if (name !== undefined) {
      setClauses.push('name = :name');
      replacements.name = name;
    }
    if (symbol !== undefined) {
      setClauses.push('symbol = :symbol');
      replacements.symbol = symbol || null;
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()', 'updated_by = :updatedBy');

    const query = `
      UPDATE currencies
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id
    `;
    const rows = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async toggleStatus(id, updatedBy) {
    const query = `
      UPDATE currencies
      SET is_active = NOT is_active,
          updated_at = NOW(),
          updated_by = :updatedBy
      WHERE id = :id AND is_deleted = FALSE
      RETURNING id, is_active
    `;
    const rows = await db.query(query, {
      replacements: { id, updatedBy },
      type: QueryTypes.SELECT,
    });
    return rows[0] || null;
  }

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE currencies
      SET is_deleted = TRUE,
          deleted_at = NOW(),
          deleted_by = :deletedBy
      WHERE id = :id AND is_deleted = FALSE
    `;
    await db.query(query, { replacements: { id, deletedBy } });
  }
}

module.exports = CurrencyModel;
