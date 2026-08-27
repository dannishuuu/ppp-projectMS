const BuildingModel = require('../../models/building.model');
const db = require('../../config/database');
const { QueryTypes } = require('sequelize');

class BuildingService {
    static async getBuildings(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', buildingTypeId, regionId, zoneId, woredaId } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await BuildingModel.findAll({ limit, offset, search, isActive, buildingTypeId, regionId, zoneId, woredaId });
        return { buildings: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getBuildingById(id) {
        const building = await BuildingModel.findById(id);
        if (!building) { const err = new Error('Building not found.'); err.status = 404; throw err; }
        return building;
    }

    /**
     * Create building + manual floors and units line items inside a DB transaction.
     *
     * @param {object} payload  - Building fields + floors array
     * @param {string} actorId  - User performing the action
     */
    static async createBuilding(payload, actorId) {
        const { name, buildingTypeId, totalFloors, floors = [] } = payload;

        if (!name || !name.trim()) { const err = new Error('Building name is required.'); err.status = 400; throw err; }
        if (!buildingTypeId) { const err = new Error('Building Type ID is required.'); err.status = 400; throw err; }

        const numFloors = Number(totalFloors);
        if (!totalFloors || isNaN(numFloors) || numFloors < 1 || !Number.isInteger(numFloors)) {
            const err = new Error('Total floors must be a whole number greater than 0.');
            err.status = 400;
            throw err;
        }

        const existing = await BuildingModel.findByName(name.trim());
        if (existing) { const err = new Error(`Building "${name.trim()}" already exists.`); err.status = 409; throw err; }

        const transaction = await db.transaction();
        try {
            const buildingRows = await db.query(`
                INSERT INTO buildings (
                    name, name_amharic, name_afaan_oromo, description, region_id, zone_id, woreda_id, address,
                    building_type_id, total_floors, total_area_value, area_unit_id, year_built, created_by, updated_by
                )
                VALUES (:name, :nameAmharic, :nameAfaanOromo, :description, :regionId, :zoneId, :woredaId, :address,
                        :buildingTypeId, :totalFloors, :totalAreaValue, :areaUnitId, :yearBuilt, :createdBy, :createdBy)
                RETURNING *`,
                {
                    replacements: {
                        name: name.trim(),
                        nameAmharic: payload.nameAmharic ? payload.nameAmharic.trim() : null,
                        nameAfaanOromo: payload.nameAfaanOromo ? payload.nameAfaanOromo.trim() : null,
                        description: payload.description ? payload.description.trim() : null,
                        regionId: payload.regionId || null,
                        zoneId: payload.zoneId || null,
                        woredaId: payload.woredaId || null,
                        address: payload.address ? payload.address.trim() : null,
                        buildingTypeId,
                        totalFloors: numFloors,
                        totalAreaValue: payload.totalAreaValue ? parseFloat(payload.totalAreaValue) : null,
                        areaUnitId: payload.areaUnitId || null,
                        yearBuilt: payload.yearBuilt ? parseInt(payload.yearBuilt, 10) : null,
                        createdBy: actorId || null,
                    },
                    type: QueryTypes.SELECT,
                    transaction,
                }
            );
            const building = buildingRows[0];

            let floorsCreated = 0;
            let unitsCreated = 0;

            if (Array.isArray(floors) && floors.length > 0) {
                for (const f of floors) {
                    const floorNum = parseInt(f.floorNumber, 10);
                    const floorName = (f.name && f.name.trim()) || `Floor ${floorNum}`;
                    const expectedUnits = parseInt(f.expectedUnitCount, 10) || 0;
                    const floorTypeId = f.floorTypeId || null;

                    const floorRows = await db.query(`
                        INSERT INTO building_floors (building_id, floor_number, name, expected_unit_count, floor_type_id, created_by, updated_by)
                        VALUES (:buildingId, :floorNumber, :name, :expectedUnitCount, :floorTypeId, :createdBy, :createdBy)
                        RETURNING *`,
                        {
                            replacements: {
                                buildingId: building.id,
                                floorNumber: floorNum,
                                name: floorName,
                                expectedUnitCount: expectedUnits,
                                floorTypeId: floorTypeId || null,
                                createdBy: actorId || null,
                            },
                            type: QueryTypes.SELECT,
                            transaction,
                        }
                    );
                    const createdFloor = floorRows[0];
                    floorsCreated++;

                    if (Array.isArray(f.units) && f.units.length > 0) {
                        for (const u of f.units) {
                            const unitNum = u.unitNumber && u.unitNumber.trim();
                            if (unitNum) {
                                await db.query(`
                                    INSERT INTO building_units (building_id, floor_id, floor_number, unit_number, area_value, area_unit_id, unit_use_type, created_by, updated_by)
                                    VALUES (:buildingId, :floorId, :floorNumber, :unitNumber, :areaValue, :areaUnitId, :unitUseType, :createdBy, :createdBy)`,
                                    {
                                        replacements: {
                                            buildingId: building.id,
                                            floorId: createdFloor.id,
                                            floorNumber: floorNum,
                                            unitNumber: unitNum,
                                            areaValue: u.areaValue ? parseFloat(u.areaValue) : null,
                                            areaUnitId: u.areaUnitId || payload.areaUnitId || null,
                                            unitUseType: u.unitUseType || 'Commercial',
                                            createdBy: actorId || null,
                                        },
                                        type: QueryTypes.INSERT,
                                        transaction,
                                    }
                                );
                                unitsCreated++;
                            }
                        }
                    }
                }
            }

            await transaction.commit();
            return { building, floorsCreated, unitsCreated };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async updateBuilding(id, payload, actorId) {
        await this.getBuildingById(id);
        const { name, totalFloors } = payload;

        if (name && name.trim()) {
            const existing = await BuildingModel.findByName(name.trim(), id);
            if (existing) { const err = new Error(`Building "${name.trim()}" already exists.`); err.status = 409; throw err; }
        }

        if (totalFloors !== undefined && totalFloors !== null && totalFloors !== '') {
            const numFloors = Number(totalFloors);
            if (isNaN(numFloors) || numFloors < 1 || !Number.isInteger(numFloors)) {
                const err = new Error('Total floors must be a whole number greater than 0.');
                err.status = 400;
                throw err;
            }
        }

        const updated = await BuildingModel.update(id, { ...payload, updatedBy: actorId });
        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        return this.getBuildingById(id);
    }

    static async toggleBuildingStatus(id, actorId) {
        const building = await this.getBuildingById(id);
        const result = await BuildingModel.update(id, { isActive: !building.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        return { message: `Building "${building.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async deleteBuilding(id, actorId) {
        const building = await this.getBuildingById(id);

        const hasFloors = await BuildingModel.hasFloors(id);
        if (hasFloors) { const err = new Error(`Cannot delete building "${building.name}" because it has active floors assigned to it.`); err.status = 409; throw err; }

        await BuildingModel.softDelete(id, actorId);
        return { message: `Building "${building.name}" has been deleted successfully.` };
    }
}
module.exports = BuildingService;