// services/projectServices/projectTrackingService.js
import { apiClient } from '../../utils/apiClient';

const BASE = '/project-tracking';

export const projectTrackingService = {
  /**
   * Get the full 3-level WBS tree with computed progress.
   * @param {string} projectId
   */
  async getWbsTree(projectId) {
    const response = await apiClient.get(`${BASE}/projects/${projectId}/tree`);
    return response.data;
  },

  /**
   * Initialize a project's WBS structure.
   * @param {string} projectId
   * @param {object} payload  - { types: [{ trackingItemTypeId, weight, areas: [{ trackingAreaId, weight, checklists: [{ checklistId, weight }] }] }] }
   */
  async initializeWbs(projectId, payload) {
    const response = await apiClient.post(`${BASE}/projects/${projectId}/initialize`, payload);
    return response.data;
  },

  /**
   * Update Level-1 tracking type weights (must sum to 100%).
   * @param {string} projectId
   * @param {Array<{ id: string, weight: number }>} items
   */
  async updateTypeWeights(projectId, items) {
    const response = await apiClient.put(`${BASE}/projects/${projectId}/type-weights`, { items });
    return response.data;
  },

  /**
   * Update Level-2 tracking area weights (must sum to 100%).
   * @param {string} projectTrackingTypeId
   * @param {Array<{ id: string, weight: number }>} items
   */
  async updateAreaWeights(projectTrackingTypeId, items) {
    const response = await apiClient.put(`${BASE}/types/${projectTrackingTypeId}/area-weights`, { items });
    return response.data;
  },

  /**
   * Update Level-3 checklist item weights (must sum to 100%).
   * @param {string} projectTrackingAreaId
   * @param {Array<{ id: string, weight: number }>} items
   */
  async updateChecklistWeights(projectTrackingAreaId, items) {
    const response = await apiClient.put(`${BASE}/areas/${projectTrackingAreaId}/checklist-weights`, { items });
    return response.data;
  },

  /**
   * Toggle a checklist item's completion state.
   * @param {string} checklistId
   * @param {boolean} isCompleted
   * @param {string|null} notes
   */
  async toggleChecklistCompletion(checklistId, isCompleted, notes = null) {
    const response = await apiClient.patch(`${BASE}/checklists/${checklistId}/toggle-complete`, {
      isCompleted,
      notes,
    });
    return response.data;
  },

  /**
   * Add a periodic performance log snapshot.
   * @param {string} checklistId
   * @param {{ periodDate: string, performanceValue: number, remarks?: string }} payload
   */
  async addPerformanceLog(checklistId, payload) {
    const response = await apiClient.post(`${BASE}/checklists/${checklistId}/logs`, payload);
    return response.data;
  },

  /**
   * Get performance log history for a checklist item.
   * @param {string} checklistId
   */
  async getChecklistLogs(checklistId) {
    const response = await apiClient.get(`${BASE}/checklists/${checklistId}/logs`);
    return response.data;
  },
};
