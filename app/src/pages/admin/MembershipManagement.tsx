import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

interface Membership {
  parentId: string;
  parentName: string;
  email: string;
  status: "active" | "inactive" | "trial" | "expired";
  plan: "monthly" | "yearly" | "lifetime";
  amount: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export default function MembershipManagement() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "expired">("all");

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const parents = usersSnap.docs
        .filter(doc => doc.data().role === "parent")
        .map(doc => {
          const data = doc.data();
          return {
            parentId: doc.id,
            parentName: data.displayName || "Unknown",
            email: data.email,
            status: data.subscription?.status || "inactive",
            plan: data.subscription?.plan || "monthly",
            amount: data.subscription?.plan === "yearly" ? 999 : 99,
            startDate: data.subscription?.startDate?.toDate() || new Date(),
            endDate: data.subscription?.endDate?.toDate() || new Date(),
            autoRenew: data.subscription?.autoRenew || false,
          } as Membership;
        });
      
      setMemberships(parents);
    } catch (error) {
      console.error("Failed to load memberships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (parentId: string, status: Membership["status"]) => {
    try {
      const parent = memberships.find(m => m.parentId === parentId);
      if (!parent) return;

      const endDate = new Date();
      if (status === "active") {
        endDate.setMonth(endDate.getMonth() + (parent.plan === "yearly" ? 12 : 1));
      }

      await updateDoc(doc(db, "users", parentId), {
        subscription: {
          status,
          plan: parent.plan,
          startDate: new Date(),
          endDate,
          autoRenew: parent.autoRenew,
        },
      });
      
      loadMemberships();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleUpdatePlan = async (parentId: string, plan: Membership["plan"]) => {
    try {
      const parent = memberships.find(m => m.parentId === parentId);
      if (!parent) return;

      await updateDoc(doc(db, "users", parentId), {
        subscription: {
          ...parent,
          plan,
          amount: plan === "yearly" ? 999 : plan === "lifetime" ? 2999 : 99,
        },
      });
      
      loadMemberships();
    } catch (error) {
      console.error("Failed to update plan:", error);
    }
  };

  const handleToggleAutoRenew = async (parentId: string) => {
    try {
      const parent = memberships.find(m => m.parentId === parentId);
      if (!parent) return;

      await updateDoc(doc(db, "users", parentId), {
        "subscription.autoRenew": !parent.autoRenew,
      });
      
      loadMemberships();
    } catch (error) {
      console.error("Failed to toggle auto-renew:", error);
    }
  };

  const filteredMemberships = memberships.filter(m => 
    filter === "all" ? true : m.status === filter
  );

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === "active").length,
    trial: memberships.filter(m => m.status === "trial").length,
    expired: memberships.filter(m => m.status === "expired").length,
    revenue: memberships
      .filter(m => m.status === "active")
      .reduce((sum, m) => sum + m.amount, 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Membership Management</h1>
        <p className="text-gray-400">Manage subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Parents</div>
        </div>
        <div className="bg-gray-800 border border-green-500 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gray-800 border border-blue-500 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{stats.trial}</div>
          <div className="text-sm text-gray-400">Trial</div>
        </div>
        <div className="bg-gray-800 border border-red-500 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{stats.expired}</div>
          <div className="text-sm text-gray-400">Expired</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-sky-500 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">${stats.revenue}</div>
          <div className="text-sm text-white/80">Monthly Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "active", "trial", "expired"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? "bg-gradient-to-r from-orange-500 to-sky-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Memberships Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Parent</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Plan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Start Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">End Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Auto Renew</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredMemberships.map((membership) => (
              <tr key={membership.parentId} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-white">{membership.parentName}</div>
                    <div className="text-sm text-gray-400">{membership.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={membership.plan}
                    onChange={(e) => handleUpdatePlan(membership.parentId, e.target.value as Membership["plan"])}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-white font-semibold">${membership.amount}</td>
                <td className="px-6 py-4">
                  <select
                    value={membership.status}
                    onChange={(e) => handleUpdateStatus(membership.parentId, e.target.value as Membership["status"])}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                      membership.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500"
                        : membership.status === "trial"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500"
                        : membership.status === "expired"
                        ? "bg-red-500/20 text-red-400 border-red-500"
                        : "bg-gray-500/20 text-gray-400 border-gray-500"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {membership.startDate.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {membership.endDate.toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleAutoRenew(membership.parentId)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      membership.autoRenew
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {membership.autoRenew ? "On" : "Off"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors text-sm">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
