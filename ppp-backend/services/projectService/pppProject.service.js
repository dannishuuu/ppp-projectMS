// services/projectService/pppProject.service.js
const PppProjectModel = require('../../models/pppProject.model');
const ProjectCategoryMapModel = require('../../models/projectCategoryMap.model');
const ProjectOrganizationModel = require('../../models/projectOrganization.model');
const ProjectManagerModel = require('../../models/projectManager.model');
const ProjectProposalModel = require('../../models/projectProposal.model');
const DocumentSequenceService = require('./documentSequence.service');
const db = require('../../config/database');
const { QueryTypes } = require('sequelize');

class PppProjectService {
  /**
   * Get a paginated, filtered list of PPP projects.
   */
  static async getProjects(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId = null,
      categoryId = null,
      organizationId = null,
      isActive = null,
    } = options;

    const offset = (page - 1) * limit;

    const { rows, total } = await PppProjectModel.findAll({
      limit,
      offset,
      search,
      statusId,
      categoryId,
      organizationId,
      isActive,
    });

    return {
      projects: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get a single project by ID.
   */
  static async getProjectById(id) {
    const project = await PppProjectModel.findById(id);
    if (!project) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }
    return project;
  }

  /**
   * Create a new project.
   */
  static async createProject(payload, actorId) {
    const {
      name,
      description,
      address,
      siteAreaValue,
      siteAreaUnit = 'Sqm',
      contractSigningDate,
      estimatedBudgetAmount,
      estimatedBudgetCurrencyId,
      statusId,
      isActive = true,
      proposalId = null,
      categoryIds = [],
      organizations = [],
      managerUserIds = [],
    } = payload;

    if (!name || !name.trim()) {
      const err = new Error('Project name is required.');
      err.status = 400;
      throw err;
    }

    // Generate unique project number via sequence
    let projectNo = null;
    try {
      projectNo = await DocumentSequenceService.generateNextNumber('project', actorId);
    } catch (e) {
      try {
        projectNo = await DocumentSequenceService.generateNextNumber('ppp_project', actorId);
      } catch (err) {
        projectNo = `PROJ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      }
    }

    return await db.transaction(async (t) => {
      // 1. Create main project row
      const newProject = await PppProjectModel.create(
        {
          projectNo,
          proposalId,
          name: name.trim(),
          description,
          address,
          siteAreaValue,
          siteAreaUnit,
          contractSigningDate,
          estimatedBudgetAmount,
          estimatedBudgetCurrencyId,
          statusId,
          isActive,
          createdBy: actorId,
        },
        { transaction: t }
      );

      // 2. Attach categories
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await ProjectCategoryMapModel.syncCategories(newProject.id, categoryIds, actorId, { transaction: t });
      }

      // 3. Attach organizations & roles
      if (Array.isArray(organizations) && organizations.length > 0) {
        await ProjectOrganizationModel.syncOrganizations(newProject.id, organizations, actorId, { transaction: t });
      }

      // 4. Assign project managers
      if (Array.isArray(managerUserIds) && managerUserIds.length > 0) {
        await ProjectManagerModel.syncManagers(newProject.id, managerUserIds, actorId, { transaction: t });
      }

      // 5. If converted from a proposal, update the proposal record
      if (proposalId) {
        await db.query(
          `UPDATE project_proposals
           SET converted_project_id = :projectId, updated_at = NOW(), updated_by = :actorId
           WHERE id = :proposalId`,
          {
            replacements: { projectId: newProject.id, proposalId, actorId },
            type: QueryTypes.BULKUPDATE,
            transaction: t,
          }
        );
      }

      return await PppProjectModel.findById(newProject.id);
    });
  }

  /**
   * Update an existing project.
   */
  static async updateProject(id, payload, actorId) {
    const existing = await PppProjectModel.findById(id);
    if (!existing) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }

    const {
      name,
      description,
      address,
      siteAreaValue,
      siteAreaUnit,
      contractSigningDate,
      estimatedBudgetAmount,
      estimatedBudgetCurrencyId,
      statusId,
      isActive,
      categoryIds,
      organizations,
      managerUserIds,
    } = payload;

    return await db.transaction(async (t) => {
      // 1. Update project table
      await PppProjectModel.update(
        id,
        {
          name,
          description,
          address,
          siteAreaValue,
          siteAreaUnit,
          contractSigningDate,
          estimatedBudgetAmount,
          estimatedBudgetCurrencyId,
          statusId,
          isActive,
          updatedBy: actorId,
        },
        { transaction: t }
      );

      // 2. Sync categories if explicitly passed
      if (categoryIds !== undefined && Array.isArray(categoryIds)) {
        await ProjectCategoryMapModel.syncCategories(id, categoryIds, actorId, { transaction: t });
      }

      // 3. Sync organizations if explicitly passed
      if (organizations !== undefined && Array.isArray(organizations)) {
        await ProjectOrganizationModel.syncOrganizations(id, organizations, actorId, { transaction: t });
      }

      // 4. Sync managers if explicitly passed
      if (managerUserIds !== undefined && Array.isArray(managerUserIds)) {
        await ProjectManagerModel.syncManagers(id, managerUserIds, actorId, { transaction: t });
      }

      return await PppProjectModel.findById(id);
    });
  }

  /**
   * Update status of project.
   */
  static async changeStatus(id, statusId, actorId) {
    const existing = await PppProjectModel.findById(id);
    if (!existing) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }

    await PppProjectModel.updateStatus(id, statusId, actorId);
    return await PppProjectModel.findById(id);
  }

  /**
   * Soft-delete a project.
   */
  static async deleteProject(id, actorId) {
    const existing = await PppProjectModel.findById(id);
    if (!existing) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }

    await PppProjectModel.delete(id, actorId);
    return { success: true, message: 'Project deleted successfully.' };
  }

  /**
   * Convert an approved project proposal into an official PPP project.
   */
  static async convertProposalToProject(proposalId, payload = {}, actorId) {
    const proposal = await ProjectProposalModel.findById(proposalId);
    if (!proposal) {
      const err = new Error('Project proposal not found.');
      err.status = 404;
      throw err;
    }

    if (proposal.converted_project_id) {
      const err = new Error('This proposal has already been converted to an official project.');
      err.status = 400;
      throw err;
    }

    // Default status: find 'Signed' or 'Pipeline' status from project_statuses
    let defaultStatusId = payload.statusId;
    if (!defaultStatusId) {
      const [signedStatus] = await db.query(
        `SELECT id FROM project_statuses WHERE name ILIKE 'Signed' AND is_deleted = FALSE LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      defaultStatusId = signedStatus?.id || null;
    }

    // Extract proposal categories
    const categoryIds =
      payload.categoryIds ||
      (Array.isArray(proposal.categories) ? proposal.categories.map((c) => c.category_id) : []);

    // Developer organization mapping
    const organizations = payload.organizations || [];
    if (organizations.length === 0 && proposal.organization_id) {
      // Find developer org type
      const [devType] = await db.query(
        `SELECT id FROM organization_types WHERE org_type_code = 'DEV' OR name ILIKE 'Developer' LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      if (devType) {
        organizations.push({
          organizationId: proposal.organization_id,
          organizationTypeId: devType.id,
        });
      }
    }

    const projectPayload = {
      proposalId: proposal.id,
      name: payload.name || proposal.proposed_project_name,
      description: payload.description || proposal.description,
      address: payload.address || null,
      siteAreaValue: payload.siteAreaValue || (parseFloat(proposal.land_requested) || null),
      siteAreaUnit: payload.siteAreaUnit || 'Sqm',
      contractSigningDate: payload.contractSigningDate || new Date().toISOString().split('T')[0],
      estimatedBudgetAmount: payload.estimatedBudgetAmount || proposal.proposed_capital_amount,
      estimatedBudgetCurrencyId: payload.estimatedBudgetCurrencyId || proposal.currency_id,
      statusId: defaultStatusId,
      categoryIds,
      organizations,
      managerUserIds: payload.managerUserIds || [],
    };

    return await this.createProject(projectPayload, actorId);
  }
}

module.exports = PppProjectService;
