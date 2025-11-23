// src/pages/kid/SoundDetectiveGame.tsx
import React, {
  useCallback,
  useEffect,
  useState,
  type FC,
} from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebaseConfig';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

type SoundLevel = 'easy' | 'medium' | 'hard';

type SoundDetectiveRequest = {
  targetSound: string;
  level?: SoundLevel;
  kidId?: string | null;
};

type SoundOption = {
  word: string;
  isCorrect: boolean;
  pictureHint?: string;
};

type SoundDetectiveResponse = {
  targetSound: string;
  level: SoundLevel;
  instruction: string;
  options: SoundOption[];
};

type SoundDetectiveGameProps = {
  kidId?: string;
  kidName?: string;
};

const SoundDetectiveGame: FC<SoundDetectiveGameProps> = ({
  kidId,
  kidName,
}) => {
  const [level, setLevel] = useState<SoundLevel>('easy');
  const [round, setRound] = useState<SoundDetectiveResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  // For now we keep target sound fixed as "s". Later we can make this dynamic.
  const targetSound = 's';

  const loadRound = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedWord(null);
    setFeedback(null);

    try {
      const callable = httpsCallable<
        SoundDetectiveRequest,
        SoundDetectiveResponse
      >(functions, 'soundDetectiveRound');

      const result = await callable({
        targetSound,
        level,
        kidId: kidId ?? null,
      });

      setRound(result.data);
    } catch (err: any) {
      console.error('Error loading Sound Detective round:', err);
      setError(
        err?.message ?? 'Could not load a new round. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [kidId, level, targetSound]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  const handleOptionClick = (word: string) => {
    if (!round || loading) return;

    setSelectedWord(word);

    const option = round.options.find((o) => o.word === word);
    if (!option) return;

    if (option.isCorrect) {
      setFeedback('Yay! That word has the /' + targetSound + '/ sound! 🎉');
    } else {
      setFeedback(
        'Nice try! Listen for the /' +
          targetSound +
          '/ sound and pick another word.',
      );
    }
  };

  const handleChangeLevel = (newLevel: SoundLevel) => {
    if (newLevel === level) return;
    setLevel(newLevel);
  };

  return (
    <div className="space-y-4">
      <Card className="border-indigo-100 bg-indigo-50/60">
        <CardContent className="p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                Sound Detective
              </p>
              <p className="text-sm text-slate-700">
                {kidName
                  ? `Playing as ${kidName}.`
                  : 'Playing as guest.'}{' '}
                Find the words with the /{targetSound}/ sound!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Level:</span>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard'] as SoundLevel[]).map(
                  (lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleChangeLevel(lvl)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                        level === lvl
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Target sound:
            </span>
            <span className="text-2xl font-bold text-indigo-700">
              /{targetSound}/
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-700">
              {round?.instruction ??
                'Click the word that has the /s/ sound.'}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={loadRound}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'New Words'}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Getting a new mystery set of words…
            </p>
          )}

          {!loading && !round && !error && (
            <p className="text-sm text-slate-500">
              Click &quot;New Words&quot; to start playing.
            </p>
          )}

          {!loading && round && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {round.options.map((opt) => {
                  const isSelected = selectedWord === opt.word;
                  const isCorrect = opt.isCorrect;

                  let stateClass =
                    'border-slate-200 bg-slate-50 hover:bg-slate-100';
                  if (isSelected) {
                    stateClass = isCorrect
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-rose-400 bg-rose-50';
                  }

                  return (
                    <button
                      key={opt.word}
                      type="button"
                      onClick={() => handleOptionClick(opt.word)}
                      className={`flex items-center justify-center rounded-xl border px-3 py-4 text-sm font-semibold text-slate-800 transition ${stateClass}`}
                    >
                      {opt.word}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <p className="text-sm mt-2 text-slate-700">{feedback}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SoundDetectiveGame;
