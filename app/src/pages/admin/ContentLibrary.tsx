/**
 * Content Library
 * Resource management with upload, preview, and organization
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useResources } from '../../hooks/useResources';
import type { ResourceType } from '../../types/content';
import { CONTENT_CATEGORIES } from '../../types/content';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  VideoCameraIcon,
  PhotoIcon,
  MusicalNoteIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'grid' | 'list';

const RESOURCE_TYPE_ICONS: Record<ResourceType, typeof DocumentIcon> = {
  video: VideoCameraIcon,
  pdf: DocumentIcon,
  image: PhotoIcon,
  audio: MusicalNoteIcon,
  worksheet: DocumentIcon,
  document: DocumentIcon
};

export default function ContentLibrary() {
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Build filters
  const filters: any = {};
  if (typeFilter !== 'all') filters.type = typeFilter;
  if (categoryFilter !== 'all') filters.category = categoryFilter;
  if (searchTerm) filters.searchTerm = searchTerm;

  const { resources, loading, error, deleteResource } = useResources(filters);

  const handleSelectResource = (resourceId: string) => {
    const newSelected = new Set(selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResources(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResources.size === resources.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(resources.map(r => r.id)));
    }
  };

  const handleDeleteResource = async (resourceId: string, fileName: string) => {
    if (window.confirm(`Delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await deleteResource(resourceId);
      } catch (err) {
        alert('Failed to delete resource');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedResources.size} selected resources?`)) {
      try {
        await Promise.all(
          Array.from(selectedResources).map(id => deleteResource(id))
        );
        setSelectedResources(new Set());
      } catch (err) {
        alert('Failed to delete some resources');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || categoryFilter !== 'all';

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading resources: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
            <p className="text-gray-600 mt-1">Manage your learning resources and files</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            Upload Files
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources by title, filename, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="pdf">PDFs</option>
              <option value="image">Images</option>
              <option value="audio">Audio</option>
              <option value="worksheet">Worksheets</option>
              <option value="document">Documents</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {Object.values(CONTENT_CATEGORIES).map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear Filters
              </button>
            )}

            {/* View Mode */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Info & Bulk Actions */}
      {selectedResources.size > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-indigo-900 font-medium">
            {selectedResources.size} resource{selectedResources.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedResources(new Set())}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Resources Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? 'Loading...' : `${resources.length} resource${resources.length !== 1 ? 's' : ''} found`}
        </p>
        {resources.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {selectedResources.size === resources.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-4">Loading resources...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && resources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <CloudArrowUpIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by uploading your first resource.'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Upload Your First Resource
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && resources.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map((resource) => {
            const Icon = RESOURCE_TYPE_ICONS[resource.type] || DocumentIcon;
            const isSelected = selectedResources.has(resource.id);
            
            return (
              <div
                key={resource.id}
                className={`bg-white rounded-lg shadow border-2 transition-all cursor-pointer ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectResource(resource.id)}
              >
                {/* Preview/Icon */}
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center relative">
                  {resource.type === 'image' && resource.url ? (
                    <img
                      src={resource.url}
                      alt={resource.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <Icon className="w-16 h-16 text-gray-400" />
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate" title={resource.title}>
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate mb-2" title={resource.fileName}>
                    {resource.fileName}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{resource.type.toUpperCase()}</span>
                    <span>{formatFileSize(resource.fileSize)}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      View
                    </a>
                    <a
                      href={resource.url}
                      download={resource.fileName}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                      Download
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResource(resource.id, resource.fileName);
                      }}
                      className="px-2 py-1.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && resources.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedResources.size === resources.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.map((resource) => {
                const Icon = RESOURCE_TYPE_ICONS[resource.type] || DocumentIcon;
                const isSelected = selectedResources.has(resource.id);
                
                return (
                  <tr key={resource.id} className={isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectResource(resource.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Icon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                          <div className="text-sm text-gray-500">{resource.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resource.type.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resource.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(resource.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(resource.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </a>
                        <a
                          href={resource.url}
                          download={resource.fileName}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteResource(resource.id, resource.fileName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          userId={user?.uid || ''}
        />
      )}
    </div>
  );
}

// Upload Modal Component
interface UploadModalProps {
  onClose: () => void;
  userId: string;
}

function UploadModal({ onClose, userId }: UploadModalProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { uploadMultiple } = useResources();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Simple upload - in production, you'd want more sophisticated handling
      const baseMetadata = {
        category: Object.values(CONTENT_CATEGORIES)[0],
        tags: []
      };
      
      await uploadMultiple(files, baseMetadata, userId);
      alert(`Successfully uploaded ${files.length} file(s)!`);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">Upload Resources</h3>
          
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports images, videos, PDFs, documents, and more
            </p>
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {uploading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 mt-2">Uploading files...</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
