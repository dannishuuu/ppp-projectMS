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
                                    INSERT INTO building_units (
                                        building_id, floor_id, floor_number, unit_number, area_value, area_unit_id, unit_use_type,
                                        is_rented, is_for_rent, created_by, updated_by
                                    )
                                    VALUES (
                                        :buildingId, :floorId, :floorNumber, :unitNumber, :areaValue, :areaUnitId, :unitUseType,
                                        :isRented, :isForRent, :createdBy, :createdBy
                                    )`,
                                    {
                                        replacements: {
                                            buildingId: building.id,
                                            floorId: createdFloor.id,
                                            floorNumber: floorNum,
                                            unitNumber: unitNum,
                                            areaValue: u.areaValue ? parseFloat(u.areaValue) : null,
                                            areaUnitId: u.areaUnitId || payload.areaUnitId || null,
                                            unitUseType: u.unitUseType || 'Commercial',
                                            isRented: u.isRented !== undefined ? Boolean(u.isRented) : false,
                                            isForRent: u.isForRent !== undefined ? Boolean(u.isForRent) : true,
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

            // Ensure total_floors in buildings matches the count of active floors
            await db.query(`
                UPDATE buildings SET
                    total_floors = (SELECT COUNT(*)::int FROM building_floors WHERE building_id = :buildingId AND is_deleted = false),
                    updated_at = NOW()
                WHERE id = :buildingId`,
                { replacements: { buildingId: building.id }, type: QueryTypes.UPDATE, transaction }
            );

            await transaction.commit();
            return { building, floorsCreated, unitsCreated };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async updateBuilding(id, payload, actorId) {
        const building = await this.getBuildingById(id);
        const { name, totalFloors, floors } = payload;

        if (name && name.trim()) {
            const existing = await BuildingModel.findByName(name.trim(), id);
            if (existing) { const err = new Error(`Building "${name.trim()}" already exists.`); err.status = 409; throw err; }
        }

        let numFloors = building.total_floors;
        if (totalFloors !== undefined && totalFloors !== null && totalFloors !== '') {
            numFloors = Number(totalFloors);
            if (isNaN(numFloors) || numFloors < 1 || !Number.isInteger(numFloors)) {
                const err = new Error('Total floors must be a whole number greater than 0.');
                err.status = 400;
                throw err;
            }
        }

        const transaction = await db.transaction();
        try {
            // 1. Update building details
            await db.query(`
                UPDATE buildings SET
                    name = COALESCE(:name, name),
                    name_amharic = :nameAmharic,
                    name_afaan_oromo = :nameAfaanOromo,
                    description = :description,
                    region_id = :regionId,
                    zone_id = :zoneId,
                    woreda_id = :woredaId,
                    address = :address,
                    building_type_id = COALESCE(:buildingTypeId, building_type_id),
                    total_floors = :totalFloors,
                    total_area_value = :totalAreaValue,
                    area_unit_id = :areaUnitId,
                    year_built = :yearBuilt,
                    updated_by = :updatedBy,
                    updated_at = NOW()
                WHERE id = :id AND is_deleted = false`,
                {
                    replacements: {
                        id,
                        name: name ? name.trim() : null,
                        nameAmharic: payload.nameAmharic !== undefined ? (payload.nameAmharic ? payload.nameAmharic.trim() : null) : building.name_amharic,
                        nameAfaanOromo: payload.nameAfaanOromo !== undefined ? (payload.nameAfaanOromo ? payload.nameAfaanOromo.trim() : null) : building.name_afaan_oromo,
                        description: payload.description !== undefined ? (payload.description ? payload.description.trim() : null) : building.description,
                        regionId: payload.regionId !== undefined ? (payload.regionId || null) : building.region_id,
                        zoneId: payload.zoneId !== undefined ? (payload.zoneId || null) : building.zone_id,
                        woredaId: payload.woredaId !== undefined ? (payload.woredaId || null) : building.woreda_id,
                        address: payload.address !== undefined ? (payload.address ? payload.address.trim() : null) : building.address,
                        buildingTypeId: payload.buildingTypeId || null,
                        totalFloors: numFloors,
                        totalAreaValue: payload.totalAreaValue !== undefined ? (payload.totalAreaValue ? parseFloat(payload.totalAreaValue) : null) : building.total_area_value,
                        areaUnitId: payload.areaUnitId !== undefined ? (payload.areaUnitId || null) : building.area_unit_id,
                        yearBuilt: payload.yearBuilt !== undefined ? (payload.yearBuilt ? parseInt(payload.yearBuilt, 10) : null) : building.year_built,
                        updatedBy: actorId || null,
                    },
                    type: QueryTypes.UPDATE,
                    transaction,
                }
            );

            // 2. Synchronize floor and unit line items if provided
            if (Array.isArray(floors)) {
                const retainedFloorIds = [];

                for (const f of floors) {
                    const floorNum = parseInt(f.floorNumber, 10);
                    const floorName = (f.name && f.name.trim()) || `Floor ${floorNum}`;
                    const expectedUnits = parseInt(f.expectedUnitCount, 10) || 0;
                    const floorTypeId = f.floorTypeId || null;
                    let floorId = f.id;

                    if (floorId) {
                        await db.query(`
                            UPDATE building_floors SET
                                floor_number = :floorNumber,
                                name = :name,
                                expected_unit_count = :expectedUnitCount,
                                floor_type_id = :floorTypeId,
                                updated_by = :updatedBy,
                                updated_at = NOW()
                            WHERE id = :floorId AND is_deleted = false`,
                            {
                                replacements: { floorId, floorNumber: floorNum, name: floorName, expectedUnitCount: expectedUnits, floorTypeId, updatedBy: actorId || null },
                                type: QueryTypes.UPDATE,
                                transaction,
                            }
                        );
                        retainedFloorIds.push(floorId);
                    } else {
                        const newFloorRows = await db.query(`
                            INSERT INTO building_floors (building_id, floor_number, name, expected_unit_count, floor_type_id, created_by, updated_by)
                            VALUES (:buildingId, :floorNumber, :name, :expectedUnitCount, :floorTypeId, :createdBy, :createdBy)
                            RETURNING id`,
                            {
                                replacements: {
                                    buildingId: id,
                                    floorNumber: floorNum,
                                    name: floorName,
                                    expectedUnitCount: expectedUnits,
                                    floorTypeId,
                                    createdBy: actorId || null,
                                },
                                type: QueryTypes.SELECT,
                                transaction,
                            }
                        );
                        floorId = newFloorRows[0]?.id;
                        if (floorId) retainedFloorIds.push(floorId);
                    }

                    // Synchronize units for this floor
                    if (floorId && Array.isArray(f.units)) {
                        const retainedUnitIds = [];
                        for (const u of f.units) {
                            const unitNum = u.unitNumber && u.unitNumber.trim();
                            if (unitNum) {
                                if (u.id) {
                                    await db.query(`
                                        UPDATE building_units SET
                                            floor_number = :floorNumber,
                                            unit_number = :unitNumber,
                                            area_value = :areaValue,
                                            area_unit_id = :areaUnitId,
                                            unit_use_type = :unitUseType,
                                            is_rented = COALESCE(:isRented, is_rented),
                                            is_for_rent = COALESCE(:isForRent, is_for_rent),
                                            is_active = COALESCE(:isActive, is_active),
                                            is_deleted = false,
                                            deleted_at = NULL,
                                            deleted_by = NULL,
                                            updated_by = :updatedBy,
                                            updated_at = NOW()
                                        WHERE id = :unitId`,
                                        {
                                            replacements: {
                                                unitId: u.id,
                                                floorNumber: floorNum,
                                                unitNumber: unitNum,
                                                areaValue: u.areaValue ? parseFloat(u.areaValue) : null,
                                                areaUnitId: u.areaUnitId || payload.areaUnitId || null,
                                                unitUseType: u.unitUseType || 'Commercial',
                                                isRented: u.isRented !== undefined ? Boolean(u.isRented) : null,
                                                isForRent: u.isForRent !== undefined ? Boolean(u.isForRent) : null,
                                                isActive: u.isActive !== undefined ? Boolean(u.isActive) : null,
                                                updatedBy: actorId || null,
                                            },
                                            type: QueryTypes.UPDATE,
                                            transaction,
                                        }
                                    );
                                    retainedUnitIds.push(u.id);
                                } else {
                                    const newUnitRows = await db.query(`
                                        INSERT INTO building_units (
                                            building_id, floor_id, floor_number, unit_number, area_value, area_unit_id, unit_use_type,
                                            is_rented, is_for_rent, is_active, is_deleted, created_by, updated_by
                                        )
                                        VALUES (
                                            :buildingId, :floorId, :floorNumber, :unitNumber, :areaValue, :areaUnitId, :unitUseType,
                                            :isRented, :isForRent, COALESCE(:isActive, true), false, :createdBy, :createdBy
                                        )
                                        RETURNING id`,
                                        {
                                            replacements: {
                                                buildingId: id,
                                                floorId,
                                                floorNumber: floorNum,
                                                unitNumber: unitNum,
                                                areaValue: u.areaValue ? parseFloat(u.areaValue) : null,
                                                areaUnitId: u.areaUnitId || payload.areaUnitId || null,
                                                unitUseType: u.unitUseType || 'Commercial',
                                                isRented: u.isRented !== undefined ? Boolean(u.isRented) : false,
                                                isForRent: u.isForRent !== undefined ? Boolean(u.isForRent) : true,
                                                isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
                                                createdBy: actorId || null,
                                            },
                                            type: QueryTypes.SELECT,
                                            transaction,
                                        }
                                    );
                                    const insertedId = newUnitRows[0]?.id;
                                    if (insertedId) {
                                        retainedUnitIds.push(insertedId);
                                    }
                                }
                            }
                        }

                        // Soft-delete units of this floor that were removed
                        if (retainedUnitIds.length > 0) {
                            await db.query(`
                                UPDATE building_units SET is_deleted = true, is_active = false, deleted_at = NOW(), deleted_by = :deletedBy
                                WHERE floor_id = :floorId AND id NOT IN (:retainedUnitIds) AND is_deleted = false`,
                                {
                                    replacements: { floorId, retainedUnitIds, deletedBy: actorId || null },
                                    type: QueryTypes.UPDATE,
                                    transaction,
                                }
                            );
                        }
                    }
                }

                // Soft-delete floors of this building that were removed
                if (retainedFloorIds.length > 0) {
                    await db.query(`
                        UPDATE building_floors SET is_deleted = true, is_active = false, deleted_at = NOW(), deleted_by = :deletedBy
                        WHERE building_id = :buildingId AND id NOT IN (:retainedFloorIds) AND is_deleted = false`,
                        {
                            replacements: { buildingId: id, retainedFloorIds, deletedBy: actorId || null },
                            type: QueryTypes.UPDATE,
                            transaction,
                        }
                    );
                }
            }

            // Ensure total_floors in buildings matches the count of active floors
            await db.query(`
                UPDATE buildings SET
                    total_floors = (SELECT COUNT(*)::int FROM building_floors WHERE building_id = :buildingId AND is_deleted = false),
                    updated_at = NOW()
                WHERE id = :buildingId`,
                { replacements: { buildingId: id }, type: QueryTypes.UPDATE, transaction }
            );

            await transaction.commit();
            return this.getBuildingById(id);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
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