import { USER_ROLES, ROLE_PERMISSIONS, type UserRole } from '../../types/admin';

export default function RolesPermissions() {
  const roles: UserRole[] = ['parent', 'student', 'teacher', 'learning-partner', 'admin'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-gray-600">View and understand user role permissions</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {roles.map((role) => (
          <div key={role} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {USER_ROLES[role]}
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 mb-3">Permissions:</p>
              <ul className="space-y-2">
                {ROLE_PERMISSIONS[role].map((permission) => (
                  <li key={permission} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Permission Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                {roles.map((role) => (
                  <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {USER_ROLES[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from(new Set(Object.values(ROLE_PERMISSIONS).flat())).map((permission) => (
                <tr key={permission}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  {roles.map((role) => (
                    <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                      {(ROLE_PERMISSIONS[role] as readonly string[]).includes(permission) ? (
                        <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Descriptions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Parent</h3>
            <p className="text-sm text-gray-600">Can view their children's progress, access learning resources, and communicate with teachers.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Student</h3>
            <p className="text-sm text-gray-600">Can access courses, play educational games, and view their own progress.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Teacher</h3>
            <p className="text-sm text-gray-600">Can view assigned students, manage lessons, track progress, and provide feedback.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Learning Partner</h3>
            <p className="text-sm text-gray-600">Can oversee teachers and parents, view analytics, and assign courses to students.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Admin</h3>
            <p className="text-sm text-gray-600">Full access to manage all users, roles, courses, content, billing, and system settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
