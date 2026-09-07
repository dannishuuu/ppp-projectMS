const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class BusinessSectorModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null } = options;
        let where = 'WHERE is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) {
            where += ` AND is_active = :isActive`;
            replacements.isActive = isActive;
        }

        if (search && search.trim()) {
            where += ` AND (eng_name ILIKE :search OR amh_name ILIKE :search OR oro_name ILIKE :search OR description ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM business_sectors ${where}`,
            { replacements, type: QueryTypes.SELECT }
        );
        const total = parseInt(countResult[0]?.total || 0, 10);

        replacements.limit = limit;
        replacements.offset = offset;

        const rows = await db.query(
            `SELECT * FROM business_sectors ${where} ORDER BY eng_name ASC LIMIT :limit OFFSET :offset`,
            { replacements, type: QueryTypes.SELECT }
        );

        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query(
            `SELECT * FROM business_sectors WHERE id = :id AND is_deleted = false`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async findByName(engName, excludeId = null) {
        let query = 'SELECT * FROM business_sectors WHERE LOWER(eng_name) = LOWER(:engName) AND is_deleted = false';
        const replacements = { engName };
        
        if (excludeId) {
            query += ' AND id != :excludeId';
            replacements.excludeId = excludeId;
        }

        const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async create(data) {
        const { engName, amhName, oroName, description, createdBy } = data;
        const rows = await db.query(
            `INSERT INTO business_sectors (eng_name, amh_name, oro_name, description, created_by, updated_by)
             VALUES (:engName, :amhName, :oroName, :description, :createdBy, :createdBy)
             RETURNING *`,
            {
                replacements: { engName, amhName, oroName, description, createdBy },
                type: QueryTypes.SELECT
            }
        );
        return rows[0];
    }

    static async update(id, data) {
        const { engName, amhName, oroName, description, isActive, updatedBy } = data;
        const setClauses = [];
        const replacements = { id };

        if (engName !== undefined) { setClauses.push('eng_name = :engName'); replacements.engName = engName; }
        if (amhName !== undefined) { setClauses.push('amh_name = :amhName'); replacements.amhName = amhName; }
        if (oroName !== undefined) { setClauses.push('oro_name = :oroName'); replacements.oroName = oroName; }
        if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');

        if (setClauses.length === 1) return null;

        const rows = await db.query(
            `UPDATE business_sectors SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`,
            { replacements, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(
            `UPDATE business_sectors 
             SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false 
             WHERE id = :id AND is_deleted = false 
             RETURNING *`,
            { replacements: { id, deletedBy }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async hasAssociations(id) {
        // Check if this business sector is referenced in organizations
        const rows = await db.query(
            `SELECT COUNT(*) as count FROM organizations WHERE business_sector_id = :id AND is_deleted = false`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        return parseInt(rows[0]?.count || 0, 10) > 0;
    }
}

module.exports = BusinessSectorModel;