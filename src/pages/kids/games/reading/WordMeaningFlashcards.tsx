import { useEffect, useMemo, useState } from 'react';

type Flashcard = {
  word: string;
  meaning: string;
  sentence: string;
};

type FlashcardLevel = {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  subtopic: string;
  cards: Flashcard[];
};

type PersistedState = {
  completedLevelIds: string[];
  lastSelectedLevelId?: string;
  lastCardIndexByLevel?: Record<string, number>;
};

type Screen = 'levels' | 'play' | 'complete';

const STORAGE_KEY = 'ts_free_word_meaning_flashcards_v1';

const LEVELS: FlashcardLevel[] = [
  {
    id: 'level-1-action-words',
    levelNumber: 1,
    title: 'Action Words',
    subtitle: 'Learn words that show actions.',
    subtopic: 'action-words',
    cards: [
      { word: 'run', meaning: 'to move fast using your legs', sentence: 'I run in the park.' },
      { word: 'jump', meaning: 'to push your body up into the air', sentence: 'The boy jumps over the rope.' },
      { word: 'eat', meaning: 'to put food in your mouth and swallow it', sentence: 'I eat an apple.' },
      { word: 'read', meaning: 'to look at words and understand them', sentence: 'She reads a storybook.' },
      { word: 'write', meaning: 'to make letters or words on paper', sentence: 'I write my name.' },
      { word: 'draw', meaning: 'to make a picture with a pencil, crayon, or pen', sentence: 'I draw a flower.' },
      { word: 'sing', meaning: 'to make music with your voice', sentence: 'We sing a happy song.' },
      { word: 'dance', meaning: 'to move your body to music', sentence: 'The children dance on the stage.' },
      { word: 'carry', meaning: 'to hold something and take it with you', sentence: 'I carry my school bag.' },
      { word: 'open', meaning: 'to move something so it is not closed', sentence: 'Please open the door.' },
    ],
  },
  {
    id: 'level-2-feeling-words',
    levelNumber: 2,
    title: 'Feeling Words',
    subtitle: 'Learn words that tell how someone feels.',
    subtopic: 'feeling-words',
    cards: [
      { word: 'happy', meaning: 'feeling good or joyful', sentence: 'The child is happy.' },
      { word: 'sad', meaning: 'feeling unhappy', sentence: 'The girl is sad.' },
      { word: 'angry', meaning: 'feeling upset or mad', sentence: 'He is angry because his toy broke.' },
      { word: 'tired', meaning: 'needing rest or sleep', sentence: 'I am tired after playing.' },
      { word: 'excited', meaning: 'feeling very happy and eager', sentence: 'She is excited for her birthday.' },
      { word: 'scared', meaning: 'feeling afraid', sentence: 'The puppy is scared of thunder.' },
      { word: 'proud', meaning: 'feeling happy about something you did well', sentence: 'I am proud of my drawing.' },
      { word: 'bored', meaning: 'feeling uninterested', sentence: 'He is bored during the long wait.' },
      { word: 'calm', meaning: 'peaceful and not worried', sentence: 'I feel calm after taking a deep breath.' },
      { word: 'surprised', meaning: 'feeling amazed because something unexpected happened', sentence: 'She was surprised by the gift.' },
    ],
  },
  {
    id: 'level-3-describing-words',
    levelNumber: 3,
    title: 'Describing Words',
    subtitle: 'Learn words that describe people, animals, places, and things.',
    subtopic: 'describing-words',
    cards: [
      { word: 'big', meaning: 'large in size', sentence: 'The elephant is big.' },
      { word: 'small', meaning: 'little in size', sentence: 'The cup is small.' },
      { word: 'soft', meaning: 'smooth and gentle to touch', sentence: 'The pillow is soft.' },
      { word: 'loud', meaning: 'making a lot of sound', sentence: 'The drum is loud.' },
      { word: 'bright', meaning: 'full of light or colour', sentence: 'The sun is bright.' },
      { word: 'clean', meaning: 'not dirty', sentence: 'My room is clean.' },
      { word: 'cold', meaning: 'having a low temperature', sentence: 'The water is cold.' },
      { word: 'sweet', meaning: 'tasting like sugar', sentence: 'The mango is sweet.' },
      { word: 'fast', meaning: 'moving quickly', sentence: 'The rabbit is fast.' },
      { word: 'slow', meaning: 'moving with little speed', sentence: 'The turtle is slow.' },
    ],
  },
  {
    id: 'level-4-school-words',
    levelNumber: 4,
    title: 'School Words',
    subtitle: 'Learn useful classroom words.',
    subtopic: 'school-words',
    cards: [
      { word: 'pencil', meaning: 'a tool used for writing or drawing', sentence: 'I write with a pencil.' },
      { word: 'teacher', meaning: 'a person who helps children learn', sentence: 'My teacher explains the lesson.' },
      { word: 'classroom', meaning: 'a room where children learn', sentence: 'We sit in the classroom.' },
      { word: 'lesson', meaning: 'something we learn', sentence: "Today's lesson is about words." },
      { word: 'homework', meaning: 'school work done at home', sentence: 'I finish my homework.' },
      { word: 'notebook', meaning: 'a book used for writing notes or work', sentence: 'I write answers in my notebook.' },
      { word: 'question', meaning: 'something we ask to get an answer', sentence: 'The teacher asks a question.' },
      { word: 'answer', meaning: 'what we say or write for a question', sentence: 'I know the answer.' },
      { word: 'library', meaning: 'a place where books are kept', sentence: 'We read books in the library.' },
      { word: 'practice', meaning: 'doing something again to get better', sentence: 'I practice reading every day.' },
    ],
  },
  {
    id: 'level-5-everyday-words',
    levelNumber: 5,
    title: 'Everyday Words',
    subtitle: 'Learn words used in daily life.',
    subtopic: 'everyday-words',
    cards: [
      { word: 'family', meaning: 'people who live with us or care for us', sentence: 'I love my family.' },
      { word: 'garden', meaning: 'a place where plants and flowers grow', sentence: 'The flowers are in the garden.' },
      { word: 'market', meaning: 'a place where people buy and sell things', sentence: 'We buy fruits from the market.' },
      { word: 'bottle', meaning: 'a container used to hold water or other liquids', sentence: 'I drink water from a bottle.' },
      { word: 'window', meaning: 'an opening in a wall that lets in light and air', sentence: 'I opened the window.' },
      { word: 'kitchen', meaning: 'a room where food is cooked', sentence: 'Mother is in the kitchen.' },
      { word: 'blanket', meaning: 'a warm cover used while sleeping', sentence: 'I sleep under a blanket.' },
      { word: 'street', meaning: 'a road in a town or city', sentence: 'Cars move on the street.' },
      { word: 'neighbour', meaning: 'a person who lives near your home', sentence: 'Our neighbour has a dog.' },
      { word: 'morning', meaning: 'the early part of the day', sentence: 'I brush my teeth in the morning.' },
    ],
  },
];

