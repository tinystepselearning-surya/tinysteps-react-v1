import { motion } from 'framer-motion';
import useGrammarBuilder from './useGrammarBuilder';
import StoryDisplay from './StoryDisplay.jsx';
import ChoiceButtons from './ChoiceButtons.jsx';
import StoryResult from './StoryResult.jsx';

export default function GrammarBuilder({ grammarTopic = 'singular/plural' }) {
  const { story, snippet, loading, error, history, choose, reload } = useGrammarBuilder({ grammarTopic });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Grammar Builder</p>
          <h1 className="text-3xl font-bold text-gray-900">Build the story with grammar choices</h1>
          <p className="text-sm text-gray-600">Topic: {grammarTopic}</p>
        </div>
        <button
          onClick={reload}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold"
        >
          Reload snippet
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      <StoryDisplay story={story} />

      {snippet && (
        <motion.div
          initial={{ opacity: 0.8, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-white border border-gray-100 shadow space-y-3"
        >
          <p className="text-sm text-gray-500">Fill the blank:</p>
          <p className="text-lg font-semibold text-gray-900">{snippet.snippet}</p>
          <ChoiceButtons choices={snippet.choices || []} onChoose={choose} disabled={loading} />
        </motion.div>
      )}

      <StoryResult history={history} />
    </div>
  );
}
