const ServiceChargeTypeModel = require('../../models/serviceChargeType.model');

class ServiceChargeTypeService {
    static async getServiceChargeTypes(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await ServiceChargeTypeModel.findAll({ limit, offset, search, isActive });
        return { serviceChargeTypes: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getServiceChargeTypeById(id) {
        const type = await ServiceChargeTypeModel.findById(id);
        if (!type) { const err = new Error('Service charge type not found.'); err.status = 404; throw err; }
        return type;
    }

    static async createServiceChargeType(payload, actorId) {
        const { name, code, description, isMetered } = payload;

        if (!name || !name.trim()) { const err = new Error('Service charge type name is required.'); err.status = 400; throw err; }
        if (!code || !code.trim()) { const err = new Error('Service charge type code is required.'); err.status = 400; throw err; }

        const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');

        const existingCode = await ServiceChargeTypeModel.findByCode(cleanCode);
        if (existingCode) { const err = new Error(`Service charge type with code "${cleanCode}" already exists.`); err.status = 409; throw err; }

        const existingName = await ServiceChargeTypeModel.findByName(name.trim());
        if (existingName) { const err = new Error(`Service charge type "${name.trim()}" already exists.`); err.status = 409; throw err; }

        const created = await ServiceChargeTypeModel.create({
            name: name.trim(),
            code: cleanCode,
            description: description?.trim() || null,
            isMetered: isMetered !== undefined ? Boolean(isMetered) : false,
            createdBy: actorId
        });

        return this.getServiceChargeTypeById(created.id);
    }

    static async updateServiceChargeType(id, payload, actorId) {
        await this.getServiceChargeTypeById(id);
        const { name, code, description, isMetered } = payload;

        if (code && code.trim()) {
            const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
            const existingCode = await ServiceChargeTypeModel.findByCode(cleanCode, id);
            if (existingCode) { const err = new Error(`Service charge type with code "${cleanCode}" already exists.`); err.status = 409; throw err; }
        }

        if (name && name.trim()) {
            const existing = await ServiceChargeTypeModel.findByName(name.trim(), id);
            if (existing) { const err = new Error(`Service charge type "${name.trim()}" already exists.`); err.status = 409; throw err; }
        }

        const updated = await ServiceChargeTypeModel.update(id, {
            name: name ? name.trim() : undefined,
            code: code ? code.trim().toUpperCase().replace(/\s+/g, '') : undefined,
            description: description !== undefined ? (description ? description.trim() : null) : undefined,
            isMetered: isMetered !== undefined ? Boolean(isMetered) : undefined,
            updatedBy: actorId,
        });

        if (!updated) { const err = new Error('No changes were applied.'); err.status = 400; throw err; }
        return this.getServiceChargeTypeById(id);
    }

    static async toggleServiceChargeTypeStatus(id, actorId) {
        const type = await this.getServiceChargeTypeById(id);
        const result = await ServiceChargeTypeModel.update(id, { isActive: !type.is_active, updatedBy: actorId });
        if (!result) { const err = new Error('Failed to toggle status.'); err.status = 500; throw err; }
        return { message: `Service charge type "${type.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: result.is_active };
    }

    static async deleteServiceChargeType(id, actorId) {
        const type = await this.getServiceChargeTypeById(id);

        // Prevent deletion if it's already assigned to rental payment charges
        const hasAssoc = await ServiceChargeTypeModel.hasAssociations(id);
        if (hasAssoc) {
            const err = new Error('Cannot delete this service charge type because it is currently associated with active rental charges.');
            err.status = 400;
            throw err;
        }

        await ServiceChargeTypeModel.softDelete(id, actorId);
        return { message: `Service charge type "${type.name}" has been deleted successfully.` };
    }
}

module.exports = ServiceChargeTypeService;