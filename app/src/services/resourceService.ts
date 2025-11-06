/**
 * Resource Service Functions
 * Handles all resource/file management operations including uploads and tracking
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import type {
  Resource,
  ResourceType,
  ResourceFilters,
  UploadResourceFormData
} from '../types/content';

const RESOURCES_COLLECTION = 'resources';
const STORAGE_PATH = 'resources';

/**
 * Upload a resource file to storage and save metadata
 */
export async function uploadResource(
  file: File,
  metadata: UploadResourceFormData,
  uploadedBy: string
): Promise<Resource> {
  try {
    const now = new Date().toISOString();
    
    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${STORAGE_PATH}/${metadata.category}/${timestamp}_${safeName}`;
    
    // Upload file to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Create resource document
    const resourceData: Omit<Resource, 'id'> = {
      type: metadata.type,
      title: metadata.title,
      description: metadata.description || '',
      url: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      category: metadata.category,
      tags: metadata.tags || [],
      uploadedBy,
      uploadedAt: now,
      updatedAt: now,
      usageCount: 0,
      usedIn: [],
      thumbnailUrl: metadata.thumbnailUrl
    };

    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), resourceData);
    
    console.log(`✅ Resource uploaded: ${docRef.id} (${file.name})`);
    
    return {
      id: docRef.id,
      ...resourceData
    };
  } catch (error) {
    console.error('Error uploading resource:', error);
    throw error;
  }
}

/**
 * Upload multiple resources in batch
 */
export async function uploadMultipleResources(
  files: File[],
  baseMetadata: Omit<UploadResourceFormData, 'title'>,
  uploadedBy: string
): Promise<Resource[]> {
  try {
    const uploads = files.map(file => {
      const metadata: UploadResourceFormData = {
        ...baseMetadata,
        title: file.name.replace(/\.[^/.]+$/, '') // Remove extension
      };
      return uploadResource(file, metadata, uploadedBy);
    });

    const results = await Promise.all(uploads);
    console.log(`✅ ${results.length} resources uploaded`);
    
    return results;
  } catch (error) {
    console.error('Error uploading multiple resources:', error);
    throw error;
  }
}

/**
 * Get resources with optional filtering
 */
export async function getResources(filters?: ResourceFilters): Promise<Resource[]> {
  try {
    const resourcesRef = collection(db, RESOURCES_COLLECTION);
    let q = query(resourcesRef, orderBy('uploadedAt', 'desc'));

    // Apply Firestore filters
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters?.uploadedBy) {
      q = query(q, where('uploadedBy', '==', filters.uploadedBy));
    }

    const snapshot = await getDocs(q);
    let resources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Resource[];

    // Apply client-side filters
    if (filters?.tags && filters.tags.length > 0) {
      resources = resources.filter(resource =>
        filters.tags!.some(tag => resource.tags.includes(tag))
      );
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      resources = resources.filter(resource =>
        resource.title.toLowerCase().includes(term) ||
        resource.description?.toLowerCase().includes(term) ||
        resource.fileName.toLowerCase().includes(term) ||
        resource.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return resources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
}

/**
 * Get a single resource by ID
 */
export async function getResourceById(id: string): Promise<Resource | null> {
  try {
    const resourceDoc = await getDoc(doc(db, RESOURCES_COLLECTION, id));
    
    if (!resourceDoc.exists()) {
      return null;
    }

    return {
      id: resourceDoc.id,
      ...resourceDoc.data()
    } as Resource;
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
}

/**
 * Update resource metadata
 */
export async function updateResource(id: string, updates: Partial<Resource>): Promise<void> {
  try {
    const resourceRef = doc(db, RESOURCES_COLLECTION, id);
    
    // Filter out undefined values and id
    const cleanUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'url' && key !== 'fileName' && key !== 'fileSize' && key !== 'mimeType') {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }
    });

    await updateDoc(resourceRef, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Resource updated: ${id}`);
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
}

/**
 * Delete a resource (file and metadata)
 */
export async function deleteResource(id: string): Promise<void> {
  try {
    const resource = await getResourceById(id);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Delete file from storage
    try {
      const fileRef = ref(storage, resource.url);
      await deleteObject(fileRef);
    } catch (storageError) {
      console.warn('Could not delete storage file:', storageError);
      // Continue with metadata deletion even if storage deletion fails
    }

    // Delete metadata document
    await deleteDoc(doc(db, RESOURCES_COLLECTION, id));

    console.log(`✅ Resource deleted: ${id}`);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

/**
 * Track resource usage (increment usage count and update usedIn array)
 */
export async function trackResourceUsage(
  resourceId: string,
  usedInId: string,
  usedInType: 'course' | 'lesson'
): Promise<void> {
  try {
    const resource = await getResourceById(resourceId);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    const usedIn = resource.usedIn || [];
    const usageRef = `${usedInType}:${usedInId}`;

    if (!usedIn.includes(usageRef)) {
      await updateDoc(doc(db, RESOURCES_COLLECTION, resourceId), {
        usageCount: increment(1),
        usedIn: [...usedIn, usageRef],
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Resource usage tracked: ${resourceId} in ${usageRef}`);
    }
  } catch (error) {
    console.error('Error tracking resource usage:', error);
    throw error;
  }
}

/**
 * Remove resource usage tracking
 */
export async function untrackResourceUsage(
  resourceId: string,
  usedInId: string,
  usedInType: 'course' | 'lesson'
): Promise<void> {
  try {
    const resource = await getResourceById(resourceId);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    const usageRef = `${usedInType}:${usedInId}`;
    const updatedUsedIn = (resource.usedIn || []).filter(ref => ref !== usageRef);

    await updateDoc(doc(db, RESOURCES_COLLECTION, resourceId), {
      usageCount: Math.max(0, (resource.usageCount || 0) - 1),
      usedIn: updatedUsedIn,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Resource usage removed: ${resourceId} from ${usageRef}`);
  } catch (error) {
    console.error('Error untracking resource usage:', error);
    throw error;
  }
}

/**
 * Get resources by type
 */
export async function getResourcesByType(type: ResourceType): Promise<Resource[]> {
  return getResources({ type });
}

/**
 * Get resources by category
 */
export async function getResourcesByCategory(category: string): Promise<Resource[]> {
  return getResources({ category });
}

/**
 * Get resources used in a specific course or lesson
 */
export async function getResourcesUsedIn(
  id: string,
  type: 'course' | 'lesson'
): Promise<Resource[]> {
  try {
    const allResources = await getResources();
    const usageRef = `${type}:${id}`;
    
    return allResources.filter(resource =>
      (resource.usedIn || []).includes(usageRef)
    );
  } catch (error) {
    console.error('Error fetching resources used in:', error);
    throw error;
  }
}

/**
 * Search resources by term
 */
export async function searchResources(searchTerm: string): Promise<Resource[]> {
  return getResources({ searchTerm });
}

/**
 * Get resource download URL (for non-public resources)
 */
export async function getResourceDownloadUrl(resourceId: string): Promise<string> {
  try {
    const resource = await getResourceById(resourceId);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource.url;
  } catch (error) {
    console.error('Error getting resource URL:', error);
    throw error;
  }
}
