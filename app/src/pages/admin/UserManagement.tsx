import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser, calculateAge } from "../../services/adminService";
import { USER_ROLES, USER_ROLE_OPTIONS, type User, type CreateUserFormData, type UserRole, type Student } from "../../types/admin";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [filter, setFilter] = useState<UserRole | 'all'>('all');
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: "",
    username: "",
    displayName: "",
    role: "parent",
    password: "",
    phoneNumber: "",
    parentId: "",
    enrolledCourses: []
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Available courses
  const availableCourses = [
    { id: "phonics-phase-0", name: "Phonics - Phase 0" },
    { id: "phonics-phase-1", name: "Phonics - Phase 1" },
    { id: "phonics-phase-2", name: "Phonics - Phase 2" },
    { id: "phonics-phase-3", name: "Phonics - Phase 3" },
    { id: "phonics-phase-4", name: "Phonics - Phase 4" },
    { id: "phonics-phase-5", name: "Phonics - Phase 5" },
    { id: "grammar-basics", name: "Grammar - Basics" },
    { id: "grammar-advanced", name: "Grammar - Advanced" },
    { id: "public-speaking", name: "Public Speaking" },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [allUsers, parentsData] = await Promise.all([
        getUsers(),
        getUsers('parent')
      ]);
      setUsers(allUsers);
      setParents(parentsData);
    } catch (error) {
      console.error("Failed to load users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate student has parent
      if (formData.role === 'student' && !formData.parentId) {
        alert("Students must be assigned to a parent");
        return;
      }

      // For parents, combine first and last name
      const displayName = formData.role === 'parent' 
        ? `${firstName} ${lastName}`.trim() 
        : formData.displayName;

      if (formData.role === 'parent' && (!firstName || !lastName)) {
        alert("Please enter both first name and last name for parent");
        return;
      }

      // Prepare form data with DOB for students
      const userData = { ...formData, displayName };
      if (formData.role === 'student' && dateOfBirth) {
        userData.dateOfBirth = dateOfBirth;
      }

      await createUser(userData);
      alert(`${USER_ROLES[formData.role]} created successfully!`);
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(error.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateUser(uid, { role: newRole });
      alert("Role updated successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await updateUser(uid, { status: newStatus as any });
      alert(`User ${newStatus}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to update status");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await deleteUser(uid);
      alert("User deleted successfully");
      loadUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert(error.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      username: "",
      displayName: "",
      role: "parent",
      password: "",
      phoneNumber: "",
      parentId: "",
      enrolledCourses: []
    });
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  const roleColors: Record<UserRole, string> = {
    'admin': "bg-red-500/20 text-red-400 border-red-500",
    'learning-partner': "bg-purple-500/20 text-purple-400 border-purple-500",
    'teacher': "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    'parent': "bg-green-500/20 text-green-400 border-green-500",
    'student': "bg-blue-500/20 text-blue-400 border-blue-500",
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-sky-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          All ({users.length})
        </button>
        {USER_ROLE_OPTIONS.map(option => {
          const count = users.filter(u => u.role === option.value).length;
          return (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as UserRole)}
              className={`px-4 py-2 rounded-lg ${filter === option.value ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Username</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-sky-500 flex items-center justify-center text-white font-bold">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.displayName}</div>
                        {user.role === 'student' && (user as Student).dateOfBirth && (
                          <div className="text-xs text-gray-400">
                            Age: {calculateAge((user as Student).dateOfBirth!)} years
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 text-gray-300">{user.username}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.uid, e.target.value as UserRole)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium ${roleColors[user.role]} bg-gray-800`}
                    >
                      {USER_ROLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user.uid, user.status)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        user.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-1 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordModal(true);
                        }}
                        className="px-3 py-1 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className="px-3 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  {USER_ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Parent-specific fields: First and Last Name */}
              {formData.role === 'parent' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter last name"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              {/* Student-specific fields */}
              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parent *</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Parent...</option>
                      {parents.map(parent => (
                        <option key={parent.uid} value={parent.uid}>
                          {parent.displayName} ({parent.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Students must be assigned to a parent</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {dateOfBirth ? `Age: ${Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : 'Optional - used to calculate age'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enrolled Courses</label>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {availableCourses.map(course => (
                        <label key={course.id} className="flex items-center gap-2 py-2 hover:bg-gray-600 px-2 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.enrolledCourses?.includes(course.id) || false}
                            onChange={(e) => {
                              const currentCourses = formData.enrolledCourses || [];
                              const newCourses = e.target.checked
                                ? [...currentCourses, course.id]
                                : currentCourses.filter(c => c !== course.id);
                              setFormData({ ...formData, enrolledCourses: newCourses });
                            }}
                            className="w-4 h-4 text-orange-500 bg-gray-600 border-gray-500 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-200">{course.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.enrolledCourses?.length || 0} course(s) selected
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Create {USER_ROLES[formData.role]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateUser(selectedUser.uid, {
                  displayName: selectedUser.displayName,
                  email: selectedUser.email,
                  phoneNumber: selectedUser.phoneNumber,
                  role: selectedUser.role,
                  status: selectedUser.status,
                });
                alert("User updated successfully!");
                setShowEditModal(false);
                setSelectedUser(null);
                loadUsers();
              } catch (error: any) {
                console.error("Failed to update user:", error);
                alert(error.message || "Failed to update user");
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={selectedUser.displayName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, displayName: e.target.value } as User)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value } as User)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={selectedUser.phoneNumber || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value } as User)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value } as User)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  {USER_ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value } as User)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                <strong>Note:</strong> Password reset requires Firebase Cloud Function for production security. 
                For now, use the Firebase Console to reset passwords manually.
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              alert(`To reset password for ${selectedUser.email}:\n\n1. Go to Firebase Console\n2. Navigate to Authentication > Users\n3. Find ${selectedUser.email}\n4. Click the 3-dot menu > Reset Password\n5. User will receive reset email\n\nCloud Function for admin password reset coming soon!`);
              setShowPasswordModal(false);
              setSelectedUser(null);
              setNewPassword("");
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
                <input
                  type="text"
                  value={`${selectedUser.displayName} (${selectedUser.email})`}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Min 6 characters (for future use)"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-sky-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Show Instructions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
