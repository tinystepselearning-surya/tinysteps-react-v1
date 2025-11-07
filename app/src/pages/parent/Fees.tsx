import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  status: "pending" | "completed" | "failed";
  invoiceUrl?: string;
  receiptUrl?: string;
  method: string;
  description: string;
}

interface Subscription {
  planName: string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  pricePerSession: number;
  totalPaid: number;
  startDate: string;
  endDate?: string;
  status: "active" | "expired" | "cancelled";
}

export default function Fees() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadAmount, setUploadAmount] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchFeesData();
    }
  }, [user]);

  const fetchFeesData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Fetch parent subscription/package details
      const parentDoc = await getDoc(doc(db, "parents", user.uid));
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        
        // Mock subscription data - would come from actual subscription record
        setSubscription({
          planName: parentData.planName || "Monthly 8-Session Package",
          sessionsTotal: parentData.sessionsTotal || 8,
          sessionsUsed: parentData.sessionsUsed || 3,
          sessionsRemaining: parentData.sessionsRemaining || 5,
          pricePerSession: parentData.pricePerSession || 500,
          totalPaid: parentData.totalPaid || 4000,
          startDate: parentData.subscriptionStart || "2024-01-01",
          endDate: parentData.subscriptionEnd,
          status: parentData.subscriptionStatus || "active",
        });

        setOutstandingBalance(parentData.outstandingBalance || 0);
      }

      // Fetch payment history
      const paymentsRef = collection(db, "payments");
      const paymentsQuery = query(paymentsRef, where("parentId", "==", user.uid));
      const paymentsSnap = await getDocs(paymentsQuery);

      const paymentsList: PaymentRecord[] = [];
      paymentsSnap.forEach((doc) => {
        const data = doc.data();
        paymentsList.push({
          id: doc.id,
          amount: data.amount || 0,
          date: data.date || "",
          status: data.status || "pending",
          invoiceUrl: data.invoiceUrl,
          receiptUrl: data.receiptUrl,
          method: data.method || "Manual",
          description: data.description || "",
        });
      });

      // Sort by date descending
      paymentsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(paymentsList);
    } catch (error) {
      console.error("Error fetching fees data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadAmount || !user?.uid) {
      alert("Please provide amount and upload a file");
      return;
    }

    try {
      setUploading(true);

      // Upload file to Firebase Storage
      const storageRef = ref(storage, `payment-proofs/${user.uid}/${Date.now()}_${uploadFile.name}`);
      await uploadBytes(storageRef, uploadFile);
      const fileUrl = await getDownloadURL(storageRef);

      // Create payment record
      await addDoc(collection(db, "payments"), {
        parentId: user.uid,
        amount: parseFloat(uploadAmount),
        date: new Date().toISOString(),
        status: "pending",
        receiptUrl: fileUrl,
        method: "Manual Upload",
        description: uploadNote || "Payment proof uploaded by parent",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      alert("Payment proof uploaded successfully! Our team will verify and update your account.");
      setShowUploadModal(false);
      setUploadAmount("");
      setUploadFile(null);
      setUploadNote("");
      fetchFeesData(); // Refresh
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      alert("Failed to upload payment proof. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-500";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-500";
      case "failed":
        return "bg-red-100 text-red-800 border-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-gray-600 mt-1">Manage payments, view invoices, and payment history</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          Upload Payment Proof
        </button>
      </div>

      {/* Subscription Package Card */}
      {subscription && (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <CreditCardIcon className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{subscription.planName}</h2>
              <p className="text-purple-100 text-sm">
                Status: <span className="font-semibold capitalize">{subscription.status}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-purple-100 mb-1">Sessions Remaining</div>
              <div className="text-3xl font-bold">
                {subscription.sessionsRemaining}/{subscription.sessionsTotal}
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-purple-100 mb-1">Price per Session</div>
              <div className="text-3xl font-bold">₹{subscription.pricePerSession}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-purple-100 mb-1">Total Paid</div>
              <div className="text-3xl font-bold">₹{subscription.totalPaid}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-purple-100 mb-1">Outstanding</div>
              <div className="text-3xl font-bold text-yellow-300">₹{outstandingBalance}</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-purple-100">
            Period: {new Date(subscription.startDate).toLocaleDateString()} -{" "}
            {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "Ongoing"}
          </div>
        </div>
      )}

      {/* Outstanding Balance Alert */}
      {outstandingBalance > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-6 w-6 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900">Outstanding Balance</h3>
              <p className="text-orange-700 text-sm mt-1">
                You have an outstanding balance of ₹{outstandingBalance}. Please make a payment to continue
                your classes without interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-sm text-gray-600 mt-1">View all your past transactions and invoices</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{payment.amount}</td>
                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded border text-xs font-medium w-fit ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {getStatusIcon(payment.status)}
                        <span className="capitalize">{payment.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {payment.invoiceUrl && (
                          <a
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Invoice
                          </a>
                        )}
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Receipt
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload Payment Proof</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Screenshot/Receipt (JPG, PNG, PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {uploadFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add any payment reference or note..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading || !uploadFile || !uploadAmount}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

