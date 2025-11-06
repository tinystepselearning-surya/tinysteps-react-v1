import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Parent {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  childIds: string[];
  subscription?: {
    status: "active" | "inactive" | "trial";
    plan: "monthly" | "yearly";
    startDate: Date;
    endDate: Date;
  };
}

interface Student {
  id: string;
  name: string;
  displayName: string;
  ageYears: number;
  gender: "male" | "female" | "other";
  parentIds: string[];
}

export default function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  const [parentForm, setParentForm] = useState({
    email: "",
    displayName: "",
    phone: "",
  });

  const [childForm, setChildForm] = useState({
    name: "",
    displayName: "",
    ageYears: 5,
    gender: "male" as "male" | "female" | "other",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load parents
      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "parent")));
      const parentsData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Parent[];
      setParents(parentsData);

      // Load students
      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(studentsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "users"), {
        email: parentForm.email,
        displayName: parentForm.displayName,
        phone: parentForm.phone,
        role: "parent",
        childIds: [],
        createdAt: new Date(),
        status: "active",
      });

      setParentForm({ email: "", displayName: "", phone: "" });
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    try {
      // Create student
      const studentRef = await addDoc(collection(db, "students"), {
        name: childForm.name,
        displayName: childForm.displayName,
        ageYears: childForm.ageYears,
        gender: childForm.gender,
        parentIds: [selectedParent.id],
        currentPhase: 0,
        createdAt: new Date(),
      });

      // Update parent's childIds
      const updatedChildIds = [...(selectedParent.childIds || []), studentRef.id];
      await updateDoc(doc(db, "users", selectedParent.id), {
        childIds: updatedChildIds,
      });

      setChildForm({ name: "", displayName: "", ageYears: 5, gender: "male" });
      setShowAddChildModal(false);
      setSelectedParent(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateSubscription = async (parentId: string, status: "active" | "inactive" | "trial") => {
    try {
      await updateDoc(doc(db, "users", parentId), {
        subscription: {
          status,
          plan: "monthly",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      loadData();
    } catch (error) {
      console.error("Failed to update subscription:", error);
    }
  };

  const handleRemoveChild = async (parentId: string, childId: string) => {
    if (!confirm("Remove this child from the parent?")) return;

    try {
      const parent = parents.find(p => p.id === parentId);
      if (!parent) return;

      const updatedChildIds = parent.childIds.filter(id => id !== childId);
      await updateDoc(doc(db, "users", parentId), {
        childIds: updatedChildIds,
      });

      // Update student's parentIds
      const student = students.find(s => s.id === childId);
      if (student) {
        const updatedParentIds = student.parentIds.filter(id => id !== parentId);
        await updateDoc(doc(db, "students", childId), {
          parentIds: updatedParentIds,
        });
      }

      loadData();
    } catch (error) {
      console.error("Failed to remove child:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Deprecation Warning */}
      <div className="mb-6 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-500 mb-2">
              ⚠️ Important: Use User Management Instead
            </h3>
            <p className="text-yellow-200 mb-3">
              This page is deprecated. To create new parents, please use the <strong>User Management</strong> page 
              which properly creates Firebase Authentication accounts with login credentials.
            </p>
            <Link
              to="/surya/users"
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Go to User Management →
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Parent Management</h1>
          <p className="text-gray-400">{parents.length} parents • View only (create in User Management)</p>
        </div>
        <Link
          to="/surya/users"
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          + Add Parent (in User Management)
        </Link>
      </div>

      {/* Parents List */}
      <div className="space-y-4">
        {parents.map((parent) => {
          const parentChildren = students.filter(s => s.parentIds.includes(parent.id));
          
          return (
            <div key={parent.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {parent.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{parent.displayName}</h3>
                    <p className="text-gray-400 text-sm">{parent.email}</p>
                    {parent.phone && <p className="text-gray-500 text-sm">{parent.phone}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={parent.subscription?.status || "inactive"}
                    onChange={(e) => handleUpdateSubscription(parent.id, e.target.value as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                      parent.subscription?.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500"
                        : parent.subscription?.status === "trial"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500"
                        : "bg-gray-500/20 text-gray-400 border-gray-500"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button
                    onClick={() => {
                      setSelectedParent(parent);
                      setShowAddChildModal(true);
                    }}
                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                  >
                    + Add Child
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Children ({parentChildren.length})</h4>
                {parentChildren.length === 0 ? (
                  <p className="text-gray-500 text-sm">No children added yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {parentChildren.map((child) => (
                      <div key={child.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{child.displayName}</p>
                          <p className="text-sm text-gray-400">{child.ageYears} years • {child.gender}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveChild(parent.id, child.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Parent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Parent</h2>
            <form onSubmit={handleCreateParent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={parentForm.displayName}
                  onChange={(e) => setParentForm({ ...parentForm, displayName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Create Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddChildModal && selectedParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Add Child</h2>
            <p className="text-gray-400 mb-6">For parent: {selectedParent.displayName}</p>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Child Name</label>
                <input
                  type="text"
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={childForm.displayName}
                  onChange={(e) => setChildForm({ ...childForm, displayName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age (years)</label>
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={childForm.ageYears}
                  onChange={(e) => setChildForm({ ...childForm, ageYears: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <select
                  value={childForm.gender}
                  onChange={(e) => setChildForm({ ...childForm, gender: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChildModal(false);
                    setSelectedParent(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Add Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
