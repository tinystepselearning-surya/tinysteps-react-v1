import { useState, useEffect, useMemo } from "react";
import { getUsers, createUser, updateUser, deleteUser, calculateAge } from "../../services/adminService";
import { USER_ROLES, USER_ROLE_OPTIONS, type User, type CreateUserFormData, type UserRole, type Student, type UserStatus } from "../../types/admin";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

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
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created' | 'role'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

      // Validate first and last name for ALL users
      if (!firstName || !lastName) {
        alert("Please enter both first name and last name");
        return;
      }

      // Combine first and last name for ALL users
      const displayName = `${firstName} ${lastName}`.trim();

      // Prepare form data with DOB for students
      const userData = { 
        ...formData, 
        displayName,
        firstName,
        lastName
      };
      
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
      const newStatus: 'active' | 'suspended' = currentStatus === "active" ? "suspended" : "active";
      await updateUser(uid, { status: newStatus });
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

  // Advanced filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let result = users;

    // Role filter
    if (filter !== 'all') {
      result = result.filter(u => u.role === filter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        (u.phoneNumber && u.phoneNumber.includes(term))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [users, filter, statusFilter, searchTerm, sortBy, sortOrder]);

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.uid)));
    }
  };

  const handleSelectUser = (uid: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(uid)) {
      newSelected.delete(uid);
    } else {
      newSelected.add(uid);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkStatusChange = async (newStatus: UserStatus) => {
    if (selectedUsers.size === 0) {
      alert("Please select users first");
      return;
    }

    if (!confirm(`Are you sure you want to change status to "${newStatus}" for ${selectedUsers.size} user(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedUsers).map(uid => updateUser(uid, { status: newStatus }))
      );
      alert(`${selectedUsers.size} user(s) status updated to ${newStatus}`);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      console.error("Failed to update users:", error);
      alert("Failed to update some users. Check console for details.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      alert("Please select users first");
      return;
    }

    if (!confirm(`⚠️ WARNING: You are about to DELETE ${selectedUsers.size} user(s). This action CANNOT be undone. Are you absolutely sure?`)) {
      return;
    }

    const confirmText = prompt(`Type "DELETE" to confirm deletion of ${selectedUsers.size} user(s):`);
    if (confirmText !== "DELETE") {
      alert("Deletion cancelled");
      return;
    }

    try {
      const errors: string[] = [];
      for (const uid of selectedUsers) {
        try {
          await deleteUser(uid);
        } catch (error: any) {
          errors.push(`${uid}: ${error.message}`);
        }
      }

      if (errors.length === 0) {
        alert(`${selectedUsers.size} user(s) deleted successfully`);
      } else {
        alert(`Deleted ${selectedUsers.size - errors.length} user(s). Failed: ${errors.length}\n\nErrors:\n${errors.join('\n')}`);
      }

      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      console.error("Failed to delete users:", error);
      alert("Failed to delete users. Check console for details.");
    }
  };

  const filteredUsers = filteredAndSortedUsers;

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">
            {filteredUsers.length} of {users.length} users
            {selectedUsers.size > 0 && ` • ${selectedUsers.size} selected`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-sky-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          Create User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Search & Filters</h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, username, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="text-sm text-gray-400 py-2">Role:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({users.length})
            </button>
            {USER_ROLE_OPTIONS.map(option => {
              const count = users.filter(u => u.role === option.value).length;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as UserRole)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === option.value ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="text-sm text-gray-400 py-2">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Active ({users.filter(u => u.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'suspended' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Suspended ({users.filter(u => u.status === 'suspended').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pending ({users.filter(u => u.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="created">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm hover:bg-gray-600 transition-colors"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Clear Filters */}
        {(searchTerm || filter !== 'all' || statusFilter !== 'all' || sortBy !== 'created' || sortOrder !== 'desc') && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilter('all');
              setStatusFilter('all');
              setSortBy('created');
              setSortOrder('desc');
            }}
            className="text-sm text-orange-400 hover:text-orange-300 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-orange-400" />
              <span className="text-white font-medium">
                {selectedUsers.size} user(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('active')}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange('suspended')}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm font-medium"
              >
                Suspend
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.size > 0 && selectedUsers.size === filteredUsers.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
              </th>
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
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <MagnifyingGlassIcon className="h-12 w-12 text-gray-600" />
                    <p className="text-gray-400">No users found</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="text-sm text-orange-400 hover:text-orange-300 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.uid)}
                      onChange={() => handleSelectUser(user.uid)}
                      className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    />
                  </td>
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
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <TrashIcon className="h-5 w-5" />
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
              
              {/* First Name and Last Name for ALL users */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                  <span className="ml-2 text-xs text-gray-400">(Required)</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                  <span className="ml-2 text-xs text-gray-400">(Required)</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter last name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                  <span className="ml-2 text-xs text-gray-400">(Valid email required)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                  <span className="ml-2 text-xs text-gray-400">(Unique, no spaces)</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  required
                  pattern="[a-z0-9_]+"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="username123"
                />
                <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, and underscores</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                  <span className="ml-2 text-xs text-gray-400">(Min 6 characters)</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                  <span className="ml-2 text-xs text-gray-400">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code if international</p>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                      <span className="ml-2 text-xs text-gray-400">(Optional - for age tracking)</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {dateOfBirth ? `Age: ${Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : 'Optional - used to calculate and display student age'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enrolled Courses
                      <span className="ml-2 text-xs text-gray-400">(Select one or more)</span>
                    </label>
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
                  <option key="active" value="active">Active</option>
                  <option key="suspended" value="suspended">Suspended</option>
                  <option key="pending" value="pending">Pending</option>
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
