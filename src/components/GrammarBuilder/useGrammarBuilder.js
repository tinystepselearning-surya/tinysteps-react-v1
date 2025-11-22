import { useCallback, useEffect, useState } from 'react';
import callFunction from '../../lib/callFunctions';
import { getGrammarAdaptiveSettings, getOfflineSnippet } from './grammarGameData';

export function useGrammarBuilder({ grammarTopic = 'singular/plural' }) {
  const [story, setStory] = useState('Once upon a time, a cat was sleeping under a tree.');
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const loadSnippet = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const adaptive = getGrammarAdaptiveSettings(history);
      const topic = grammarTopic || adaptive.grammarTopic;
      const data = await callFunction('generateStorySnippet', { previousStory: story, grammar_topic: topic });
      setSnippet(data);
    } catch (err) {
      const fallback = getOfflineSnippet(grammarTopic);
      setSnippet(fallback);
      const msg =
        err?.code === 'functions/unauthenticated' || /unauth/i.test(String(err?.message || ''))
          ? 'Please sign in to use AI grammar builder. Showing offline exercise instead.'
          : err?.message || 'Using offline grammar exercise while AI is unavailable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [grammarTopic, history, story]);

  useEffect(() => {
    loadSnippet();
  }, [loadSnippet]);

  const choose = useCallback(
    (choice) => {
      if (!snippet) return;
      const correct = choice.text === snippet.correctChoice || choice.correct;
      const filled = snippet.snippet.replace('______', choice.text || snippet.correctChoice || '');
      const newStory = `${story} ${filled}`;
      setHistory((h) => [...h, { snippet, choice, correct }]);
      setStory(newStory);
      setSnippet(null);
      // Fetch next snippet
      const adaptive = getGrammarAdaptiveSettings([...history, { snippet, choice, correct }]);
      const topic = grammarTopic || adaptive.grammarTopic;
      callFunction('generateStorySnippet', { previousStory: newStory, grammar_topic: topic })
        .then((data) => setSnippet(data || null))
        .catch((err) => {
          const fallback = getOfflineSnippet(topic);
          setSnippet(fallback);
          const msg =
            err?.code === 'functions/unauthenticated' || /unauth/i.test(String(err?.message || ''))
              ? 'Please sign in to use AI grammar builder. Showing offline exercise instead.'
              : err?.message || 'Using offline grammar exercise while AI is unavailable.';
          setError(msg);
        });
    },
    [grammarTopic, history, snippet, story]
  );

  return {
    story,
    snippet,
    loading,
    error,
    history,
    choose,
    reload: loadSnippet,
  };
}

export default useGrammarBuilder;
