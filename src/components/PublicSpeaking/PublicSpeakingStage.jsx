import React, { useEffect, useRef, useState } from 'react';
import PromptDisplay from './PromptDisplay';
import RecordButton from './RecordButton';
import FeedbackDisplay from './FeedbackDisplay';
import callFunction from '../../lib/callFunctions';
import { getLocalPrompt, buildLocalFeedback } from './speakingData';

export default function PublicSpeakingStage({ userId, age = 8, difficulty = 'easy', topic = 'favorite animal' }) {
  const [prompt, setPrompt] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    setError('');
    try {
      const data = await callFunction('generateSpeakingPrompt', { age, difficulty, topic });
      setPrompt(data || getLocalPrompt(age));
    } catch (err) {
      setPrompt(getLocalPrompt(age));
      setError(err?.message || 'Using offline prompt while AI is unavailable.');
    }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or unavailable.');
    }
  };

  const handleStop = async () => {
    setRecording(false);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    // TODO: upload blob to storage, run STT + Groq eval; fallback feedback below
    if (prompt?.prompt) {
      setFeedback(buildLocalFeedback({ prompt: prompt.prompt, age }));
    } else {
      setFeedback(buildLocalFeedback({ prompt: 'your talk', age }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Public Speaking Stage</p>
          <h1 className="text-3xl font-bold text-gray-900">Practice your speaking with helpful feedback</h1>
        </div>
        <button onClick={fetchPrompt} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold">
          New prompt
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}

      <PromptDisplay prompt={prompt?.prompt} targetTime={prompt?.targetTime} topic={topic} />

      <RecordButton recording={recording} onStart={startRecording} onStop={stopRecording} />

      <FeedbackDisplay feedback={feedback} />
    </div>
  );
}
