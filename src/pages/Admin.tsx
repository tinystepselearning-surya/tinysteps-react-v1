import { useState } from 'react';
import type { FC } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebaseConfig";

const functions = getFunctions(app, 'asia-south1');
const setUserRole = httpsCallable(functions, 'setUserRole');
const getUidByEmail = httpsCallable(functions, 'getUidByEmail');

const AdminPanel: FC = () => {
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('teacher');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const lookupUid = async () => {
    if (!email) {
      setMessage('Please enter an email');
      return;
    }
    setLoading(true);
    try {
      const res = await getUidByEmail({ email });
      const data = res.data as { uid: string };
      setUid(data.uid);
      setMessage(`UID found: ${data.uid}`);
    } catch (err: any) {
      setMessage(`Error looking up UID: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!uid) {
      setMessage('Please lookup UID first');
      return;
    }
    setLoading(true);
    try {
      const res = await setUserRole({ uid, role });
      const data = res.data as any;
      setMessage(data.success ? data.message : `Error: ${data.error}`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel - Assign User Role</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">User Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
          placeholder="Enter user email"
        />
        <button
          onClick={lookupUid}
          disabled={loading}
          className="mt-2 bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'Lookup UID'}
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">User UID</label>
        <input
          type="text"
          value={uid}
          readOnly
          className="border p-2 w-full bg-gray-100"
          placeholder="UID will appear here after lookup"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="kid">Kid</option>
          <option value="learningPartner">Learning Partner</option>
        </select>
      </div>
      <button
        onClick={assignRole}
        disabled={loading || !uid}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Assigning...' : 'Assign Role'}
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default AdminPanel;