const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_UNIT_FIELDS = `
  bu.id,
  bu.building_id,
  bu.floor_id,
  bu.floor_number,
  bu.unit_number,
  bu.area_value,
  bu.area_unit_id,
  bu.unit_use_type,
  bu.is_active,
  bu.created_at,
  bu.updated_at,
  bu.created_by,
  bu.updated_by,
  bf.name AS floor_name,
  au.name AS area_unit_name,
  au.code AS area_unit_code
`;

class BuildingUnitModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, buildingId = null, floorId = null, sortBy = 'unit_number' } = options;
        let where = 'WHERE bu.is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) { where += ` AND bu.is_active = :isActive`; replacements.isActive = isActive; }
        if (buildingId) { where += ` AND bu.building_id = :buildingId`; replacements.buildingId = buildingId; }
        if (floorId) { where += ` AND bu.floor_id = :floorId`; replacements.floorId = floorId; }
        if (search && search.trim()) { where += ` AND (bu.unit_number ILIKE :search OR bu.unit_use_type ILIKE :search)`; replacements.search = `%${search.trim()}%`; }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM building_units bu ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['unit_number', 'floor_number', 'created_at'].includes(sortBy) ? `bu.${sortBy}` : 'bu.unit_number';
        replacements.limit = limit; 
        replacements.offset = offset;

        const rows = await db.query(`
          SELECT ${PUBLIC_UNIT_FIELDS} 
          FROM building_units bu 
          LEFT JOIN building_floors bf ON bf.id = bu.floor_id
          LEFT JOIN area_units au ON au.id = bu.area_unit_id
          ${where} 
          ORDER BY bu.floor_number ASC, ${validSortBy} ASC 
          LIMIT :limit OFFSET :offset`, 
          { replacements, type: QueryTypes.SELECT }
        );
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query(`
          SELECT ${PUBLIC_UNIT_FIELDS} 
          FROM building_units bu 
          LEFT JOIN building_floors bf ON bf.id = bu.floor_id
          LEFT JOIN area_units au ON au.id = bu.area_unit_id
          WHERE bu.id = :id AND bu.is_deleted = false`, 
          { replacements: { id }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async create(data) {
        const { buildingId, floorId, floorNumber, unitNumber, areaValue, areaUnitId, unitUseType, createdBy } = data;
        const rows = await db.query(`
      INSERT INTO building_units (building_id, floor_id, floor_number, unit_number, area_value, area_unit_id, unit_use_type, created_by) 
      VALUES (:buildingId, :floorId, :floorNumber, :unitNumber, :areaValue, :areaUnitId, :unitUseType, :createdBy) RETURNING *`,
            { replacements: { buildingId, floorId, floorNumber, unitNumber, areaValue: areaValue || null, areaUnitId: areaUnitId || null, unitUseType: unitUseType || null, createdBy: createdBy || null }, type: QueryTypes.SELECT });
        return rows[0];
    }

    static async update(id, data) {
        const { floorId, floorNumber, unitNumber, areaValue, areaUnitId, unitUseType, isActive, updatedBy } = data;
        const setClauses = []; const replacements = { id };

        if (floorId !== undefined) { setClauses.push('floor_id = :floorId'); replacements.floorId = floorId; }
        if (floorNumber !== undefined) { setClauses.push('floor_number = :floorNumber'); replacements.floorNumber = floorNumber; }
        if (unitNumber !== undefined) { setClauses.push('unit_number = :unitNumber'); replacements.unitNumber = unitNumber; }
        if (areaValue !== undefined) { setClauses.push('area_value = :areaValue'); replacements.areaValue = areaValue; }
        if (areaUnitId !== undefined) { setClauses.push('area_unit_id = :areaUnitId'); replacements.areaUnitId = areaUnitId; }
        if (unitUseType !== undefined) { setClauses.push('unit_use_type = :unitUseType'); replacements.unitUseType = unitUseType; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');
        if (setClauses.length === 1) return null;

        const rows = await db.query(`UPDATE building_units SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(`UPDATE building_units SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }
}
module.exports = BuildingUnitModel;