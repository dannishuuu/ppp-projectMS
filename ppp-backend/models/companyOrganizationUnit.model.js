// models/companyOrganizationUnit.model.js
const db = require('../config/database');
const { QueryTypes } = require('sequelize');

// Columns joined from related tables for display
const UNIT_FIELDS = `
  u.*,
  c.name AS company_name,
  c.code AS company_code,
  t.code AS unit_type_code,
  t.name AS unit_type_name,
  p.name AS parent_name,
  p.code AS parent_code,
  (SELECT COUNT(*)::int FROM company_organization_units ch
    WHERE ch.parent_id = u.id AND ch.is_deleted = false) AS children_count,
  (mgr.first_name || ' ' || mgr.last_name) AS manager_name
`;

const UNIT_JOINS = `
  LEFT JOIN companies c ON c.id = u.company_id
  LEFT JOIN org_unit_types t ON t.id = u.unit_type_id
  LEFT JOIN company_organization_units p ON p.id = u.parent_id
  LEFT JOIN users mgr ON mgr.id = u.manager_user_id
`;

class CompanyOrganizationUnitModel {
  /**
   * Flat list of units for a company with optional filters.
   * Returns rows ordered by (level, sort_order, name) — the service turns this
   * into a nested tree when requested.
   */
  static async findAll(options = {}) {
    const {
      companyId = null,
      parentId = undefined, // undefined = don't filter, null = roots only, id = children of id
      unitTypeId = null,
      level = null,
      search = '',
      isActive = null,
      limit = 1000,
      offset = 0,
    } = options;

    let where = 'WHERE u.is_deleted = false';
    const replacements = {};

    if (companyId) {
      where += ` AND u.company_id = :companyId`;
      replacements.companyId = companyId;
    }
    if (parentId !== undefined) {
      if (parentId === null) {
        where += ` AND u.parent_id IS NULL`;
      } else {
        where += ` AND u.parent_id = :parentId`;
        replacements.parentId = parentId;
      }
    }
    if (unitTypeId) {
      where += ` AND u.unit_type_id = :unitTypeId`;
      replacements.unitTypeId = unitTypeId;
    }
    if (level !== null && level !== undefined) {
      where += ` AND u.level = :level`;
      replacements.level = level;
    }
    if (isActive !== null && isActive !== undefined) {
      where += ` AND u.is_active = :isActive`;
      replacements.isActive = isActive;
    }
    if (search && search.trim()) {
      where += ` AND (u.name ILIKE :search OR u.code ILIKE :search OR u.description ILIKE :search)`;
      replacements.search = `%${search.trim()}%`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM company_organization_units u ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.total || 0, 10);

    replacements.limit = limit;
    replacements.offset = offset;
    const rows = await db.query(
      `SELECT ${UNIT_FIELDS}
       FROM company_organization_units u
       ${UNIT_JOINS}
       ${where}
       ORDER BY u.level ASC, u.sort_order ASC, u.name ASC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );

    return { rows, total };
  }

  static async findById(id) {
    const rows = await db.query(
      `SELECT ${UNIT_FIELDS}
       FROM company_organization_units u
       ${UNIT_JOINS}
       WHERE u.id = :id AND u.is_deleted = false`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    return rows[0] || null;
  }

  static async findByCode(companyId, code, excludeId = null) {
    let query = `
      SELECT * FROM company_organization_units
      WHERE company_id = :companyId AND UPPER(code) = UPPER(:code) AND is_deleted = false
    `;
    const replacements = { companyId, code };
    if (excludeId) {
      query += ' AND id != :excludeId';
      replacements.excludeId = excludeId;
    }
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  /**
   * Ancestor chain (breadcrumb) for a unit, root first.
   */
  static async findAncestors(id) {
    const rows = await db.query(
      `WITH RECURSIVE anc AS (
         SELECT u.*, 0 AS depth
         FROM company_organization_units u
         WHERE u.id = :id AND u.is_deleted = false
         UNION ALL
         SELECT p.* , anc.depth + 1
         FROM company_organization_units u
         JOIN anc ON anc.parent_id = u.id
         JOIN company_organization_units p ON p.id = u.id
         WHERE p.is_deleted = false
       )
       SELECT id, code, name, level, parent_id FROM anc ORDER BY level ASC`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    // Drop the node itself (depth 0) — it is not an ancestor
    return rows.filter((r) => String(r.id) !== String(id));
  }

  /**
   * All non-deleted descendants of a unit (strictly below it), via materialized path.
   */
  static async findDescendants(id) {
    const node = await db.query(
      'SELECT id, path FROM company_organization_units WHERE id = :id AND is_deleted = false',
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!node[0]) return [];

    const rows = await db.query(
      `SELECT ${UNIT_FIELDS}
       FROM company_organization_units u
       ${UNIT_JOINS}
       WHERE u.is_deleted = false AND u.path LIKE :pathPrefix AND u.id != :id
       ORDER BY u.level ASC, u.sort_order ASC, u.name ASC`,
      { replacements: { pathPrefix: `${node[0].path}%`, id }, type: QueryTypes.SELECT }
    );
    return rows;
  }

  /**
   * Create a unit and stamp its level/path inside one transaction.
   * data must already contain validated companyId/parentId/unitTypeId etc.
   */
  static async create(data, transaction) {
    const insertQuery = `
      INSERT INTO company_organization_units (
        company_id, parent_id, unit_type_id, code, name, name_amharic, name_afaan_oromo,
        description, level, path, sort_order, manager_user_id, is_active, created_by
      )
      VALUES (
        :companyId, :parentId, :unitTypeId, :code, :name, :nameAmharic, :nameAfaanOromo,
        :description, 1, '', COALESCE(:sortOrder, 0), :managerUserId, COALESCE(:isActive, true), :createdBy
      )
      RETURNING id, parent_id
    `;

    const run = async (trx) => {
      const inserted = await db.query(insertQuery, {
        replacements: {
          companyId: data.companyId,
          parentId: data.parentId || null,
          unitTypeId: data.unitTypeId,
          code: data.code,
          name: data.name,
          nameAmharic: data.nameAmharic || null,
          nameAfaanOromo: data.nameAfaanOromo || null,
          description: data.description || null,
          sortOrder: data.sortOrder ?? 0,
          managerUserId: data.managerUserId || null,
          isActive: data.isActive ?? true,
          createdBy: data.createdBy || null,
        },
        type: QueryTypes.SELECT,
        transaction: trx,
      });
      const row = inserted[0];

      let level = 1;
      let path = `/${row.id}/`;
      if (row.parent_id) {
        const parentRes = await db.query(
          'SELECT id, level, path FROM company_organization_units WHERE id = :id',
          { replacements: { id: row.parent_id }, type: QueryTypes.SELECT, transaction: trx }
        );
        if (!parentRes[0]) {
          throw new Error('Parent organization unit no longer exists.');
        }
        level = parentRes[0].level + 1;
        path = `${parentRes[0].path}${row.id}/`;
      }

      await db.query(
        'UPDATE company_organization_units SET level = :level, path = :path WHERE id = :id',
        { replacements: { id: row.id, level, path }, transaction: trx }
      );

      return row.id;
    };

    if (transaction) return run(transaction);
    return db.transaction((trx) => run(trx));
  }

  static async update(id, data) {
    const setClauses = [];
    const replacements = { id };

    const fields = {
      code: 'code',
      name: 'name',
      nameAmharic: 'name_amharic',
      nameAfaanOromo: 'name_afaan_oromo',
      description: 'description',
      unitTypeId: 'unit_type_id',
      sortOrder: 'sort_order',
      managerUserId: 'manager_user_id',
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
      UPDATE company_organization_units
      SET ${setClauses.join(', ')}
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  /**
   * Re-parent a unit and shift the whole subtree's path/level.
   * oldNode = { id, path, level } before the move; newParent = { id, path, level }.
   * newParent may be null (move to root).
   */
  static async move(id, newParent, oldNode, actorId, transaction) {
    const run = async (trx) => {
      const newLevel = newParent ? newParent.level + 1 : 1;
      const newPath = newParent ? `${newParent.path}${id}/` : `/${id}/`;
      const oldPath = oldNode.path;

      await db.query(
        `UPDATE company_organization_units
         SET parent_id = :parentId, level = :newLevel, path = :newPath,
             updated_at = NOW(), updated_by = :actorId
         WHERE id = :id AND is_deleted = false`,
        {
          replacements: { id, parentId: newParent ? newParent.id : null, newLevel, newPath, actorId: actorId || null },
          transaction: trx,
        }
      );

      // Shift every descendant: replace the old path prefix and re-offset levels
      const oldPathLen = oldPath.length;
      await db.query(
        `UPDATE company_organization_units
         SET path = :newPath || right(path, length(path) - :oldPathLen),
             level = :newLevel + (level - :oldLevel),
             updated_at = NOW(), updated_by = :actorId
         WHERE path LIKE :oldPathPrefix AND id != :id AND is_deleted = false`,
        {
          replacements: {
            id,
            newPath,
            oldPathLen,
            oldPathPrefix: `${oldPath}%`,
            newLevel,
            oldLevel: oldNode.level,
            actorId: actorId || null,
          },
          transaction: trx,
        }
      );

      return true;
    };

    if (transaction) return run(transaction);
    return db.transaction((trx) => run(trx));
  }

  static async softDelete(id, deletedBy) {
    const query = `
      UPDATE company_organization_units
      SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false
      WHERE id = :id AND is_deleted = false
      RETURNING *
    `;
    const rows = await db.query(query, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
    return rows[0] || null;
  }

  static async hasChildren(id) {
    const query = `
      SELECT COUNT(*) as count FROM company_organization_units
      WHERE parent_id = :id AND is_deleted = false
    `;
    const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }

  static async hasDescendants(id) {
    const node = await db.query(
      'SELECT id, path FROM company_organization_units WHERE id = :id AND is_deleted = false',
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!node[0]) return false;
    const rows = await db.query(
      `SELECT COUNT(*) as count FROM company_organization_units
       WHERE path LIKE :prefix AND id != :id AND is_deleted = false`,
      { replacements: { prefix: `${node[0].path}%`, id }, type: QueryTypes.SELECT }
    );
    return parseInt(rows[0]?.count || 0, 10) > 0;
  }
}

module.exports = CompanyOrganizationUnitModel;
