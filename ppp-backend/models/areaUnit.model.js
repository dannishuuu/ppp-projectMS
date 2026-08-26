const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class AreaUnitModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, sortBy = 'name' } = options;
        let where = 'WHERE is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) {
            where += ` AND is_active = :isActive`;
            replacements.isActive = isActive;
        }

        if (search && search.trim()) {
            where += ` AND (name ILIKE :search OR code ILIKE :search OR name_amharic ILIKE :search OR name_afaan_oromo ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM area_units ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['name', 'code', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'name';
        replacements.limit = limit; replacements.offset = offset;

        const rows = await db.query(`SELECT * FROM area_units ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query('SELECT * FROM area_units WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async findByCode(code, excludeId = null) {
        let query = 'SELECT * FROM area_units WHERE code = :code AND is_deleted = false';
        const replacements = { code };
        if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
        const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async create(data) {
        const { name, code, nameAmharic, nameAfaanOromo, description, createdBy } = data;
        const rows = await db.query(`
      INSERT INTO area_units (name, code, name_amharic, name_afaan_oromo, description, created_by) 
      VALUES (:name, :code, :nameAmharic, :nameAfaanOromo, :description, :createdBy) RETURNING *`,
            {
                replacements: {
                    name,
                    code,
                    nameAmharic: nameAmharic || null,
                    nameAfaanOromo: nameAfaanOromo || null,
                    description: description || null,
                    createdBy: createdBy || null
                }, type: QueryTypes.SELECT
            });
        return rows[0];
    }

    static async update(id, data) {
        const { name, code, nameAmharic, nameAfaanOromo, description, isActive, updatedBy } = data;
        const setClauses = []; const replacements = { id };

        if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
        if (code !== undefined) { setClauses.push('code = :code'); replacements.code = code; }
        if (nameAmharic !== undefined) { setClauses.push('name_amharic = :nameAmharic'); replacements.nameAmharic = nameAmharic; }
        if (nameAfaanOromo !== undefined) { setClauses.push('name_afaan_oromo = :nameAfaanOromo'); replacements.nameAfaanOromo = nameAfaanOromo; }
        if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');
        if (setClauses.length === 1) return null;

        const rows = await db.query(`UPDATE area_units SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(`UPDATE area_units SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    // Prevent deletion if used in buildings or building_units
    static async hasAssociations(id) {
        const query = `
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM buildings WHERE area_unit_id = :id AND is_deleted = false
        UNION ALL
        SELECT 1 FROM building_units WHERE area_unit_id = :id AND is_deleted = false
      ) as combined
    `;
        const rows = await db.query(query, { replacements: { id }, type: QueryTypes.SELECT });
        return parseInt(rows[0]?.count || 0, 10) > 0;
    }
}
module.exports = AreaUnitModel;