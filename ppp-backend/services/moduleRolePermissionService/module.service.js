// services/moduleRolePermissionService/module.service.js
const ModuleModel = require('../../models/module.model');

class ModuleService {
  /**
   * Get a paginated, filtered list of modules.
   * @param {object} options - { page, limit, search, status, sortBy }
   */
  static async getModules(options = {}) {
    const { page = 1, limit = 100, search = '', status = 'all', sortBy = 'name' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await ModuleModel.findAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      search,
      status,
      sortBy,
    });

    return {
      modules: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a module by ID.
   * @param {string} id
   */
  static async getModuleById(id) {
    const mod = await ModuleModel.findById(id);
    if (!mod) {
      const err = new Error('Module not found.');
      err.status = 404;
      throw err;
    }
    return mod;
  }

  /**
   * Create a new module.
   * @param {object} payload - { name, code, description, isActive }
   * @param {string} actorId
   */
  static async createModule(payload, actorId = null) {
    const { name, code, description, isActive, is_active } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Module name is required.');
      err.status = 400;
      throw err;
    }

    if (!code || !code.trim()) {
      const err = new Error('Module code is required.');
      err.status = 400;
      throw err;
    }

    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check code uniqueness
    const existing = await ModuleModel.findByCode(cleanCode);
    if (existing) {
      const err = new Error(`Module with code "${cleanCode}" already exists.`);
      err.status = 409;
      throw err;
    }

    const created = await ModuleModel.create(
      {
        name: name.trim(),
        code: cleanCode,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true),
      },
      actorId
    );

    return this.getModuleById(created.id);
  }

  /**
   * Update an existing module.
   * @param {string} id
   * @param {object} payload
   * @param {string} actorId
   */
  static async updateModule(id, payload, actorId = null) {
    const existing = await this.getModuleById(id);

    const { name, code, description, isActive, is_active } = payload;

    let cleanCode = undefined;
    if (code) {
      cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const conflict = await ModuleModel.findByCode(cleanCode, id);
      if (conflict) {
        const err = new Error(`Module with code "${cleanCode}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    await ModuleModel.update(
      id,
      {
        name: name !== undefined ? name.trim() : existing.name,
        code: cleanCode !== undefined ? cleanCode : existing.code,
        description: description !== undefined ? description?.trim() : existing.description,
        isActive: isActive !== undefined ? isActive : (is_active !== undefined ? is_active : existing.is_active),
      },
      actorId
    );

    return this.getModuleById(id);
  }

  /**
   * Toggle module status (active / inactive).
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleModuleStatus(id, actorId = null) {
    const mod = await this.getModuleById(id);
    const newStatus = !mod.is_active;

    await ModuleModel.update(id, { isActive: newStatus }, actorId);
    return this.getModuleById(id);
  }

  /**
   * Soft-delete a module.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteModule(id, actorId = null) {
    await this.getModuleById(id);
    await ModuleModel.softDelete(id, actorId);
    return { success: true, message: 'Module deleted successfully.' };
  }
}

module.exports = ModuleService;
