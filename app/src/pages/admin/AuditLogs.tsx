import { useState, useMemo } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import type { AuditLog, AuditAction } from "../../types/admin";
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export default function AuditLogsPage() {
  const [limit, setLimit] = useState(100);
  const { logs, loading, error, refetch } = useAuditLogs(limit);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });

  // Get unique action types and entity types for filters
  const actionTypes: AuditAction[] = [
    'user_created', 'user_updated', 'user_deleted', 'user_login', 'user_logout', 'role_changed',
    'assignment_created', 'assignment_removed', 'course_assigned', 'course_removed',
    'session_created', 'session_completed', 'session_cancelled',
    'settings_updated', 'system_config_changed'
  ];

  const entityTypes = useMemo(() => {
    const types = new Set(logs.map((log: AuditLog) => log.entityType));
    return Array.from(types);
  }, [logs]);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log: AuditLog) => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(searchTerm.toLowerCase());

      // Action filter
      const matchesAction = actionFilter === "all" || log.action === actionFilter;

      // Entity type filter
      const matchesEntityType = entityTypeFilter === "all" || log.entityType === entityTypeFilter;

      // Date range filter
      const logDate = new Date(log.timestamp);
      const matchesDateRange = 
        (!dateRange.start || logDate >= new Date(dateRange.start)) &&
        (!dateRange.end || logDate <= new Date(dateRange.end + "T23:59:59"));

      return matchesSearch && matchesAction && matchesEntityType && matchesDateRange;
    });
  }, [logs, searchTerm, actionFilter, entityTypeFilter, dateRange]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = filteredLogs.map((log: AuditLog) => [
      new Date(log.timestamp).toLocaleString(),
      log.userName || 'Unknown',
      log.userRole,
      log.action,
      log.entityType,
      log.entityId || '',
      log.details
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get action badge color
  const getActionColor = (action: AuditAction): string => {
    if (action.includes('created')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (action.includes('deleted') || action.includes('cancelled')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (action.includes('updated') || action.includes('changed')) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (action.includes('assigned')) return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    if (action.includes('payment') || action.includes('subscription')) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-16 bg-gray-700 rounded-xl"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error.message || 'Failed to load audit logs'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, details, or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Entity Type
            </label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Types</option>
              {entityTypes.map((type: string) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Results Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={50}>50 logs</option>
              <option value={100}>100 logs</option>
              <option value={250}>250 logs</option>
              <option value={500}>500 logs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
        {(searchTerm || actionFilter !== "all" || entityTypeFilter !== "all" || dateRange.start || dateRange.end) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setActionFilter("all");
              setEntityTypeFilter("all");
              setDateRange({ start: "", end: "" });
            }}
            className="text-orange-400 hover:text-orange-300"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredLogs.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {log.userName || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {log.userRole.replace(/-/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white capitalize">
                        {log.entityType}
                      </div>
                      {log.entityId && (
                        <div className="text-xs text-gray-400 font-mono">
                          {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-md">
                        {log.details}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
