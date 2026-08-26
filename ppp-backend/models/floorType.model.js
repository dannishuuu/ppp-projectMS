const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_FLOOR_TYPE_FIELDS = `
  ft.id,
  ft.name,
  ft.code,
  ft.description,
  ft.is_active,
  ft.created_at,
  ft.updated_at,
  ft.created_by,
  ft.updated_by,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name
`;

class FloorTypeModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, sortBy = 'name' } = options;
        let where = 'WHERE ft.is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) {
            where += ` AND ft.is_active = :isActive`;
            replacements.isActive = isActive;
        }

        if (search && search.trim()) {
            where += ` AND (ft.name ILIKE :search OR ft.code ILIKE :search OR ft.description ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM floor_types ft ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['name', 'code', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'name';
        replacements.limit = limit; 
        replacements.offset = offset;

        const rows = await db.query(`
          SELECT ${PUBLIC_FLOOR_TYPE_FIELDS} 
          FROM floor_types ft 
          LEFT JOIN users creator ON creator.id = ft.created_by
          LEFT JOIN users updater ON updater.id = ft.updated_by
          ${where} 
          ORDER BY ft.${validSortBy} ASC 
          LIMIT :limit OFFSET :offset`, 
          { replacements, type: QueryTypes.SELECT }
        );
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query(`
          SELECT ${PUBLIC_FLOOR_TYPE_FIELDS} 
          FROM floor_types ft 
          LEFT JOIN users creator ON creator.id = ft.created_by
          LEFT JOIN users updater ON updater.id = ft.updated_by
          WHERE ft.id = :id AND ft.is_deleted = false`, 
          { replacements: { id }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async findByName(name, excludeId = null) {
        let query = 'SELECT * FROM floor_types WHERE LOWER(name) = LOWER(:name) AND is_deleted = false';
        const replacements = { name };
        if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
        const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async findByCode(code, excludeId = null) {
        let query = 'SELECT * FROM floor_types WHERE code = :code AND is_deleted = false';
        const replacements = { code };
        if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
        const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async create(data) {
        const { name, code, description, createdBy } = data;
        const rows = await db.query(`
          INSERT INTO floor_types (name, code, description, created_by, updated_by) 
          VALUES (:name, :code, :description, :createdBy, :createdBy) RETURNING *`,
            {
                replacements: {
                    name,
                    code,
                    description: description || null,
                    createdBy: createdBy || null
                }, 
                type: QueryTypes.SELECT
            });
        return rows[0];
    }

    static async update(id, data) {
        const { name, code, description, isActive, updatedBy } = data;
        const setClauses = []; 
        const replacements = { id };

        if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
        if (code !== undefined) { setClauses.push('code = :code'); replacements.code = code; }
        if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');
        if (setClauses.length === 1) return null;

        const rows = await db.query(`UPDATE floor_types SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(`UPDATE floor_types SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    // Prevent deletion if used in building_floors
    static async hasFloors(id) {
        const query = `
      SELECT COUNT(*) as count FROM building_floors 
      WHERE floor_type_id = :id AND is_deleted = false
    `;
        const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
        return parseInt(rows[0]?.count || 0, 10) > 0;
    }
}
module.exports = FloorTypeModel;