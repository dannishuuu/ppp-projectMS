const db = require('../../config/database');
const { QueryTypes } = require('sequelize');
const BuildingFloorModel = require('../../models/buildingFloor.model');

class BuildingFloorService {
    static async syncBuildingFloorCount(buildingId, actorId) {
        if (!buildingId) return;
        await db.query(`
            UPDATE buildings SET
                total_floors = (SELECT COUNT(*)::int FROM building_floors WHERE building_id = :buildingId AND is_deleted = false),
                updated_by = COALESCE(:updatedBy, updated_by),
                updated_at = NOW()
            WHERE id = :buildingId`,
            { replacements: { buildingId, updatedBy: actorId || null }, type: QueryTypes.UPDATE }
        );
    }

    static async getFloors(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', buildingId } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await BuildingFloorModel.findAll({ limit, offset, search, isActive, buildingId });
        return { floors: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getFloorById(id) {
        const floor = await BuildingFloorModel.findById(id);
        if (!floor) { const err = new Error('Building floor not found.'); err.status = 404; throw err; }
        return floor;
    }

    static async createFloor(payload, actorId) {
        const { buildingId, floorNumber, name, expectedUnitCount, floorTypeId } = payload;

        if (!buildingId) { const err = new Error('Building ID is required.'); err.status = 400; throw err; }
        if (!floorTypeId) { const err = new Error('Floor Type ID is required.'); err.status = 400; throw err; }
        if (floorNumber === undefined) { const err = new Error('Floor number is required.'); err.status = 400; throw err; }
        if (!name || !name.trim()) { const err = new Error('Floor name is required.'); err.status = 400; throw err; }

        const floor = await BuildingFloorModel.create({ ...payload, name: name.trim(), createdBy: actorId });
        await this.syncBuildingFloorCount(buildingId, actorId);
        return floor;
    }

    static async updateFloor(id, payload, actorId) {
        const floor = await this.getFloorById(id);
        const updated = await BuildingFloorModel.update(id, { ...payload, updatedBy: actorId });
        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        await this.syncBuildingFloorCount(floor.building_id, actorId);
        return this.getFloorById(id);
    }

    static async toggleFloorStatus(id, actorId) {
        const floor = await this.getFloorById(id);
        const result = await BuildingFloorModel.update(id, { isActive: !floor.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        await this.syncBuildingFloorCount(floor.building_id, actorId);
        return { message: `Floor "${floor.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async deleteFloor(id, actorId) {
        const floor = await this.getFloorById(id);
        const hasUnits = await BuildingFloorModel.hasUnits(id);
        if (hasUnits) { const err = new Error(`Cannot delete floor "${floor.name}" because it has active units assigned to it.`); err.status = 409; throw err; }

        await BuildingFloorModel.softDelete(id, actorId);
        await this.syncBuildingFloorCount(floor.building_id, actorId);
        return { message: `Floor "${floor.name}" has been deleted successfully.` };
    }
}
module.exports = BuildingFloorService;