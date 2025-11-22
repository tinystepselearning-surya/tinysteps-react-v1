import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { app, db } from '../../lib/firebaseConfig';
import { jsPDF } from 'jspdf';

const functionsClient = getFunctions(app, 'us-central1');
const generateAIResponse = httpsCallable(functionsClient, 'generateAIResponse');

const TOPIC_OPTIONS = ['Phonics', 'Grammar', 'Spelling', 'Reading Comprehension'];
const LEVEL_OPTIONS = ['Early Primary (5-7)', 'Primary (7-9)', 'Upper Primary (9-12)'];
const STYLE_OPTIONS = ['Fill in the blank', 'Multiple choice', 'Picture-based'];

function buildPrompt({ topic, level, questionCount, style }) {
  const base = {
    Phonics: [
      `Create ${questionCount} phonics practice questions for ${level}.`,
      'Topic: CVC words',
      `Style: ${style}`,
      "Format each as: [Visual description] | Sentence: 'The ___ is brown.'",
      'Provide answer key separately.',
      'Keep language simple and age-appropriate.',
    ],
    Grammar: [
      `Create ${questionCount} grammar practice questions for ${level}.`,
      'Topic: Singular/Plural nouns',
      `Style: ${style}`,
      "Format: 'Which word is correct? a) cat  b) cats  c) cates'",
      'Provide answer key.',
      'Make questions fun and relatable.',
    ],
    Spelling: [
      `Create ${questionCount} spelling practice words for ${level}.`,
      'Topic: Common sight words',
      "Include: Word, simple sentence, hint",
      "Format: 'Word: _____ | Sentence: I like the ___ food. | Hint: Sounds like...'",
      'Provide answer key.',
    ],
    'Reading Comprehension': [
      `Create ${questionCount} short reading comprehension questions for ${level}.`,
      'Include: short passage (40-60 words), 3 MCQ questions, 2 short answers',
      'Provide answer key.',
      'Keep it engaging and age-appropriate.',
    ],
  };

  const lines = base[topic] || [];
  return lines.join('\n');
}

export function useWorksheetGenerator(teacherId) {
  const [form, setForm] = useState({
    topic: TOPIC_OPTIONS[0],
    level: LEVEL_OPTIONS[0],
    style: STYLE_OPTIONS[0],
    questionCount: 5,
  });
  const [worksheetText, setWorksheetText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(null);
  const [recent, setRecent] = useState([]);

  const isValid = useMemo(() => {
    return (
      TOPIC_OPTIONS.includes(form.topic) &&
      LEVEL_OPTIONS.includes(form.level) &&
      STYLE_OPTIONS.includes(form.style) &&
      form.questionCount >= 5 &&
      form.questionCount <= 20
    );
  }, [form]);

  const fetchRecent = useCallback(async () => {
    if (!teacherId) return;
    const q = query(
      collection(db, 'worksheets'),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
    setRecent(items);
  }, [teacherId]);

  useEffect(() => {
    fetchRecent().catch(() => {
      /* ignore */
    });
  }, [fetchRecent]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generate = useCallback(async () => {
    setError('');
    if (!teacherId) {
      setError('Missing teacher id.');
      return;
    }
    if (!isValid) {
      setError('Please fill all fields correctly.');
      return;
    }
    setLoading(true);
    try {
      const prompt = buildPrompt(form);
      const resp = await generateAIResponse({
        prompt,
        studentId: `teacher-${teacherId}`, // reuse field to satisfy callable schema while keeping rate limit isolated
        featureType: 'worksheet',
      });
      const data = resp?.data || {};
      setWorksheetText(data.response || '');
      setTokensUsed(data.tokens_used ?? data.tokensUsed ?? null);

      // Lightweight usage log
      await addDoc(collection(db, 'teacher-worksheet-logs'), {
        teacherId,
        topic: form.topic,
        level: form.level,
        style: form.style,
        questionCount: form.questionCount,
        timestamp: serverTimestamp(),
      });
    } catch (_err) {
      console.error('Worksheet Generator error', _err);
      setError(
        _err?.message || _err?.code || _err?.response?.data?.message || 'Could not generate worksheet.'
      );
    } finally {
      setLoading(false);
    }
  }, [form, isValid, teacherId]);

  const saveWorksheet = useCallback(async () => {
    if (!teacherId || !worksheetText) return;
    try {
      await addDoc(collection(db, 'worksheets'), {
        teacherId,
        topic: form.topic,
        level: form.level,
        style: form.style,
        questionCount: form.questionCount,
        content: worksheetText,
        createdAt: serverTimestamp(),
        tokensUsed,
      });
      await fetchRecent();
    } catch (_err) {
      console.error('Save worksheet failed', _err);
      setError('Failed to save worksheet.');
    }
  }, [teacherId, worksheetText, form, tokensUsed, fetchRecent]);

  const reuseWorksheet = useCallback((content) => {
    setWorksheetText(content || '');
    setError('');
  }, []);

  const downloadPdf = useCallback(() => {
    if (!worksheetText) return;
    const doc = new jsPDF();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(worksheetText, 180);
    doc.text(lines, 10, 10);
    const filename = `worksheet-${form.topic}-${form.level}.pdf`.replace(/\s+/g, '-').toLowerCase();
    doc.save(filename);
  }, [worksheetText, form.level, form.topic]);

  const shareLink = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (_err) {
      console.error('Share link copy failed', _err);
      return false;
    }
  }, []);

  return {
    form,
    onChange,
    generate,
    worksheetText,
    setWorksheetText,
    loading,
    error,
    tokensUsed,
    recent,
    saveWorksheet,
    reuseWorksheet,
    downloadPdf,
    shareLink,
    isValid,
    options: { TOPIC_OPTIONS, LEVEL_OPTIONS, STYLE_OPTIONS },
  };
}

export default useWorksheetGenerator;
