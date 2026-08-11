import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { MainLayout } from './components/Layout/MainLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { ProjectList } from './pages/Projects/ProjectList';
import { ProjectDetails } from './pages/Projects/ProjectDetails';
import { ProjectForm } from './pages/Projects/ProjectForm';
import { ProjectCategoryPage } from './pages/Projects/ProjectCategoryPage';
import { Login } from './pages/Login/Login';
import { CreateUser } from './pages/Users/CreateUser';
import { UsersList } from './pages/Users/UsersList';
import { UserDetails } from './pages/Users/UserDetails';
import { EditUser } from './pages/Users/EditUser';
import { OrganizationTypePage } from './pages/Organizations/OrganizationTypePage';
import { OrganizationList } from './pages/Organizations/OrganizationList';
import { OrganizationForm } from './pages/Organizations/OrganizationForm';
import { OrganizationDetails } from './pages/Organizations/OrganizationDetails';
import { CurrenciesPage } from './pages/Foundation/CurrenciesPage';
import { ProposalStatusPage } from './pages/Foundation/ProposalStatusPage';
import { ProjectProposalList } from './pages/Projects/ProjectProposalList';
import { ProjectProposalForm } from './pages/Projects/ProjectProposalForm';
import { ProjectProposalEdit } from './pages/Projects/ProjectProposalEdit';
import { ProjectProposalDetails } from './pages/Projects/ProjectProposalDetails';
import { ProjectReviewPage } from './pages/Projects/ProjectReviewPage';
import { ProjectReviewApprovalPage } from './pages/Projects/ProjectReviewApprovalPage';
import { ProjectTrackingTypePage } from './pages/Projects/ProjectTrackingTypePage';
import { DocumentSequencePage } from './pages/DocumentManagement/DocumentSequencePage';



// Redirects unauthenticated users to /login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialCheckDone, checkAuth } = useAuth();

  // While initial auth check is in progress, show loading spinner
  if (!isInitialCheckDone) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#1a237e' }} />
      </Box>
    );
  }

  // Additional check: verify user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3500}
      >
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <Routes>
                {/* Public route — login page */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes — require authentication */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />

                  {/* Project pages */}
                  <Route path="projects" element={<ProjectList />} />
                  <Route path="projects/new" element={<ProjectForm />} />
                  <Route path="projects/:id" element={<ProjectDetails />} />
                  <Route path="projects/:id/edit" element={<ProjectForm />} />
                  <Route path="project-categories" element={<ProjectCategoryPage />} />

                  {/* Project proposal pages */}
                  <Route path="projects/proposals" element={<ProjectProposalList />} />
                  <Route path="projects/proposals/new" element={<ProjectProposalForm />} />
                  <Route path="projects/proposals/:id" element={<ProjectProposalDetails />} />
                  <Route path="projects/proposals/:id/edit" element={<ProjectProposalEdit />} />
                  <Route path="projects/reviews" element={<ProjectReviewPage />} />
                  <Route path="projects/reviews/:id" element={<ProjectReviewApprovalPage />} />
                  <Route path="projects/tracking-types" element={<ProjectTrackingTypePage />} />

                  {/* Document management pages */}
                  <Route path="document-sequences" element={<DocumentSequencePage />} />

                  {/* User managment pages */}
                  <Route path="users/new" element={<CreateUser />} />
                  <Route path="users/list" element={<UsersList />} />
                  <Route path="users/:id" element={<UserDetails />} />
                  <Route path="users/:id/edit" element={<EditUser />} />

                  {/* Organization pages */}
                  <Route path="organizations" element={<OrganizationList />} />
                  <Route path="organizations/new" element={<OrganizationForm />} />
                  <Route path="organizations/:id" element={<OrganizationDetails />} />
                  <Route path="organizations/:id/edit" element={<OrganizationForm />} />
                  <Route path="organization-types" element={<OrganizationTypePage />} />
                  <Route path="currencies" element={<CurrenciesPage />} />
                  <Route path="proposal-statuses" element={<ProposalStatusPage />} />

                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
