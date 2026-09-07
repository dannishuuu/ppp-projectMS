const BusinessSectorModel = require('../../models/businessSector.model');

class BusinessSectorService {
    static async getBusinessSectors(options = {}) {
        const { page = 1, limit = 10, search = '', status = 'all' } = options;
        const offset = (page - 1) * limit;
        let isActive = null;
        if (status === 'active') isActive = true;
        if (status === 'inactive') isActive = false;

        const { rows, total } = await BusinessSectorModel.findAll({ limit, offset, search, isActive });
        return { businessSectors: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    static async getBusinessSectorById(id) {
        const sector = await BusinessSectorModel.findById(id);
        if (!sector) { 
            const err = new Error('Business sector not found.'); 
            err.status = 404; 
            throw err; 
        }
        return sector;
    }

    static async createBusinessSector(payload, actorId) {
        const { engName, amhName, oroName, description } = payload;

        if (!engName || !engName.trim()) { 
            const err = new Error('Business sector English name is required.'); 
            err.status = 400; 
            throw err; 
        }

        const existing = await BusinessSectorModel.findByName(engName.trim());
        if (existing) { 
            const err = new Error(`Business sector with English name "${engName.trim()}" already exists.`); 
            err.status = 409; 
            throw err; 
        }

        return BusinessSectorModel.create({
            engName: engName.trim(),
            amhName: amhName?.trim() || null,
            oroName: oroName?.trim() || null,
            description: description?.trim() || null,
            createdBy: actorId
        });
    }

    static async updateBusinessSector(id, payload, actorId) {
        await this.getBusinessSectorById(id);
        const { engName, amhName, oroName, description } = payload;

        if (engName && engName.trim()) {
            const existing = await BusinessSectorModel.findByName(engName.trim(), id);
            if (existing) { 
                const err = new Error(`Business sector with English name "${engName.trim()}" already exists.`); 
                err.status = 409; 
                throw err; 
            }
        }

        const updated = await BusinessSectorModel.update(id, {
            engName: engName ? engName.trim() : undefined,
            amhName: amhName !== undefined ? (amhName ? amhName.trim() : null) : undefined,
            oroName: oroName !== undefined ? (oroName ? oroName.trim() : null) : undefined,
            description: description !== undefined ? (description ? description.trim() : null) : undefined,
            updatedBy: actorId,
        });

        if (!updated) { 
            const err = new Error('No changes were applied.'); 
            err.status = 400; 
            throw err; 
        }
        return this.getBusinessSectorById(id);
    }

    static async toggleBusinessSectorStatus(id, actorId) {
        const sector = await this.getBusinessSectorById(id);
        const result = await BusinessSectorModel.update(id, { 
            isActive: !sector.isActive, 
            updatedBy: actorId 
        });
        
        if (!result) { 
            const err = new Error('Failed to toggle status.'); 
            err.status = 500; 
            throw err; 
        }
        
        return { 
            message: `Business sector "${sector.engName}" has been ${result.isActive ? 'activated' : 'deactivated'} successfully.`, 
            isActive: result.isActive 
        };
    }

    static async deleteBusinessSector(id, actorId) {
        const sector = await this.getBusinessSectorById(id);

        const hasAssociations = await BusinessSectorModel.hasAssociations(id);
        if (hasAssociations) {
            const err = new Error(`Cannot delete business sector "${sector.engName}" because it is currently assigned to organizations.`);
            err.status = 409;
            throw err;
        }

        await BusinessSectorModel.softDelete(id, actorId);
        return { message: `Business sector "${sector.engName}" has been deleted successfully.` };
    }
}

module.exports = BusinessSectorService;