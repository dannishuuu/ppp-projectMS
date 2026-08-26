const db = require('../config/database');
const { QueryTypes } = require('sequelize');

const PUBLIC_BUILDING_FIELDS = `
  b.id,
  b.name,
  b.name_amharic,
  b.name_afaan_oromo,
  b.description,
  b.region_id,
  b.zone_id,
  b.woreda_id,
  b.address,
  b.building_type_id,
  b.total_floors,
  b.total_area_value,
  b.area_unit_id,
  b.year_built,
  b.is_active,
  b.created_at,
  b.updated_at,
  b.created_by,
  b.updated_by,
  bt.name AS building_type_name,
  bt.type_code AS building_type_code,
  r.name AS region_name,
  z.name AS zone_name,
  w.name AS woreda_name,
  au.name AS area_unit_name,
  au.code AS area_unit_code,
  creator.first_name || ' ' || creator.last_name AS created_by_name,
  updater.first_name || ' ' || updater.last_name AS updated_by_name,
  (SELECT COUNT(*)::int FROM building_floors bf WHERE bf.building_id = b.id AND bf.is_deleted = false) AS floors_count,
  (SELECT COUNT(*)::int FROM building_units bu WHERE bu.building_id = b.id AND bu.is_deleted = false) AS units_count
`;

const BUILDING_JOINS = `
  LEFT JOIN building_types bt ON bt.id = b.building_type_id
  LEFT JOIN regions r ON r.id = b.region_id
  LEFT JOIN zones z ON z.id = b.zone_id
  LEFT JOIN woredas w ON w.id = b.woreda_id
  LEFT JOIN area_units au ON au.id = b.area_unit_id
  LEFT JOIN users creator ON creator.id = b.created_by
  LEFT JOIN users updater ON updater.id = b.updated_by
`;

class BuildingModel {
    static async findAll(options = {}) {
        const { limit = 100, offset = 0, search = '', isActive = null, buildingTypeId, regionId, zoneId, woredaId, sortBy = 'name' } = options;
        let where = 'WHERE b.is_deleted = false';
        const replacements = {};

        if (isActive !== null && isActive !== undefined) { where += ` AND b.is_active = :isActive`; replacements.isActive = isActive; }
        if (buildingTypeId) { where += ` AND b.building_type_id = :buildingTypeId`; replacements.buildingTypeId = buildingTypeId; }
        if (regionId) { where += ` AND b.region_id = :regionId`; replacements.regionId = regionId; }
        if (zoneId) { where += ` AND b.zone_id = :zoneId`; replacements.zoneId = zoneId; }
        if (woredaId) { where += ` AND b.woreda_id = :woredaId`; replacements.woredaId = woredaId; }
        if (search && search.trim()) {
            where += ` AND (b.name ILIKE :search OR b.name_amharic ILIKE :search OR b.name_afaan_oromo ILIKE :search OR b.description ILIKE :search OR b.address ILIKE :search)`;
            replacements.search = `%${search.trim()}%`;
        }

        const countResult = await db.query(`SELECT COUNT(*) as total FROM buildings b ${where}`, { replacements, type: QueryTypes.SELECT });
        const total = parseInt(countResult[0]?.total || 0, 10);

        const validSortBy = ['name', 'created_at', 'updated_at', 'year_built', 'total_floors'].includes(sortBy) ? `b.${sortBy}` : 'b.name';
        replacements.limit = limit; 
        replacements.offset = offset;

        const rows = await db.query(`
          SELECT ${PUBLIC_BUILDING_FIELDS} 
          FROM buildings b 
          ${BUILDING_JOINS}
          ${where} 
          ORDER BY ${validSortBy} ASC 
          LIMIT :limit OFFSET :offset`, 
          { replacements, type: QueryTypes.SELECT }
        );
        return { rows, total };
    }

    static async findById(id) {
        const rows = await db.query(`
          SELECT ${PUBLIC_BUILDING_FIELDS} 
          FROM buildings b 
          ${BUILDING_JOINS}
          WHERE b.id = :id AND b.is_deleted = false`, 
          { replacements: { id }, type: QueryTypes.SELECT }
        );
        return rows[0] || null;
    }

    static async findByName(name, excludeId = null) {
        let query = 'SELECT * FROM buildings WHERE LOWER(name) = LOWER(:name) AND is_deleted = false';
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
            building_type_id, total_floors, total_area_value, area_unit_id, year_built, created_by, updated_by
          ) 
          VALUES (:name, :nameAmharic, :nameAfaanOromo, :description, :regionId, :zoneId, :woredaId, :address, :buildingTypeId, :totalFloors, :totalAreaValue, :areaUnitId, :yearBuilt, :createdBy, :createdBy) 
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
                    totalFloors: parseInt(totalFloors, 10),
                    totalAreaValue: totalAreaValue ? parseFloat(totalAreaValue) : null,
                    areaUnitId: areaUnitId || null,
                    yearBuilt: yearBuilt ? parseInt(yearBuilt, 10) : null,
                    createdBy: createdBy || null
                }, 
                type: QueryTypes.SELECT
            });
        return rows[0];
    }

    static async update(id, data) {
        const { name, nameAmharic, nameAfaanOromo, description, regionId, zoneId, woredaId, address, buildingTypeId, totalFloors, totalAreaValue, areaUnitId, yearBuilt, isActive, updatedBy } = data;
        const setClauses = []; 
        const replacements = { id };

        if (name !== undefined) { setClauses.push('name = :name'); replacements.name = name; }
        if (nameAmharic !== undefined) { setClauses.push('name_amharic = :nameAmharic'); replacements.nameAmharic = nameAmharic; }
        if (nameAfaanOromo !== undefined) { setClauses.push('name_afaan_oromo = :nameAfaanOromo'); replacements.nameAfaanOromo = nameAfaanOromo; }
        if (description !== undefined) { setClauses.push('description = :description'); replacements.description = description; }
        if (regionId !== undefined) { setClauses.push('region_id = :regionId'); replacements.regionId = regionId; }
        if (zoneId !== undefined) { setClauses.push('zone_id = :zoneId'); replacements.zoneId = zoneId; }
        if (woredaId !== undefined) { setClauses.push('woreda_id = :woredaId'); replacements.woredaId = woredaId; }
        if (address !== undefined) { setClauses.push('address = :address'); replacements.address = address; }
        if (buildingTypeId !== undefined) { setClauses.push('building_type_id = :buildingTypeId'); replacements.buildingTypeId = buildingTypeId; }
        if (totalFloors !== undefined) { setClauses.push('total_floors = :totalFloors'); replacements.totalFloors = parseInt(totalFloors, 10); }
        if (totalAreaValue !== undefined) { setClauses.push('total_area_value = :totalAreaValue'); replacements.totalAreaValue = totalAreaValue ? parseFloat(totalAreaValue) : null; }
        if (areaUnitId !== undefined) { setClauses.push('area_unit_id = :areaUnitId'); replacements.areaUnitId = areaUnitId; }
        if (yearBuilt !== undefined) { setClauses.push('year_built = :yearBuilt'); replacements.yearBuilt = yearBuilt ? parseInt(yearBuilt, 10) : null; }
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