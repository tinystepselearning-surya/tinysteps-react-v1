import { useState } from "react";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Payment {
  id: string;
  parentId: string;
  parentName: string;
  studentName: string;
  amount: number;
  dueDate: Date;
  status: "paid" | "pending" | "overdue" | "verified";
  proofUrl?: string;
  proofStatus?: "pending" | "approved" | "rejected";
}

interface CallLog {
  id: string;
  date: Date;
  rmName: string;
  parentName: string;
  outcome: string;
  notes: string;
  followUpDate?: Date;
}

export default function RMFees() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"overdue" | "verification" | "callLogs">("overdue");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDays, setFilterDays] = useState<"all" | "1-7" | "8-14" | "15+">("all");
  
  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Form states
  const [templateType, setTemplateType] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  
  // Mock data - replace with real Firestore queries
  const mockPayments: Payment[] = [
    {
      id: "1",
      parentId: "p1",
      parentName: "Rajesh Kumar",
      studentName: "Aarav Kumar",
      amount: 5000,
      dueDate: new Date(2024, 10, 1),
      status: "overdue",
    },
    {
      id: "2",
      parentId: "p2",
      parentName: "Priya Sharma",
      studentName: "Diya Sharma",
      amount: 5000,
      dueDate: new Date(2024, 10, 20),
      status: "overdue",
    },
    {
      id: "3",
      parentId: "p3",
      parentName: "Amit Patel",
      studentName: "Rohan Patel",
      amount: 5000,
      dueDate: new Date(2024, 11, 3),
      status: "pending",
      proofUrl: "https://example.com/proof1.jpg",
      proofStatus: "pending",
    },
  ];

  const mockCallLogs: CallLog[] = [
    {
      id: "1",
      date: new Date(2024, 11, 1),
      rmName: "Sarah Johnson",
      parentName: "Rajesh Kumar",
      outcome: "Promised payment by Dec 10",
      notes: "Parent mentioned temporary cash flow issue, committed to pay by next week",
      followUpDate: new Date(2024, 11, 10),
    },
  ];

  const getDaysOverdue = (dueDate: Date) => {
    const today = new Date();
    const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getOverdueColor = (days: number) => {
    if (days >= 15) return "red";
    if (days >= 8) return "orange";
    if (days >= 1) return "yellow";
    return "gray";
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = 
      payment.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === "overdue") {
      const daysOverdue = getDaysOverdue(payment.dueDate);
      if (filterDays === "1-7") return daysOverdue >= 1 && daysOverdue <= 7;
      if (filterDays === "8-14") return daysOverdue >= 8 && daysOverdue <= 14;
      if (filterDays === "15+") return daysOverdue >= 15;
      return payment.status === "overdue";
    }
    
    if (activeTab === "verification") {
      return payment.proofStatus === "pending";
    }
    
    return true;
  });

  const handleSendTemplate = async () => {
    if (!selectedPayment) return;
    
    // Create notification
    await addDoc(collection(db, "notifications"), {
      recipientIds: [selectedPayment.parentId],
      subject: "Payment Reminder",
      message: generateMessage(),
      type: "payment_reminder",
      paymentId: selectedPayment.id,
      read: false,
      createdBy: user?.uid,
      createdAt: serverTimestamp(),
    });
    
    setShowTemplateModal(false);
    alert(`${templateType.toUpperCase()} reminder sent successfully!`);
  };

  const handleAddCallLog = async () => {
    await addDoc(collection(db, "call_logs"), {
      parentId: selectedPayment?.parentId,
      parentName: selectedPayment?.parentName,
      paymentId: selectedPayment?.id,
      outcome: callOutcome,
      notes: callNotes,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      rmId: user?.uid,
      rmName: user?.displayName || "RM",
      createdBy: user?.uid,
      createdAt: serverTimestamp(),
    });
    
    setShowCallLogModal(false);
    setCallOutcome("");
    setCallNotes("");
    setFollowUpDate("");
    alert("Call log saved successfully!");
  };

  const handleVerifyProof = async (approved: boolean) => {
    if (!selectedPayment) return;
    
    await updateDoc(doc(db, "payments", selectedPayment.id), {
      proofStatus: approved ? "approved" : "rejected",
      verifiedBy: user?.uid,
      verifiedAt: serverTimestamp(),
      updatedBy: user?.uid,
      updatedAt: serverTimestamp(),
    });
    
    setShowProofModal(false);
    setSelectedPayment(null);
    alert(approved ? "Payment proof approved!" : "Payment proof rejected!");
  };

  const generateMessage = () => {
    if (!selectedPayment) return "";
    
    const templates = {
      whatsapp: `Hello ${selectedPayment.parentName},\n\nThis is a friendly reminder that the fee of ₹${selectedPayment.amount.toLocaleString()} for ${selectedPayment.studentName} was due on ${selectedPayment.dueDate.toLocaleDateString()}.\n\nPlease make the payment at your earliest convenience to avoid any interruption in classes.\n\nThank you!\nTinysteps Team`,
      
      sms: `Dear ${selectedPayment.parentName}, Fee of ₹${selectedPayment.amount} for ${selectedPayment.studentName} is overdue. Please pay soon. -Tinysteps`,
      
      email: `Dear ${selectedPayment.parentName},\n\nWe hope this email finds you well.\n\nThis is a gentle reminder that the monthly fee of ₹${selectedPayment.amount.toLocaleString()} for your child ${selectedPayment.studentName} was due on ${selectedPayment.dueDate.toLocaleDateString()}.\n\nWe request you to kindly clear the outstanding amount at the earliest to ensure uninterrupted learning for your child.\n\nIf you have already made the payment, please upload the payment proof in the parent portal.\n\nThank you for your cooperation.\n\nBest regards,\nTinysteps Learning Partner Team`,
    };
    
    return templates[templateType];
  };

  const overdueStats = {
    total: mockPayments.filter(p => p.status === "overdue").length,
    amount: mockPayments.filter(p => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0),
    critical: mockPayments.filter(p => getDaysOverdue(p.dueDate) >= 15).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Collection & Follow-ups</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage overdue payments, verify proofs, and track collection efforts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Overdue</p>
              <p className="text-3xl font-bold mt-1">{overdueStats.total}</p>
              <p className="text-red-100 text-sm mt-1">₹{overdueStats.amount.toLocaleString()}</p>
            </div>
            <BanknotesIcon className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Critical (15+ days)</p>
              <p className="text-3xl font-bold mt-1">{overdueStats.critical}</p>
              <p className="text-orange-100 text-sm mt-1">Needs immediate attention</p>
            </div>
            <ClockIcon className="h-12 w-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pending Verification</p>
              <p className="text-3xl font-bold mt-1">
                {mockPayments.filter(p => p.proofStatus === "pending").length}
              </p>
              <p className="text-blue-100 text-sm mt-1">Payment proofs to review</p>
            </div>
            <DocumentCheckIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overdue")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overdue"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overdue Payments ({overdueStats.total})
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "verification"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Verification Queue ({mockPayments.filter(p => p.proofStatus === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("callLogs")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "callLogs"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Call Logs ({mockCallLogs.length})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      {(activeTab === "overdue" || activeTab === "verification") && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by parent or student name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          {activeTab === "overdue" && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterDays("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterDays === "all"
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDays("1-7")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterDays === "1-7"
                    ? "bg-yellow-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                1-7 days
              </button>
              <button
                onClick={() => setFilterDays("8-14")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterDays === "8-14"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                8-14 days
              </button>
              <button
                onClick={() => setFilterDays("15+")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterDays === "15+"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                15+ days
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === "overdue" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent / Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const daysOverdue = getDaysOverdue(payment.dueDate);
                const color = getOverdueColor(daysOverdue);
                
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.parentName}</div>
                        <div className="text-sm text-gray-500">{payment.studentName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.dueDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${color}-100 text-${color}-800`}>
                        {daysOverdue} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowTemplateModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Reminder"
                        >
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowCallLogModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Log Call"
                        >
                          <PhoneIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{payment.parentName}</h3>
                  <p className="text-sm text-gray-500">{payment.studentName}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  Pending
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-600">Amount: <span className="font-semibold">₹{payment.amount.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Due: {payment.dueDate.toLocaleDateString()}</p>
              </div>
              
              {payment.proofUrl && (
                <div className="mb-3">
                  <img 
                    src={payment.proofUrl} 
                    alt="Payment proof" 
                    className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowProofModal(true);
                    }}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowProofModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "callLogs" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Call History</h3>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm">
              Export Logs
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {mockCallLogs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{log.parentName}</h4>
                    <p className="text-sm text-gray-500">
                      {log.date.toLocaleDateString()} • Called by {log.rmName}
                    </p>
                  </div>
                  {log.followUpDate && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Follow-up: {log.followUpDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Outcome:</p>
                  <p className="text-sm text-gray-600">{log.outcome}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{log.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Payment Reminder</h3>
                <p className="text-sm text-gray-600">To: {selectedPayment.parentName}</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Channel
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTemplateType("whatsapp")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    templateType === "whatsapp"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setTemplateType("sms")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    templateType === "sms"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  SMS
                </button>
                <button
                  onClick={() => setTemplateType("email")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    templateType === "email"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Preview
              </label>
              <textarea
                value={generateMessage()}
                readOnly
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm"
              />
              {templateType === "sms" && (
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {generateMessage().length}/160
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTemplate}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Send {templateType.toUpperCase()} Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Log Modal */}
      {showCallLogModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Log Call</h3>
                <p className="text-sm text-gray-600">Parent: {selectedPayment.parentName}</p>
              </div>
              <button
                onClick={() => setShowCallLogModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select outcome...</option>
                  <option value="promised">Promised Payment</option>
                  <option value="rescheduled">Rescheduled Payment</option>
                  <option value="disputed">Disputed Amount</option>
                  <option value="no-answer">No Answer</option>
                  <option value="wrong-number">Wrong Number</option>
                  <option value="requested-callback">Requested Callback</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={4}
                  placeholder="Add details about the conversation..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCallLogModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCallLog}
                disabled={!callOutcome || !callNotes}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Call Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Verification Modal */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verify Payment Proof</h3>
                <p className="text-sm text-gray-600">
                  {selectedPayment.parentName} • ₹{selectedPayment.amount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {selectedPayment.proofUrl && (
              <div className="mb-4">
                <img
                  src={selectedPayment.proofUrl}
                  alt="Payment proof"
                  className="w-full max-h-96 object-contain rounded border border-gray-200"
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Please verify the payment details before approving. Once approved, the payment status will be updated automatically.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleVerifyProof(false)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Reject
              </button>
              <button
                onClick={() => handleVerifyProof(true)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