const readPersisted = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedLevelIds: [], lastCardIndexByLevel: {} };

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
      lastSelectedLevelId:
        typeof parsed.lastSelectedLevelId === 'string' ? parsed.lastSelectedLevelId : undefined,
      lastCardIndexByLevel:
        parsed.lastCardIndexByLevel && typeof parsed.lastCardIndexByLevel === 'object'
          ? parsed.lastCardIndexByLevel
          : {},
    };
  } catch {
    return { completedLevelIds: [], lastCardIndexByLevel: {} };
  }
};

const writePersisted = (next: PersistedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can fail in private mode or restricted environments.
  }
};

export default function WordMeaningFlashcards() {
  const [screen, setScreen] = useState<Screen>('levels');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedLevelIds, setCompletedLevelIds] = useState<string[]>([]);
  const [lastCardIndexByLevel, setLastCardIndexByLevel] = useState<Record<string, number>>({});

  useEffect(() => {
    const persisted = readPersisted();
    setCompletedLevelIds(persisted.completedLevelIds);
    setLastCardIndexByLevel(persisted.lastCardIndexByLevel || {});
  }, []);

  const selectedLevel = useMemo(
    () => LEVELS.find((level) => level.id === selectedLevelId) || null,
    [selectedLevelId]
  );

  const currentCard = selectedLevel ? selectedLevel.cards[cardIndex] : null;

  const persistState = (patch: Partial<PersistedState>) => {
    const base = readPersisted();
    const merged: PersistedState = {
      completedLevelIds: patch.completedLevelIds ?? base.completedLevelIds,
      lastSelectedLevelId: patch.lastSelectedLevelId ?? base.lastSelectedLevelId,
      lastCardIndexByLevel: patch.lastCardIndexByLevel ?? base.lastCardIndexByLevel ?? {},
    };
    writePersisted(merged);
  };

  const handleStartLevel = (level: FlashcardLevel) => {
    const savedIndex = lastCardIndexByLevel[level.id] ?? 0;
    const safeIndex = Math.max(0, Math.min(savedIndex, level.cards.length - 1));

    setSelectedLevelId(level.id);
    setCardIndex(safeIndex);
    setIsFlipped(false);
    setScreen('play');

    persistState({ lastSelectedLevelId: level.id });
  };

  const handleBackToLevels = () => {
    setScreen('levels');
    setSelectedLevelId(null);
    setCardIndex(0);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNextCard = () => {
    if (!selectedLevel) return;

    const isLastCard = cardIndex >= selectedLevel.cards.length - 1;

    if (isLastCard) {
      const nextCompleted = completedLevelIds.includes(selectedLevel.id)
        ? completedLevelIds
        : [...completedLevelIds, selectedLevel.id];

      const nextLastCardMap = { ...lastCardIndexByLevel, [selectedLevel.id]: 0 };

      setCompletedLevelIds(nextCompleted);
      setLastCardIndexByLevel(nextLastCardMap);
      persistState({
        completedLevelIds: nextCompleted,
        lastCardIndexByLevel: nextLastCardMap,
        lastSelectedLevelId: selectedLevel.id,
      });

      setScreen('complete');
      setIsFlipped(false);
      return;
    }

    const nextIndex = cardIndex + 1;
    const nextLastCardMap = { ...lastCardIndexByLevel, [selectedLevel.id]: nextIndex };

    setCardIndex(nextIndex);
    setIsFlipped(false);
    setLastCardIndexByLevel(nextLastCardMap);
    persistState({
      lastCardIndexByLevel: nextLastCardMap,
      lastSelectedLevelId: selectedLevel.id,
    });
  };

  const handleReplayLevel = () => {
    if (!selectedLevel) return;

    const nextLastCardMap = { ...lastCardIndexByLevel, [selectedLevel.id]: 0 };
    setCardIndex(0);
    setIsFlipped(false);
    setScreen('play');
    setLastCardIndexByLevel(nextLastCardMap);
    persistState({
      lastCardIndexByLevel: nextLastCardMap,
      lastSelectedLevelId: selectedLevel.id,
    });
  };

  const handleNextLevel = () => {
    if (!selectedLevel) return;
    const currentLevelIndex = LEVELS.findIndex((lvl) => lvl.id === selectedLevel.id);
    const nextLevel = LEVELS[currentLevelIndex + 1];
    if (!nextLevel) return;
    handleStartLevel(nextLevel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-emerald-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Word Meaning Flashcards
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Learn 50 useful words with simple meanings and example sentences.
          </p>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Choose a level, flip the card, read the meaning, and say the sentence aloud.
          </p>
        </header>

        {screen === 'levels' && (
          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {LEVELS.map((level) => {
                const isCompleted = completedLevelIds.includes(level.id);
                return (
                  <div
                    key={level.id}
                    className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Level {level.levelNumber}
                      </p>
                      {isCompleted && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Completed
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{level.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{level.subtitle}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {level.cards.length} words
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStartLevel(level)}
                      className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Start Level
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {screen === 'play' && selectedLevel && currentCard && (
          <section className="mx-auto max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToLevels}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Levels
              </button>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{selectedLevel.title}</p>
                <p className="text-xs text-slate-500">
                  Card {cardIndex + 1} of {selectedLevel.cards.length}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
              {!isFlipped ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 p-6 text-center sm:min-h-[300px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">Word</p>
                  <h3 className="mt-4 text-5xl font-black tracking-tight text-indigo-900 sm:text-6xl">
                    {currentCard.word}
                  </h3>
                </div>
              ) : (
                <div className="min-h-[260px] rounded-3xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-6 sm:min-h-[300px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Meaning</p>
                  <p className="mt-3 text-xl font-bold leading-8 text-emerald-900 sm:text-2xl">
                    {currentCard.meaning}
                  </p>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Sentence</p>
                  <p className="mt-3 text-lg leading-8 text-emerald-900 sm:text-xl">
                    {currentCard.sentence}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleFlip}
                  className="w-full rounded-2xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  {isFlipped ? 'Show Word' : 'Flip Card'}
                </button>
                <button
                  type="button"
                  disabled={!isFlipped}
                  onClick={handleNextCard}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Next Card
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === 'complete' && selectedLevel && (
          <section className="mx-auto max-w-3xl rounded-[28px] border border-white/80 bg-white/90 p-6 text-center shadow-sm backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Level Complete</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">Great work!</h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              You completed {selectedLevel.title}. Keep going to learn more words.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleReplayLevel}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Replay Level
              </button>
              <button
                type="button"
                onClick={handleBackToLevels}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Levels
              </button>
              <button
                type="button"
                onClick={handleNextLevel}
                disabled={LEVELS.findIndex((lvl) => lvl.id === selectedLevel.id) >= LEVELS.length - 1}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next Level
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
