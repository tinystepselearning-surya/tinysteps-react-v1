import { useBetaFeedback } from './useBetaFeedback';

export default function BetaFeedbackForm({ role }) {
  const { submitFeedback, loading, error, submitted } = useBetaFeedback(role);

  const handleSubmit = (payload) => {
    submitFeedback({ ...payload, betaRole: role });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm text-indigo-600 font-semibold uppercase">Beta Feedback</p>
          <h1 className="text-3xl font-bold text-gray-900">
            Thank you for testing Tiny Steps AI!
          </h1>
          <p className="text-sm text-gray-600">
            This form takes under 2 minutes. Your responses help us improve Practice Buddy and related practice features.
          </p>
        </div>

        {role === 'kid' && <KidsFeedbackForm onSubmit={handleSubmit} loading={loading} submitted={submitted} />}
        {role === 'teacher' && <TeacherFeedbackForm onSubmit={handleSubmit} loading={loading} submitted={submitted} />}
        {role === 'parent' && <ParentsFeedbackForm onSubmit={handleSubmit} loading={loading} submitted={submitted} />}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
            {error}
          </div>
        )}
        {submitted && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            Thanks! We received your feedback.
          </div>
        )}
      </div>
    </div>
  );
}
