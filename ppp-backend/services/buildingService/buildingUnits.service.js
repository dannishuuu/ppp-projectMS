const BuildingUnitModel = require('../../models/buildingUnit.model');
const BuildingFloorModel = require('../../models/buildingFloor.model');

class BuildingUnitService {
    static async getUnits(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all', isRented = null, isForRent = null, buildingId, floorId } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await BuildingUnitModel.findAll({
            limit,
            offset,
            search,
            isActive,
            isRented,
            isForRent,
            buildingId,
            floorId
        });
        return { units: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getUnitById(id) {
        const unit = await BuildingUnitModel.findById(id);
        if (!unit) { const err = new Error('Building unit not found.'); err.status = 404; throw err; }
        return unit;
    }

    static async createUnit(payload, actorId) {
        const { buildingId, floorId, floorNumber, unitNumber, isRented, isForRent } = payload;

        if (!buildingId) { const err = new Error('Building ID is required.'); err.status = 400; throw err; }
        if (!floorId) { const err = new Error('Floor ID is required.'); err.status = 400; throw err; }
        if (floorNumber === undefined) { const err = new Error('Floor number is required.'); err.status = 400; throw err; }
        if (!unitNumber || !unitNumber.trim()) { const err = new Error('Unit number is required.'); err.status = 400; throw err; }

        // Check Capacity: Ensure the floor isn't overbooked
        const floor = await BuildingFloorModel.findById(floorId);
        if (!floor) { const err = new Error('Assigned floor not found.'); err.status = 404; throw err; }

        const currentUnitCount = await BuildingFloorModel.countUnitsByFloorId(floorId);
        if (currentUnitCount >= floor.expected_unit_count) {
            const err = new Error(`Cannot create unit. Floor "${floor.name}" has reached its maximum capacity of ${floor.expected_unit_count} units.`);
            err.status = 409;
            throw err;
        }

        return BuildingUnitModel.create({
            ...payload,
            unitNumber: unitNumber.trim(),
            isRented: isRented !== undefined ? Boolean(isRented) : false,
            isForRent: isForRent !== undefined ? Boolean(isForRent) : true,
            isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
            createdBy: actorId
        });
    }

    static async updateUnit(id, payload, actorId) {
        await this.getUnitById(id);
        const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : (payload.is_active !== undefined ? Boolean(payload.is_active) : undefined);
        const updated = await BuildingUnitModel.update(id, { ...payload, isActive, updatedBy: actorId });
        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        return this.getUnitById(id);
    }

    static async toggleUnitStatus(id, actorId) {
        const unit = await this.getUnitById(id);
        const result = await BuildingUnitModel.update(id, { isActive: !unit.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        return { message: `Unit "${unit.unit_number}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async toggleUnitRented(id, actorId) {
        const unit = await this.getUnitById(id);
        const newRented = !unit.is_rented;
        const result = await BuildingUnitModel.update(id, { isRented: newRented, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to update rented status.'); err.status = 500; throw err; }
        return {
            message: `Unit "${unit.unit_number}" marked as ${newRented ? 'Rented' : 'Vacant / Not Rented'}.`,
            is_rented: result.is_rented
        };
    }

    static async toggleUnitForRent(id, actorId) {
        const unit = await this.getUnitById(id);
        const newForRent = !unit.is_for_rent;
        const result = await BuildingUnitModel.update(id, { isForRent: newForRent, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to update for-rent status.'); err.status = 500; throw err; }
        return {
            message: `Unit "${unit.unit_number}" is now ${newForRent ? 'Available for rent' : 'Not for rent'}.`,
            is_for_rent: result.is_for_rent
        };
    }

    static async deleteUnit(id, actorId) {
        await this.getUnitById(id);
        await BuildingUnitModel.softDelete(id, actorId);
        return { message: `Unit has been deleted successfully.` };
    }
}
module.exports = BuildingUnitService;