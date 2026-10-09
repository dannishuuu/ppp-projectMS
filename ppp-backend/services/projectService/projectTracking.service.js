// services/projectService/projectTracking.service.js
const ProjectTrackingTypeModel = require('../../models/projectTrackingType.model');
const ProjectTrackingAreaModel = require('../../models/projectTrackingArea.model');
const ProjectTrackingChecklistModel = require('../../models/projectTrackingChecklist.model');
const ChecklistPerformanceLogModel = require('../../models/checklistPerformanceLog.model');
const db = require('../../config/database');
const { QueryTypes } = require('sequelize');

class ProjectTrackingService {
  /**
   * Fetch complete 3-level WBS Tree for a project with computed weighted progress.
   */
  static async getProjectWbsTree(projectId) {
    // 1. Fetch Level 1 (Tracking Types)
    const types = await ProjectTrackingTypeModel.findByProjectId(projectId);

    let overallProgress = 0;

    const populatedTypes = await Promise.all(
      types.map(async (t) => {
        // 2. Fetch Level 2 (Tracking Areas)
        const areas = await ProjectTrackingAreaModel.findByTrackingTypeId(t.id);

        let typeProgress = 0;

        const populatedAreas = await Promise.all(
          areas.map(async (a) => {
            // 3. Fetch Level 3 (Checklists)
            const checklists = await ProjectTrackingChecklistModel.findByTrackingAreaId(a.id);

            let areaProgress = 0;

            const populatedChecklists = checklists.map((c) => {
              // Percentage calculation: if there's a performance log snapshot, use it; else if is_completed, 100%; else 0%
              let currentVal = 0;
              if (c.latest_performance_log && c.latest_performance_log.performance_value !== null) {
                currentVal = parseFloat(c.latest_performance_log.performance_value) || 0;
              } else if (c.is_completed) {
                currentVal = 100;
              }

              const checklistContribution = (parseFloat(c.weight) || 0) * (currentVal / 100);
              areaProgress += checklistContribution;

              return {
                ...c,
                current_progress_value: currentVal,
              };
            });

            const areaContribution = (parseFloat(a.weight) || 0) * (areaProgress / 100);
            typeProgress += areaContribution;

            return {
              ...a,
              progress_percentage: Math.min(100, Math.round(areaProgress * 100) / 100),
              checklists: populatedChecklists,
            };
          })
        );

        const typeContribution = (parseFloat(t.weight) || 0) * (typeProgress / 100);
        overallProgress += typeContribution;

        return {
          ...t,
          progress_percentage: Math.min(100, Math.round(typeProgress * 100) / 100),
          areas: populatedAreas,
        };
      })
    );

    return {
      projectId,
      overall_progress_percentage: Math.min(100, Math.round(overallProgress * 100) / 100),
      tracking_types: populatedTypes,
    };
  }

  /**
   * Initialize a project's WBS structure using customized tree or auto-populating from master definitions.
   */
  static async initializeProjectWbs(projectId, payload, actorId) {
    const { types = [] } = payload;

    return await db.transaction(async (t) => {
      for (const typeItem of types) {
        const { trackingItemTypeId, weight = 100, areas = [] } = typeItem;

        // Level 1: Upsert Type
        const trackingTypeRow = await ProjectTrackingTypeModel.upsert(
          { projectId, trackingItemTypeId, weight, actorId },
          { transaction: t }
        );

        // Level 2: Upsert Areas
        for (const areaItem of areas) {
          const { trackingAreaId, weight: areaWeight = 100, checklists = [] } = areaItem;

          const trackingAreaRow = await ProjectTrackingAreaModel.upsert(
            {
              projectTrackingTypeId: trackingTypeRow.id,
              trackingAreaId,
              weight: areaWeight,
              actorId,
            },
            { transaction: t }
          );

          // Level 3: Upsert Checklists
          for (const chkItem of checklists) {
            const { checklistId, weight: chkWeight = 100, notes = null } = chkItem;

            await ProjectTrackingChecklistModel.upsert(
              {
                projectTrackingAreaId: trackingAreaRow.id,
                checklistId,
                weight: chkWeight,
                notes,
                actorId,
              },
              { transaction: t }
            );
          }
        }
      }

      return await this.getProjectWbsTree(projectId);
    });
  }

