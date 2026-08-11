import { mockProjects as initialProjects } from '../data/mockProjects';

// In-memory data store so modifications persist during current session
let projectsStore = [...initialProjects];

const SIMULATED_DELAY = 300; // ms

/**
 * Mock API service simulating asynchronous network requests with Promises
 */
export const mockApi = {
  /**
   * Fetch all projects
   */
  getProjects: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...projectsStore]);
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Fetch project by ID
   */
  getProjectById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projectsStore.find((p) => String(p.id) === String(id));
        if (project) {
          resolve({ ...project });
        } else {
          reject(new Error(`Project with ID ${id} not found.`));
        }
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Create a new project
   */
  createProject: async (projectData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = String(Date.now());
        const codePrefix = projectData.type === 'Housing' ? 'PPP-H-' : 'PPP-NH-';
        const nextNumber = String(projectsStore.length + 1).padStart(3, '0');
        
        const newProject = {
          ...projectData,
          id: newId,
          code: projectData.code || `${codePrefix}${nextNumber}`,
          completionPercentage: Number(projectData.completionPercentage || 0),
          preliminaryBudget: Number(projectData.preliminaryBudget || 0),
          housingUnits: projectData.type === 'Housing' ? Number(projectData.housingUnits || 0) : null,
          commercialSpaces: projectData.type === 'Non-Housing' ? Number(projectData.commercialSpaces || 0) : null,
          parkingCapacity: projectData.type === 'Non-Housing' ? Number(projectData.parkingCapacity || 0) : null,
          financials: [
            {
              id: `f_${Date.now()}`,
              date: projectData.contractSigningDate || new Date().toISOString().split('T')[0],
              type: 'Initial Budget',
              amount: Number(projectData.preliminaryBudget || 0),
              description: 'Initial project allocation'
            }
          ],
          milestones: [
            {
              id: `m_${Date.now()}`,
              name: 'Project Inception & Signoff',
              targetDate: projectData.contractSigningDate || new Date().toISOString().split('T')[0],
              actualDate: new Date().toISOString().split('T')[0],
              status: 'Completed'
            }
          ],
          documents: [
            {
              id: `d_${Date.now()}`,
              name: `Project_Charter_${projectData.code || newId}.pdf`,
              type: 'Charter',
              size: '3.2 MB',
              uploadDate: new Date().toISOString().split('T')[0]
            }
          ]
        };

        projectsStore = [newProject, ...projectsStore];
        resolve(newProject);
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Update existing project
   */
  updateProject: async (id, updatedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = projectsStore.findIndex((p) => String(p.id) === String(id));
        if (index !== -1) {
          const existing = projectsStore[index];
          const updated = {
            ...existing,
            ...updatedData,
            completionPercentage: Number(updatedData.completionPercentage ?? existing.completionPercentage),
            preliminaryBudget: Number(updatedData.preliminaryBudget ?? existing.preliminaryBudget),
            housingUnits: updatedData.type === 'Housing' ? Number(updatedData.housingUnits || 0) : null,
            commercialSpaces: updatedData.type === 'Non-Housing' ? Number(updatedData.commercialSpaces || 0) : null,
            parkingCapacity: updatedData.type === 'Non-Housing' ? Number(updatedData.parkingCapacity || 0) : null,
          };
          projectsStore[index] = updated;
          resolve(updated);
        } else {
          reject(new Error(`Project with ID ${id} not found.`));
        }
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Delete project
   */
  deleteProject: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = projectsStore.some((p) => String(p.id) === String(id));
        if (exists) {
          projectsStore = projectsStore.filter((p) => String(p.id) !== String(id));
          resolve({ success: true, id });
        } else {
          reject(new Error(`Project with ID ${id} not found.`));
        }
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Reset data back to initial mock array
   */
  resetData: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        projectsStore = [...initialProjects];
        resolve([...projectsStore]);
      }, SIMULATED_DELAY);
    });
  }
};
