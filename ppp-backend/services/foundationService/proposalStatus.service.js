// services/foundationService/proposalStatus.service.js
const ProposalStatusModel = require('../../models/proposalStatus.model');

class ProposalStatusService {
  /**
   * Get a paginated, filtered list of proposal statuses.
   * @param {object} options - { page, limit, search, status }
   */
  static async getProposalStatuses(options = {}) {
    const { page = 1, limit = 10, search = '', status = 'all' } = options;
    const offset = (page - 1) * limit;

    const { rows, total } = await ProposalStatusModel.findAll({
      limit,
      offset,
      search,
      status,
    });

    return {
      proposalStatuses: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single proposal status by UUID.
   * @param {string} id
   */
  static async getProposalStatusById(id) {
    const status = await ProposalStatusModel.findById(id);
    if (!status) {
      const err = new Error('Proposal status not found.');
      err.status = 404;
      throw err;
    }
    return status;
  }

  /**
   * Create a new proposal status.
   * @param {object} payload - { name, description, step }
   * @param {string} actorId - Authenticated user ID
   */
  static async createProposalStatus(payload, actorId) {
    const { name, description, step } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Proposal status name is required.');
      err.status = 400;
      throw err;
    }

    if (step !== undefined && (isNaN(step) || parseInt(step, 10) < 0)) {
      const err = new Error('Step must be a non-negative integer.');
      err.status = 400;
      throw err;
    }

    const existing = await ProposalStatusModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`A proposal status with name "${name.trim()}" already exists.`);
      err.status = 409;
      throw err;
    }

    const stepVal = step !== undefined ? parseInt(step, 10) : 0;
    const existingStep = await ProposalStatusModel.findByStep(stepVal);
    if (existingStep) {
      const err = new Error(`A proposal status with step number "${stepVal}" already exists (status name: "${existingStep.name}").`);
      err.status = 409;
      throw err;
    }

    return ProposalStatusModel.create({
      name: name.trim(),
      description: description?.trim() || null,
      step: stepVal,
      createdBy: actorId,
    });
  }

  /**
   * Update an existing proposal status.
   * @param {string} id
   * @param {object} payload - { name?, description?, step? }
   * @param {string} actorId - Authenticated user ID
   */
  static async updateProposalStatus(id, payload, actorId) {
    await this.getProposalStatusById(id);

    const { name, description, step } = payload;

    if (name && name.trim()) {
      const existing = await ProposalStatusModel.findByName(name.trim());
      if (existing && existing.id !== id) {
        const err = new Error(`A proposal status with name "${name.trim()}" already exists.`);
        err.status = 409;
        throw err;
      }
    }

    if (step !== undefined && (isNaN(step) || parseInt(step, 10) < 0)) {
      const err = new Error('Step must be a non-negative integer.');
      err.status = 400;
      throw err;
    }

    const updated = await ProposalStatusModel.update(id, {
      name: name ? name.trim() : undefined,
      description: description !== undefined ? description?.trim() || null : undefined,
      step: step !== undefined ? parseInt(step, 10) : undefined,
      updatedBy: actorId,
    });

    if (!updated) {
      const err = new Error('No changes were applied.');
      err.status = 400;
      throw err;
    }

    return this.getProposalStatusById(id);
  }

  /**
   * Toggle the active status of a proposal status.
   * @param {string} id
   * @param {string} actorId
   */
  static async toggleProposalStatus(id, actorId) {
    const statusRecord = await this.getProposalStatusById(id);

    const result = await ProposalStatusModel.toggleStatus(id, actorId);
    if (!result) {
      const err = new Error('Failed to toggle status.');
      err.status = 500;
      throw err;
    }

    return {
      message: `Proposal status "${statusRecord.name}" has been ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active: result.is_active,
    };
  }

  /**
   * Soft delete a proposal status.
   * @param {string} id
   * @param {string} actorId
   */
  static async deleteProposalStatus(id, actorId) {
    const statusRecord = await this.getProposalStatusById(id);

    await ProposalStatusModel.softDelete(id, actorId);

    return {
      message: `Proposal status "${statusRecord.name}" has been deleted successfully.`,
    };
  }
}

module.exports = ProposalStatusService;
