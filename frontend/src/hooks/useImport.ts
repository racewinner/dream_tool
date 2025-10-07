/**
 * React Query hooks for import functionality
 * Provides hooks for import operations, job status, and history
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importService } from '../services/importService';
import { 
  ImportConfig, 
  ImportSourceType, 
  ImportSchedule, 
  ImportStatus, 
  DuplicateStrategy, 
  ValidationLevel, 
  PostImportAction,
  ImportJob,
  RecordStatus 
} from '../types/importJob';

// Query keys for cache management
export const importKeys = {
  all: ['imports'] as const,
  lists: () => [...importKeys.all, 'list'] as const,
  list: (filters: object) => [...importKeys.lists(), filters] as const,
  details: () => [...importKeys.all, 'detail'] as const,
  detail: (id: string) => [...importKeys.details(), id] as const,
};

/**
 * Hook for previewing an import
 */
export const useImportPreview = () => {
  return useMutation({
    mutationFn: (config: ImportConfig) => importService.previewImport(config),
    onError: (error: Error) => {
      console.error('Error previewing import:', error);
    }
  });
};

/**
 * Hook for starting an import
 */
export const useStartImport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: ImportConfig) => importService.startImport(config),
    onSuccess: (job: ImportJob) => {
      // Invalidate import lists and add job to cache
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
      queryClient.setQueryData(importKeys.detail(job.id), job);
    },
    onError: (error: Error) => {
      console.error('Import failed to start:', error);
    }
  });
};

/**
 * Hook for getting an import job status
 */
export const useImportStatus = (jobId: string | null, enabled = true) => {
  return useQuery({
    queryKey: importKeys.detail(jobId || 'none'),
    queryFn: () => {
      if (!jobId) {
        return Promise.resolve({} as ImportJob);
      }
      return importService.getImportStatus(jobId);
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      // Poll faster when in progress, slower for completed/failed jobs
      const data = query.state.data as ImportJob | undefined;
      if (!data) return 5000;
      return [ImportStatus.COMPLETED, ImportStatus.FAILED, ImportStatus.CANCELLED].includes(data.status)
        ? false // Stop polling for completed jobs
        : 3000; // Poll every 3 seconds for active jobs
    }
  });
};

/**
 * Hook for getting detailed import job information
 * Used when more comprehensive data is needed beyond status
 */
export const useImportDetails = (jobId: string | null) => {
  return useQuery({
    queryKey: ['importJob', jobId],
    queryFn: () => {
      if (!jobId) {
        return Promise.resolve({} as ImportJob);
      }
      // Use getImportStatus as fallback if getImportDetails doesn't exist
      return importService.getImportStatus(jobId);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Only refetch if job is still running
      const data = query.state.data as ImportJob | undefined;
      if (!data) return false;
      return data.status === ImportStatus.RUNNING || data.status === ImportStatus.PENDING ? 3000 : 5000;
    }
  });
};

/**
 * Hook for cancelling an import
 */
export const useCancelImport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => importService.cancelImport(jobId),
    onSuccess: (job: ImportJob) => {
      // Update job in cache
      queryClient.setQueryData(importKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Error cancelling import:', error);
    }
  });
};

/**
 * Hook for rerunning an import
 */
export const useRerunImport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => importService.rerunImport(jobId),
    onSuccess: (job: ImportJob) => {
      // Update job in cache
      queryClient.setQueryData(importKeys.detail(job.id), job);
      queryClient.invalidateQueries({ queryKey: importKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Error rerunning import:', error);
    }
  });
};

/**
 * Hook for fetching import logs
 */
export const useImportLogs = (jobId: string | null) => {
  return useQuery({
    queryKey: ['importLogs', jobId],
    queryFn: () => {
      if (!jobId) {
        return Promise.resolve([]);
      }
      return importService.getImportLogs(jobId);
    },
    enabled: !!jobId
  });
};

/**
 * Hook for fetching import history
 */
export const useImportHistory = (
  page: number = 0,
  rowsPerPage: number = 10,
  filters: {
    source?: ImportSourceType;
    status?: ImportStatus;
    startDate?: string | Date;
    endDate?: string | Date;
  } = {}
) => {
  // Convert Date objects to ISO strings if present
  const processedFilters = {
    source: filters.source,
    status: filters.status,
    startDate: filters.startDate instanceof Date ? filters.startDate : filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate instanceof Date ? filters.endDate : filters.endDate ? new Date(filters.endDate) : undefined,
  };

  return useQuery({
    queryKey: [...importKeys.lists(), { page, rowsPerPage, ...processedFilters }],
    queryFn: () => importService.getImportHistory(page, rowsPerPage, processedFilters),
    placeholderData: (previousData) => previousData
  });
};


