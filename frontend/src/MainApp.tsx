import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { MetricsProvider } from './contexts/MetricsContext';

// Components
import ErrorBoundary from './components/common/ErrorBoundary';
import ClientOnly from './components/common/ClientOnly';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import MainDashboard from './pages/MainDashboard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Settings from './pages/settings/Settings';
import ManagementLanding from './pages/management/ManagementLanding';

// Other pages
import DesignLanding from './pages/design/DesignLanding';
import ParametersPage from './pages/design/ParametersPage';
import ReportsLanding from './pages/reports/ReportsLanding';
import MaintenanceLanding from './pages/maintenance/MaintenanceLanding';
import PVSitesLanding from './pages/pv-sites/PVSitesLanding';
import ImportPageSimple from './pages/data/ImportPageSimple';
import DetailView from './pages/data/DetailView';
import EnhancedSurveyAnalysisDashboard from './pages/data/EnhancedSurveyAnalysisDashboard';
import MCDAPage from './pages/mcda/MCDAPage';
import PlaceholderPage from './components/common/PlaceholderPage';

// Initialize QueryClient for React Query
const queryClient = new QueryClient();

// Loading component
const LoadingSpinner: React.FC = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px' 
    }}
  >
    <CircularProgress />
  </Box>
);

const MainApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MetricsProvider>
            <Router>
              <ErrorBoundary>
                <ClientOnly>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Authentication Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      
                      {/* Main Application Routes - Protected */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<MainDashboard />} />
                        
                        {/* Data Routes */}
                        <Route path="data" element={<Outlet />}>
                          <Route path="import" element={<ImportPageSimple />} />
                          <Route path="surveys/:id" element={<DetailView />} />
                          <Route path="survey-analysis" element={<EnhancedSurveyAnalysisDashboard />} />
                          <Route path="detail-view" element={<DetailView />} />
                        </Route>
                        
                        {/* Design Routes */}
                        <Route path="design">
                          <Route index element={<DesignLanding />} />
                          <Route path="parameters" element={<ParametersPage />} />
                          <Route 
                            path="equipment" 
                            element={
                              <PlaceholderPage 
                                title="Equipment Selection" 
                                description="Select and configure PV system equipment."
                              />
                            } 
                          />
                        </Route>
                        
                        {/* PV Sites Routes */}
                        <Route path="pv-sites" element={<PVSitesLanding />} />
                        
                        {/* MCDA Analysis Routes */}
                        <Route path="mcda" element={<MCDAPage />} />
                        
                        {/* Maintenance Routes */}
                        <Route path="maintenance">
                          <Route index element={<MaintenanceLanding />} />
                          <Route 
                            path="analytics" 
                            element={
                              <PlaceholderPage 
                                title="Maintenance Analytics" 
                                description="Monitor and analyze system maintenance data."
                              />
                            } 
                          />
                        </Route>
                        
                        {/* Reports Routes */}
                        <Route path="reports" element={<ReportsLanding />} />
                        
                        {/* Settings Routes */}
                        <Route 
                          path="settings" 
                          element={
                            <ErrorBoundary>
                              <Settings />
                            </ErrorBoundary>
                          } 
                        />
                        
                        {/* Management Routes */}
                        <Route 
                          path="management/*" 
                          element={
                            <ErrorBoundary>
                              <ManagementLanding />
                            </ErrorBoundary>
                          } 
                        />
                      </Route>
                      
                      {/* Catch-all route - redirect to home */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </ClientOnly>
              </ErrorBoundary>
            </Router>
          </MetricsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default MainApp;
