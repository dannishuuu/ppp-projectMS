const BuildingModel = require('../../models/building.model');

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

    static async createBuilding(payload, actorId) {
        const { name, buildingTypeId, totalFloors } = payload;

        if (!name || !name.trim()) { const err = new Error('Building name is required.'); err.status = 400; throw err; }
        if (!buildingTypeId) { const err = new Error('Building Type ID is required.'); err.status = 400; throw err; }
        if (totalFloors === undefined || totalFloors === null) { const err = new Error('Total floors is required.'); err.status = 400; throw err; }

        const existing = await BuildingModel.findByName(name.trim());
        if (existing) { const err = new Error(`Building "${name.trim()}" already exists.`); err.status = 409; throw err; }

        return BuildingModel.create({ ...payload, name: name.trim(), createdBy: actorId });
    }

    static async updateBuilding(id, payload, actorId) {
        await this.getBuildingById(id);
        const { name } = payload;

        if (name && name.trim()) {
            const existing = await BuildingModel.findByName(name.trim(), id);
            if (existing) { const err = new Error(`Building "${name.trim()}" already exists.`); err.status = 409; throw err; }
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