  /**
   * Update weights for Level 1 Tracking Types under a Project.
   * Enforces sibling sum = 100.00%.
   */
  static async updateTypeWeights(projectId, items = [], actorId) {
    const sum = items.reduce((acc, curr) => acc + parseFloat(curr.weight || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      const err = new Error(`Tracking Type weights must sum to 100.00%, got ${sum.toFixed(2)}%`);
      err.status = 400;
      throw err;
    }

    return await db.transaction(async (t) => {
      for (const item of items) {
        await ProjectTrackingTypeModel.updateWeight(item.id, item.weight, actorId, { transaction: t });
      }
      return await ProjectTrackingTypeModel.findByProjectId(projectId);
    });
  }

  /**
   * Update weights for Level 2 Tracking Areas under a Tracking Type.
   * Enforces sibling sum = 100.00%.
   */
  static async updateAreaWeights(projectTrackingTypeId, items = [], actorId) {
    const sum = items.reduce((acc, curr) => acc + parseFloat(curr.weight || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      const err = new Error(`Tracking Area weights must sum to 100.00%, got ${sum.toFixed(2)}%`);
      err.status = 400;
      throw err;
    }

    return await db.transaction(async (t) => {
      for (const item of items) {
        await ProjectTrackingAreaModel.updateWeight(item.id, item.weight, actorId, { transaction: t });
      }
      return await ProjectTrackingAreaModel.findByTrackingTypeId(projectTrackingTypeId);
    });
  }

  /**
   * Update weights for Level 3 Checklists under a Tracking Area.
   * Enforces sibling sum = 100.00%.
   */
  static async updateChecklistWeights(projectTrackingAreaId, items = [], actorId) {
    const sum = items.reduce((acc, curr) => acc + parseFloat(curr.weight || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      const err = new Error(`Checklist weights must sum to 100.00%, got ${sum.toFixed(2)}%`);
      err.status = 400;
      throw err;
    }

    return await db.transaction(async (t) => {
      for (const item of items) {
        await ProjectTrackingChecklistModel.updateWeight(item.id, item.weight, actorId, { transaction: t });
      }
      return await ProjectTrackingChecklistModel.findByTrackingAreaId(projectTrackingAreaId);
    });
  }

  /**
   * Mark a checklist item as completed or incomplete.
   */
  static async toggleChecklistCompletion(id, isCompleted, notes = null, actorId) {
    const existing = await ProjectTrackingChecklistModel.findById(id);
    if (!existing) {
      const err = new Error('Checklist item not found.');
      err.status = 404;
      throw err;
    }

    return await ProjectTrackingChecklistModel.toggleCompletion(id, Boolean(isCompleted), notes, actorId);
  }

  /**
   * Add a monthly/periodic performance log snapshot.
   */
  static async addPerformanceLog(projectTrackingChecklistId, payload, actorId) {
    const existing = await ProjectTrackingChecklistModel.findById(projectTrackingChecklistId);
    if (!existing) {
      const err = new Error('Checklist item not found.');
      err.status = 404;
      throw err;
    }

    const { periodDate, performanceValue, remarks } = payload;
    if (!periodDate) {
      const err = new Error('Period date is required.');
      err.status = 400;
      throw err;
    }

    const numericVal = parseFloat(performanceValue);
    if (isNaN(numericVal) || numericVal < 0 || numericVal > 100) {
      const err = new Error('Performance value must be a percentage between 0 and 100.');
      err.status = 400;
      throw err;
    }

    return await ChecklistPerformanceLogModel.create({
      projectTrackingChecklistId,
      periodDate,
      performanceValue: numericVal,
      remarks,
      actorId,
    });
  }

  /**
   * Get log history for a checklist item.
   */
  static async getChecklistLogs(projectTrackingChecklistId) {
    return await ChecklistPerformanceLogModel.findByChecklistId(projectTrackingChecklistId);
  }
}

module.exports = ProjectTrackingService;
