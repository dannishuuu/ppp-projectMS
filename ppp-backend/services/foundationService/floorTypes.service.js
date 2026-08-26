const FloorTypeModel = require('../../models/floorType.model');

class FloorTypeService {
    static async getFloorTypes(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await FloorTypeModel.findAll({ limit, offset, search, isActive });
        return { floorTypes: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getFloorTypeById(id) {
        const type = await FloorTypeModel.findById(id);
        if (!type) { const err = new Error('Floor type not found.'); err.status = 404; throw err; }
        return type;
    }

    static async createFloorType(payload, actorId) {
        const { name, code, description } = payload;

        if (!name || !name.trim()) { const err = new Error('Floor type name is required.'); err.status = 400; throw err; }
        if (!code || !code.trim()) { const err = new Error('Floor type code is required.'); err.status = 400; throw err; }

        const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
        const existingName = await FloorTypeModel.findByName(name.trim());
        if (existingName) { const err = new Error(`Floor type with name "${name.trim()}" already exists.`); err.status = 409; throw err; }

        const existingCode = await FloorTypeModel.findByCode(cleanCode);
        if (existingCode) { const err = new Error(`Floor type with code "${cleanCode}" already exists.`); err.status = 409; throw err; }

        const created = await FloorTypeModel.create({
            name: name.trim(),
            code: cleanCode,
            description: description?.trim() || null,
            createdBy: actorId
        });
        return this.getFloorTypeById(created.id);
    }

    static async updateFloorType(id, payload, actorId) {
        await this.getFloorTypeById(id);
        const { name, code, description } = payload;

        if (name && name.trim()) {
            const existingName = await FloorTypeModel.findByName(name.trim(), id);
            if (existingName) { const err = new Error(`Floor type with name "${name.trim()}" already exists.`); err.status = 409; throw err; }
        }

        if (code && code.trim()) {
            const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
            const existingCode = await FloorTypeModel.findByCode(cleanCode, id);
            if (existingCode) { const err = new Error(`Floor type with code "${cleanCode}" already exists.`); err.status = 409; throw err; }
        }

        const updated = await FloorTypeModel.update(id, {
            name: name ? name.trim() : undefined,
            code: code ? code.trim().toUpperCase().replace(/\s+/g, '') : undefined,
            description: description !== undefined ? (description ? description.trim() : null) : undefined,
            updatedBy: actorId,
        });

        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        return this.getFloorTypeById(id);
    }

    static async toggleFloorTypeStatus(id, actorId) {
        const type = await this.getFloorTypeById(id);
        const result = await FloorTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        return { message: `Floor type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async deleteFloorType(id, actorId) {
        const type = await this.getFloorTypeById(id);

        const hasFloors = await FloorTypeModel.hasFloors(id);
        if (hasFloors) {
            const err = new Error(`Cannot delete floor type "${type.name}" because it is currently assigned to building floors.`);
            err.status = 409;
            throw err;
        }

        await FloorTypeModel.softDelete(id, actorId);
        return { message: `Floor type "${type.name}" has been deleted successfully.` };
    }
}
module.exports = FloorTypeService;