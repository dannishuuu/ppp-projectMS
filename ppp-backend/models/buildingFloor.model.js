const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class BuildingFloorModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, buildingId = null, sortBy = 'floor_number' } = options;
        let where = 'WHERE is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) { where += ` AND is_active = :isActive`; replacements.isActive = isActive; }
        if (buildingId) { where += ` AND building_id = :buildingId`; replacements.buildingId = buildingId; }
        if (search && search.trim()) { where += ` AND name ILIKE :search`; replacements.search = `%${search.trim()}%`; }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM building_floors ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['floor_number', 'name', 'created_at'].includes(sortBy) ? sortBy : 'floor_number';
        replacements.limit = limit; replacements.offset = offset;

        const rows = await db.query(`SELECT * FROM building_floors ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query('SELECT * FROM building_floors WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async create(data) {
        const { buildingId, floorNumber, name, expectedUnitCount, floorTypeId, createdBy } = data;
        const rows = await db.query(`
      INSERT INTO building_floors (building_id, floor_number, name, expected_unit_count, floor_type_id, created_by) 
      VALUES (:buildingId, :floorNumber, :name, :expectedUnitCount, :floorTypeId, :createdBy) RETURNING *`,
            { replacements: { buildingId, floorNumber, name, expectedUnitCount, floorTypeId, createdBy: createdBy || null }, type: QueryTypes.SELECT });
        return rows[0];
    }

    static async update(id, data) {
        const { floorNumber, name, expectedUnitCount, isActive, updatedBy } = data;
        const setClauses = []; const replacements = { id };

        if (floorNumber !== undefined) { setClauses.push('floor_number = :floorNumber'); replacements.floorNumber = floorNumber; }
        if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
        if (expectedUnitCount !== undefined) { setClauses.push('expected_unit_count = :expectedUnitCount'); replacements.expectedUnitCount = expectedUnitCount; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');
        if (setClauses.length === 1) return null;

        const rows = await db.query(`UPDATE building_floors SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(`UPDATE building_floors SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async hasUnits(id) {
        const rows = await db.query(`SELECT COUNT(*) as count FROM building_units WHERE floor_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
        return parseInt(rows[0]?.count || 0, 10) > 0;
    }

    static async countUnitsByFloorId(id) {
        const rows = await db.query(`SELECT COUNT(*) as count FROM building_units WHERE floor_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
        return parseInt(rows[0]?.count || 0, 10);
    }
}
module.exports = BuildingFloorModel;