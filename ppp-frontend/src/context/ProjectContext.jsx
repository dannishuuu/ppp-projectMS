import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { mockApi } from '../services/mockApi';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [budgetRange, setBudgetRange] = useState([0, 150000000000]); // ETB 0 - 150B

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockApi.getProjects();
      setProjects(data);
    } catch (err) {
      enqueueSnackbar('Failed to load project dataset', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (projectData) => {
    setLoading(true);
    try {
      const newProj = await mockApi.createProject(projectData);
      setProjects((prev) => [newProj, ...prev]);
      enqueueSnackbar(`Project "${newProj.name}" created successfully!`, { variant: 'success' });
      return newProj;
    } catch (err) {
      enqueueSnackbar('Failed to create project', { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id, updatedData) => {
    setLoading(true);
    try {
      const updated = await mockApi.updateProject(id, updatedData);
      setProjects((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
      if (selectedProject && String(selectedProject.id) === String(id)) {
        setSelectedProject(updated);
      }
      enqueueSnackbar(`Project "${updated.name}" updated successfully!`, { variant: 'success' });
      return updated;
    } catch (err) {
      enqueueSnackbar('Failed to update project', { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    setLoading(true);
    try {
      const projectToDelete = projects.find((p) => String(p.id) === String(id));
      await mockApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => String(p.id) !== String(id)));
      enqueueSnackbar(`Project "${projectToDelete?.name || id}" deleted successfully`, { variant: 'info' });
    } catch (err) {
      enqueueSnackbar('Failed to delete project', { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetAllData = async () => {
    setLoading(true);
    try {
      const data = await mockApi.resetData();
      setProjects(data);
      enqueueSnackbar('Project dataset reset to default mock state', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar('Failed to reset project dataset', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered dataset computation
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subCity?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const matchesBudget = (p.preliminaryBudget || 0) >= budgetRange[0] && (p.preliminaryBudget || 0) <= budgetRange[1];

    return matchesSearch && matchesStatus && matchesType && matchesBudget;
  });

  return (
    <ProjectContext.Provider
      value={{
        projects,
        filteredProjects,
        loading,
        selectedProject,
        setSelectedProject,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        budgetRange,
        setBudgetRange,
        addProject,
        updateProject,
        deleteProject,
        resetAllData,
        fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
