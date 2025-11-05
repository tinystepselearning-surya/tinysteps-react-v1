import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, assignLearningPartnerToTeacher } from '../../services/adminService';
import type { Teacher, LearningPartner, CreateUserFormData } from '../../types/admin';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [learningPartners, setLearningPartners] = useState<LearningPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    username: '',
    displayName: '',
    role: 'teacher',
    password: '',
    phoneNumber: '',
    learningPartnerId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, lpData] = await Promise.all([
        getUsers('teacher'),
        getUsers('learning-partner')
      ]);
      setTeachers(teachersData as Teacher[]);
      setLearningPartners(lpData as LearningPartner[]);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
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
      alert('Teacher created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create teacher');
    }
  };

  const handleDeleteTeacher = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await deleteUser(uid);
      alert('Teacher deleted successfully');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete teacher');
    }
  };

  const handleAssignLP = async (teacherId: string, lpId: string) => {
    try {
      await assignLearningPartnerToTeacher(lpId, teacherId);
      alert('Learning Partner assigned successfully');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to assign Learning Partner');
    }
  };

  const handleSuspendTeacher = async (uid: string, suspend: boolean) => {
    try {
      await updateUser(uid, { status: suspend ? 'suspended' : 'active' });
      alert(`Teacher ${suspend ? 'suspended' : 'activated'} successfully`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to update teacher status');
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setFormData({
      email: '',
      username: '',
      displayName: '',
      role: 'teacher',
      password: '',
      phoneNumber: '',
      learningPartnerId: ''
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600">Manage teacher accounts and assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Create Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Learning Partner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No teachers found. Create your first teacher above.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => {
                const lp = learningPartners.find(lp => lp.uid === teacher.learningPartnerId);
                return (
                  <tr key={teacher.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{teacher.displayName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{teacher.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lp ? (
                        <div className="text-sm text-gray-900">{lp.displayName}</div>
                      ) : (
                        <select
                          className="text-sm border rounded px-2 py-1"
                          onChange={(e) => handleAssignLP(teacher.uid, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">Assign LP...</option>
                          {learningPartners.map(lp => (
                            <option key={lp.uid} value={lp.uid}>{lp.displayName}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{teacher.students.length}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleSuspendTeacher(teacher.uid, teacher.status === 'active')}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        {teacher.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.uid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Teacher</h2>
            <form onSubmit={handleCreateTeacher}>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Learning Partner (Optional)</label>
                  <select
                    value={formData.learningPartnerId}
                    onChange={(e) => setFormData({ ...formData, learningPartnerId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  >
                    <option value="">Select Learning Partner...</option>
                    {learningPartners.map(lp => (
                      <option key={lp.uid} value={lp.uid}>{lp.displayName}</option>
                    ))}
                  </select>
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
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
