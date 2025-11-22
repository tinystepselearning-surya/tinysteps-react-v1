import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebaseConfig'; // ✅ matches your config file

type Cadence = 'daily' | '3x_weekly' | 'weekly' | '2x_weekly';

interface ScheduleSessionBatchRequest {
  enrollmentId: string;
  cadence: Cadence;
  startDate: string;      // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD (optional)
  duration?: number;      // months (fallback if no endDate)
  startTime?: string;     // HH:mm
  endTime?: string;       // HH:mm
}

interface ScheduleSessionBatchResponse {
  success: boolean;
  sessionsCreated: number;
  dates: string[];
  message?: string;
}

interface ScheduleSessionBatchFormProps {
  /** Optional: pre-fill the enrollmentId if you already know it from context */
  enrollmentId?: string;
}

const ScheduleSessionBatchForm: React.FC<ScheduleSessionBatchFormProps> = ({
  enrollmentId: initialEnrollmentId = '',
}) => {
  const [enrollmentId, setEnrollmentId] = useState(initialEnrollmentId);
  const [cadence, setCadence] = useState<Cadence>('3x_weekly');
  const [startDate, setStartDate] = useState<string>('');
  const [useEndDate, setUseEndDate] = useState(false);
  const [endDate, setEndDate] = useState<string>('');
  const [duration, setDuration] = useState<number>(1); // months
  const [startTime, setStartTime] = useState<string>('18:00');
  const [endTime, setEndTime] = useState<string>('18:30');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleSessionBatchResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!enrollmentId.trim()) {
      setError('Please enter an enrollment ID.');
      return;
    }
    if (!startDate) {
      setError('Please choose a start date.');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(app, 'asia-south1');
      const callable = httpsCallable<
        ScheduleSessionBatchRequest,
        ScheduleSessionBatchResponse
      >(functions, 'scheduleSessionBatch');

      const payload: ScheduleSessionBatchRequest = {
        enrollmentId: enrollmentId.trim(),
        cadence,
        startDate,
        startTime,
        endTime,
      };

      if (useEndDate && endDate) {
        payload.endDate = endDate;
      } else {
        payload.duration = duration || 1;
      }

      const res = await callable(payload);
      const data = res.data as ScheduleSessionBatchResponse;
      setResult(data);
    } catch (err: any) {
      console.error('scheduleSessionBatch error', err);
      const msg =
        err?.message ||
        err?.code ||
        'Failed to schedule sessions. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">
        Schedule Sessions (Batch)
      </h2>
      <p className="text-xs text-gray-600 mb-4">
        Create a full batch of sessions for one enrollment in 2–3 clicks.
        Only admins or the assigned teacher can use this.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Enrollment ID */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Enrollment ID
          </label>
          <input
            type="text"
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. ENR_abc123"
          />
          <p className="text-[11px] text-gray-500">
            Later we can auto-fill this when you click “Schedule” on an
            enrollment row.
          </p>
        </div>

        {/* Cadence */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Cadence
          </label>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as Cadence)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="daily">Mon–Fri (Daily)</option>
            <option value="3x_weekly">Mon / Wed / Fri (3x weekly)</option>
            <option value="2x_weekly">Mon / Thu (2x weekly)</option>
            <option value="weekly">Once a week (Mondays)</option>
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              End by
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUseEndDate(false)}
                className={`px-2 py-1 rounded-md border ${
                  !useEndDate
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Duration (months)
              </button>
              <button
                type="button"
                onClick={() => setUseEndDate(true)}
                className={`px-2 py-1 rounded-md border ${
                  useEndDate
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Exact end date
              </button>
            </div>

            {!useEndDate ? (
              <input
                type="number"
                min={1}
                max={12}
                value={duration}
                onChange={(e) =>
                  setDuration(Number(e.target.value) || 1)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="text-xs bg-green-50 border border-green-100 rounded-md px-3 py-2 space-y-1">
            <p className="text-green-700 font-medium">
              ✅ Sessions scheduled successfully.
            </p>
            <p className="text-gray-700">
              Total sessions created:{' '}
              <span className="font-semibold">
                {result.sessionsCreated}
              </span>
            </p>
            {result.dates && result.dates.length > 0 && (
              <p className="text-gray-600">
                First few dates:{' '}
                <span className="font-mono">
                  {result.dates.slice(0, 5).join(', ')}
                </span>
                {result.dates.length > 5 && ' …'}
              </p>
            )}
            {result.message && (
              <p className="text-[11px] text-gray-500">
                {result.message}
              </p>
            )}
            <button
              type="button"
              onClick={resetForm}
              className="mt-1 inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-300 text-[11px] text-gray-700"
            >
              Schedule another batch
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Scheduling…' : 'Schedule Sessions'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleSessionBatchForm;
