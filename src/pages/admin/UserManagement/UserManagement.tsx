// no React import needed in new JSX runtime
import { UserList } from './UserList';

export default function UserManagement() {
  return (
    <div className="space-y-4">
      <UserList />
    </div>
  );
}
