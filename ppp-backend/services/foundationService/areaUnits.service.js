const AreaUnitModel = require('../../models/areaUnit.model');

class AreaUnitService {
    static async getAreaUnits(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await AreaUnitModel.findAll({ limit, offset, search, isActive });
        return { areaUnits: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getAreaUnitById(id) {
        const unit = await AreaUnitModel.findById(id);
        if (!unit) { const err = new Error('Area unit not found.'); err.status = 404; throw err; }
        return unit;
    }

    static async createAreaUnit(payload, actorId) {
        const { name, code, nameAmharic, nameAfaanOromo, description } = payload;

        if (!name || !name.trim()) { const err = new Error('Area unit name is required.'); err.status = 400; throw err; }
        if (!code || !code.trim()) { const err = new Error('Area unit code is required.'); err.status = 400; throw err; }

        const existing = await AreaUnitModel.findByCode(code.trim());
        if (existing) { const err = new Error(`Area unit with code "${code.trim()}" already exists.`); err.status = 409; throw err; }

        return AreaUnitModel.create({
            name: name.trim(),
            code: code.trim(),
            nameAmharic: nameAmharic?.trim() || null,
            nameAfaanOromo: nameAfaanOromo?.trim() || null,
            description: description?.trim() || null,
            createdBy: actorId
        });
    }

    static async updateAreaUnit(id, payload, actorId) {
        await this.getAreaUnitById(id);
        const { name, code, nameAmharic, nameAfaanOromo, description } = payload;

        if (code && code.trim()) {
            const existing = await AreaUnitModel.findByCode(code.trim(), id);
            if (existing) { const err = new Error(`Area unit with code "${code.trim()}" already exists.`); err.status = 409; throw err; }
        }

        const updated = await AreaUnitModel.update(id, {
            name: name ? name.trim() : undefined,
            code: code ? code.trim() : undefined,
            nameAmharic: nameAmharic !== undefined ? (nameAmharic ? nameAmharic.trim() : null) : undefined,
            nameAfaanOromo: nameAfaanOromo !== undefined ? (nameAfaanOromo ? nameAfaanOromo.trim() : null) : undefined,
            description: description !== undefined ? (description ? description.trim() : null) : undefined,
            updatedBy: actorId,
        });

        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        return this.getAreaUnitById(id);
    }

    static async toggleAreaUnitStatus(id, actorId) {
        const unit = await this.getAreaUnitById(id);
        const result = await AreaUnitModel.update(id, { isActive: !unit.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        return { message: `Area unit "${unit.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async deleteAreaUnit(id, actorId) {
        const unit = await this.getAreaUnitById(id);

        const hasAssociations = await AreaUnitModel.hasAssociations(id);
        if (hasAssociations) {
            const err = new Error(`Cannot delete area unit "${unit.name}" because it is currently assigned to buildings or units.`);
            err.status = 409;
            throw err;
        }

        await AreaUnitModel.softDelete(id, actorId);
        return { message: `Area unit "${unit.name}" has been deleted successfully.` };
    }
}
module.exports = AreaUnitService;