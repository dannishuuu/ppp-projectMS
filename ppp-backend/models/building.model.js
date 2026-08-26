const db = require('../config/database');
const { QueryTypes } = require('sequelize');

class BuildingModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, buildingTypeId, regionId, zoneId, woredaId, sortBy = 'name' } = options;
        let where = 'WHERE is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) { where += ` AND is_active = :isActive`; replacements.isActive = isActive; }
        if (buildingTypeId) { where += ` AND building_type_id = :buildingTypeId`; replacements.buildingTypeId = buildingTypeId; }
        if (regionId) { where += ` AND region_id = :regionId`; replacements.regionId = regionId; }
        if (zoneId) { where += ` AND zone_id = :zoneId`; replacements.zoneId = zoneId; }
        if (woredaId) { where += ` AND woreda_id = :woredaId`; replacements.woredaId = woredaId; }
        if (search && search.trim()) {
            where += ` AND (name ILIKE :search OR name_amharic ILIKE :search OR name_afaan_oromo ILIKE :search OR description ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM buildings ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['name', 'created_at', 'updated_at', 'year_built'].includes(sortBy) ? sortBy : 'name';
        replacements.limit = limit; replacements.offset = offset;

        const rows = await db.query(`SELECT * FROM buildings ${where} ORDER BY ${validSortBy} ASC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT });
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query('SELECT * FROM buildings WHERE id = :id AND is_deleted = false', { replacements: { id }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async findByName(name, excludeId = null) {
        let query = 'SELECT * FROM buildings WHERE name = :name AND is_deleted = false';
        const replacements = { name };
        if (excludeId) { query += ' AND id != :excludeId'; replacements.excludeId = excludeId; }
        const rows = await db.query(query, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async create(data) {
        const { name, nameAmharic, nameAfaanOromo, description, regionId, zoneId, woredaId, address, buildingTypeId, totalFloors, totalAreaValue, areaUnitId, yearBuilt, createdBy } = data;
        const rows = await db.query(`
      INSERT INTO buildings (
        name, name_amharic, name_afaan_oromo, description, region_id, zone_id, woreda_id, address, 
        building_type_id, total_floors, total_area_value, area_unit_id, year_built, created_by
      ) 
      VALUES (:name, :nameAmharic, :nameAfaanOromo, :description, :regionId, :zoneId, :woredaId, :address, :buildingTypeId, :totalFloors, :totalAreaValue, :areaUnitId, :yearBuilt, :createdBy) 
      RETURNING *`,
            {
                replacements: {
                    name,
                    nameAmharic: nameAmharic || null,
                    nameAfaanOromo: nameAfaanOromo || null,
                    description: description || null,
                    regionId: regionId || null,
                    zoneId: zoneId || null,
                    woredaId: woredaId || null,
                    address: address || null,
                    buildingTypeId: buildingTypeId || null,
                    totalFloors,
                    totalAreaValue: totalAreaValue || null,
                    areaUnitId: areaUnitId || null,
                    yearBuilt: yearBuilt || null,
                    createdBy: createdBy || null
                }, type: QueryTypes.SELECT
            });
        return rows[0];
    }

    static async update(id, data) {
        const { name, nameAmharic, nameAfaanOromo, description, regionId, zoneId, woredaId, address, buildingTypeId, totalFloors, totalAreaValue, areaUnitId, yearBuilt, isActive, updatedBy } = data;
        const setClauses = []; const replacements = { id };

        if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
        if (nameAmharic !== undefined) { setClauses.push('name_amharic = :nameAmharic'); replacements.nameAmharic = nameAmharic; }
        if (nameAfaanOromo !== undefined) { setClauses.push('name_afaan_oromo = :nameAfaanOromo'); replacements.nameAfaanOromo = nameAfaanOromo; }
        if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
        if (regionId !== undefined) { setClauses.push('region_id = :regionId'); replacements.regionId = regionId; }
        if (zoneId !== undefined) { setClauses.push('zone_id = :zoneId'); replacements.zoneId = zoneId; }
        if (woredaId !== undefined) { setClauses.push('woreda_id = :woredaId'); replacements.woredaId = woredaId; }
        if (address !== undefined) { setClauses.push('address = :address'); replacements.address = address; }
        if (buildingTypeId !== undefined) { setClauses.push('building_type_id = :buildingTypeId'); replacements.buildingTypeId = buildingTypeId; }
        if (totalFloors !== undefined) { setClauses.push('total_floors = :totalFloors'); replacements.totalFloors = totalFloors; }
        if (totalAreaValue !== undefined) { setClauses.push('total_area_value = :totalAreaValue'); replacements.totalAreaValue = totalAreaValue; }
        if (areaUnitId !== undefined) { setClauses.push('area_unit_id = :areaUnitId'); replacements.areaUnitId = areaUnitId; }
        if (yearBuilt !== undefined) { setClauses.push('year_built = :yearBuilt'); replacements.yearBuilt = yearBuilt; }
        if (isActive !== undefined) { setClauses.push('is_active = :isActive'); replacements.isActive = isActive; }
        if (updatedBy !== undefined) { setClauses.push('updated_by = :updatedBy'); replacements.updatedBy = updatedBy; }

        setClauses.push('updated_at = NOW()');
        if (setClauses.length === 1) return null;

        const rows = await db.query(`UPDATE buildings SET ${setClauses.join(', ')} WHERE id = :id AND is_deleted = false RETURNING *`, { replacements, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async softDelete(id, deletedBy) {
        const rows = await db.query(`UPDATE buildings SET is_deleted = true, deleted_at = NOW(), deleted_by = :deletedBy, is_active = false WHERE id = :id AND is_deleted = false RETURNING *`, { replacements: { id, deletedBy: deletedBy || null }, type: QueryTypes.SELECT });
        return rows[0] || null;
    }

    static async hasFloors(id) {
        const rows = await db.query(`SELECT COUNT(*) as count FROM building_floors WHERE building_id = :id AND is_deleted = false`, { replacements: { id }, type: QueryTypes.SELECT });
        return parseInt(rows[0]?.count || 0, 10) > 0;
    }
}
module.exports = BuildingModel;