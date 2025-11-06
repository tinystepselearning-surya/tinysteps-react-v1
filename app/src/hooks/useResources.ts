/**
 * Custom hook for managing resources
 */

import { useState, useEffect, useCallback } from 'react';
import type { Resource, ResourceFilters, ResourceType } from '../types/content';
import * as resourceService from '../services/resourceService';

export function useResources(initialFilters?: ResourceFilters) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ResourceFilters | undefined>(initialFilters);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resourceService.getResources(filters);
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const uploadResource = useCallback(async (
    file: File,
    metadata: any,
    uploadedBy: string
  ) => {
    try {
      const newResource = await resourceService.uploadResource(file, metadata, uploadedBy);
      setResources(prev => [newResource, ...prev]);
      return newResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resource');
      throw err;
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    baseMetadata: any,
    uploadedBy: string
  ) => {
    try {
      const newResources = await resourceService.uploadMultipleResources(files, baseMetadata, uploadedBy);
      setResources(prev => [...newResources, ...prev]);
      return newResources;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resources');
      throw err;
    }
  }, []);

  const updateResource = useCallback(async (id: string, updates: Partial<Resource>) => {
    try {
      await resourceService.updateResource(id, updates);
      setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      throw err;
    }
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
      throw err;
    }
  }, []);

  const refreshResources = useCallback(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    filters,
    setFilters,
    uploadResource,
    uploadMultiple,
    updateResource,
    deleteResource,
    refreshResources
  };
}

export function useResourcesByType(type: ResourceType) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      setError(null);
      try {
        const data = await resourceService.getResourcesByType(type);
        setResources(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch resources');
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [type]);

  return { resources, loading, error };
}

export function useResource(resourceId: string) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResource() {
      if (!resourceId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await resourceService.getResourceById(resourceId);
        setResource(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch resource');
        console.error('Error fetching resource:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResource();
  }, [resourceId]);

  return { resource, loading, error };
}
