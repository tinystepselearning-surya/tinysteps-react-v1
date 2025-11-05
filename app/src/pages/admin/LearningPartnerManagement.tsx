import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, assignLearningPartnerToTeacher, assignLearningPartnerToParent } from '../../services/adminService';
import type { LearningPartner, Teacher, Parent, CreateUserFormData } from '../../types/admin';

export default function LearningPartnerManagement() {
  const [learningPartners, setLearningPartners] = useState<LearningPartner[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLP, setSelectedLP] = useState<LearningPartner | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    username: '',
    displayName: '',
    role: 'learning-partner',
    password: '',
    phoneNumber: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lpData, teachersData, parentsData] = await Promise.all([
        getUsers('learning-partner'),
        getUsers('teacher'),
        getUsers('parent')
      ]);
      setLearningPartners(lpData as LearningPartner[]);
      setTeachers(teachersData as Teacher[]);
      setParents(parentsData as Parent[]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate first and last name
      if (!firstName || !lastName) {
        alert("Please enter both first name and last name");
        return;
      }

      // Combine first and last name
      const displayName = `${firstName} ${lastName}`.trim();

      const userData = { 
        ...formData, 
        displayName,
        firstName,
        lastName
      };

      await createUser(userData);
      alert('Learning Partner created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create Learning Partner');
    }
  };

  const handleDeleteLP = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this Learning Partner?')) return;
    
    try {
      await deleteUser(uid);
      alert('Learning Partner deleted successfully');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete Learning Partner');
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    if (!selectedLP) return;
    
    try {
      await assignLearningPartnerToTeacher(selectedLP.uid, teacherId);
      alert('Teacher assigned successfully');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to assign teacher');
    }
  };

  const handleAssignParent = async (parentId: string) => {
    if (!selectedLP) return;
    
    try {
      await assignLearningPartnerToParent(selectedLP.uid, parentId);
      alert('Parent assigned successfully');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to assign parent');
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setFormData({
      email: '',
      username: '',
      displayName: '',
      role: 'learning-partner',
      password: '',
      phoneNumber: ''
    });
  };

  const getAssignedTeachers = (lp: LearningPartner) => {
    return teachers.filter(t => lp.assignedTeachers.includes(t.uid));
  };

  const getAssignedParents = (lp: LearningPartner) => {
    return parents.filter(p => lp.assignedParents.includes(p.uid));
  };

  const getUnassignedTeachers = () => {
    if (!selectedLP) return [];
    return teachers.filter(t => !selectedLP.assignedTeachers.includes(t.uid));
  };

  const getUnassignedParents = () => {
    if (!selectedLP) return [];
    return parents.filter(p => !selectedLP.assignedParents.includes(p.uid));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading Learning Partners...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Partner Management</h1>
          <p className="text-gray-600">Manage Learning Partners and their assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Create Learning Partner
        </button>
      </div>

      {/* Learning Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningPartners.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No Learning Partners found. Create your first Learning Partner above.
          </div>
        ) : (
          learningPartners.map((lp) => (
            <div key={lp.uid} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{lp.displayName}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  lp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {lp.status}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {lp.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Username:</span> {lp.username}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-gray-700 font-medium mb-1">Assigned:</p>
                  <p className="text-gray-600">Teachers: {lp.assignedTeachers.length}</p>
                  <p className="text-gray-600">Parents: {lp.assignedParents.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedLP(lp);
                    setShowAssignModal(true);
                  }}
                  className="w-full bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 transition text-sm"
                >
                  Manage Assignments
                </button>
                <button
                  onClick={() => handleDeleteLP(lp.uid)}
                  className="w-full bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create LP Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Learning Partner</h2>
            <form onSubmit={handleCreateLP}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                    <span className="ml-2 text-xs text-gray-500">(Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name *
                    <span className="ml-2 text-xs text-gray-500">(Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username *
                    <span className="ml-2 text-xs text-gray-500">(Unique, no spaces)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    pattern="[a-z0-9_]+"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    placeholder="e.g., john_doe123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Learning Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teachers/Parents Modal */}
      {showAssignModal && selectedLP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8">
            <h2 className="text-xl font-bold mb-4">Manage Assignments for {selectedLP.displayName}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Teachers Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Assigned Teachers ({getAssignedTeachers(selectedLP).length})</h3>
                <div className="bg-gray-50 rounded p-3 mb-4 max-h-40 overflow-y-auto">
                  {getAssignedTeachers(selectedLP).length === 0 ? (
                    <p className="text-sm text-gray-500">No teachers assigned</p>
                  ) : (
                    <ul className="space-y-1">
                      {getAssignedTeachers(selectedLP).map(t => (
                        <li key={t.uid} className="text-sm text-gray-700">• {t.displayName}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Assign New Teacher:</h4>
                {getUnassignedTeachers().length === 0 ? (
                  <p className="text-sm text-gray-500">All teachers assigned</p>
                ) : (
                  <div className="space-y-2">
                    {getUnassignedTeachers().map(teacher => (
                      <button
                        key={teacher.uid}
                        onClick={() => handleAssignTeacher(teacher.uid)}
                        className="w-full text-left px-3 py-2 bg-white border rounded hover:bg-blue-50 transition text-sm"
                      >
                        {teacher.displayName} ({teacher.email})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Parents Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Assigned Parents ({getAssignedParents(selectedLP).length})</h3>
                <div className="bg-gray-50 rounded p-3 mb-4 max-h-40 overflow-y-auto">
                  {getAssignedParents(selectedLP).length === 0 ? (
                    <p className="text-sm text-gray-500">No parents assigned</p>
                  ) : (
                    <ul className="space-y-1">
                      {getAssignedParents(selectedLP).map(p => (
                        <li key={p.uid} className="text-sm text-gray-700">• {p.displayName}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Assign New Parent:</h4>
                {getUnassignedParents().length === 0 ? (
                  <p className="text-sm text-gray-500">All parents assigned</p>
                ) : (
                  <div className="space-y-2">
                    {getUnassignedParents().map(parent => (
                      <button
                        key={parent.uid}
                        onClick={() => handleAssignParent(parent.uid)}
                        className="w-full text-left px-3 py-2 bg-white border rounded hover:bg-blue-50 transition text-sm"
                      >
                        {parent.displayName} ({parent.email})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedLP(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
