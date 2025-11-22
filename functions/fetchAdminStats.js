import { query, where, limit } from 'firebase/firestore';

// Updated fetchAdminStats to scope the query
export async function fetchAdminStats() {
  const usersQuery = query(
    collection(db, 'users'),
    where('role', '==', 'admin'), // Example filter
    limit(10) // Limit results for efficiency
  );

  const usersSnapshot = await getDocs(usersQuery);
  const users = usersSnapshot.docs.map(doc => doc.data());

  return users;
}