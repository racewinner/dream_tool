import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import metricsService, { MaintenanceMetrics } from '../services/metricsService';
import { useAuth } from './AuthContext';

// Define types for our metrics data
export interface MetricsSummary {
  totalSites: number;
  activeSites: number;
  totalCapacity: number;
  averageEfficiency: number;
  maintenanceIssues: number;
  recentSurveys: number;
}

export interface SolarMetrics {
  dailyGeneration: { date: string; value: number }[];
  monthlyGeneration: { month: string; value: number }[];
  efficiencyTrend: { date: string; value: number }[];
}


// Define what our context will provide
interface MetricsContextType {
  refreshAllMetrics: () => void;
  refreshMetricsSummary: () => void;
  refreshSolarMetrics: () => void;
  refreshMaintenanceMetrics: () => void;
  metricsSummaryQuery: {
    data?: MetricsSummary;
    isLoading: boolean;
    error: unknown;
  };
  solarMetricsQuery: {
    data?: SolarMetrics;
    isLoading: boolean;
    error: unknown;
  };
  maintenanceMetricsQuery: {
    data?: MaintenanceMetrics;
    isLoading: boolean;
    error: unknown;
  };
  dashboardMetricsQuery: {
    data?: any; // Using any for now, should be replaced with proper DashboardMetrics type
    isLoading: boolean;
    error: unknown;
  };
}

// Create the context
const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// Provider component
export const MetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get query client from React Query context
  const queryClient = useQueryClient();
  
  // Get auth token from auth context
  const { token } = useAuth() || { token: null };

  // Define query keys for better cache management
  const METRICS_KEYS = {
    summary: ['metrics', 'summary'],
    solar: ['metrics', 'solar'],
    maintenance: ['metrics', 'maintenance'],
    dashboard: ['metrics', 'dashboard'],
    all: ['metrics']
  };

  // Set up queries with React Query
  const metricsSummaryQuery = useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: () => metricsService.getMetricsSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!token,
    retry: 1,
    retryDelay: 1000,
  });

  const solarMetricsQuery = useQuery({
    queryKey: ['metrics', 'solar'],
    queryFn: () => metricsService.getSolarMetrics(),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    retry: 1,
    retryDelay: 1000,
  });

  const maintenanceMetricsQuery = useQuery({
    queryKey: ['metrics', 'maintenance'],
    queryFn: () => metricsService.getMaintenanceMetrics(),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    retry: 1,
    retryDelay: 1000,
  });

  const dashboardMetricsQuery = useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => metricsService.getDashboardMetrics(),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
    retry: 1,
    retryDelay: 1000,
  });

  // Define refresh functions
  const refreshMetricsSummary = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: METRICS_KEYS.summary });
  }, [queryClient]);

  const refreshSolarMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: METRICS_KEYS.solar });
  }, [queryClient]);

  const refreshMaintenanceMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: METRICS_KEYS.maintenance });
  }, [queryClient]);

  const refreshAllMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: METRICS_KEYS.all });
  }, [queryClient]);

  return (
    <MetricsContext.Provider
      value={{
        refreshAllMetrics,
        refreshMetricsSummary,
        refreshSolarMetrics,
        refreshMaintenanceMetrics,
        metricsSummaryQuery,
        solarMetricsQuery,
        maintenanceMetricsQuery,
        dashboardMetricsQuery,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

// Custom hook for using this context
export const useMetrics = (): MetricsContextType | undefined => {
  const context = useContext(MetricsContext);
  return context;
};

export default MetricsContext;
