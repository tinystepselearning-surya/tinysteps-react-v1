import React from 'react';

// SpellBee game removed. This component is a harmless stub to avoid import errors.
export default function SpellBeeGame() {
  return null;
}

const MODES = [
  { id: 'choice', label: 'Multiple Choice', desc: 'Tap the right spelling', badge: 'Ages 5-6', icon: '🧩' },
  { id: 'drag', label: 'Drag Letters', desc: 'Build the word with tiles', badge: 'Ages 6-7', icon: '🧲' },
  { id: 'tiles', label: 'Letter Tiles', desc: 'Tap tiles in order', badge: 'Ages 7-8', icon: '🧱' },
  { id: 'type', label: 'Type It', desc: 'Practice keyboard skills', badge: 'Ages 7+', icon: '⌨️' },
  { id: 'voice', label: 'Say It', desc: 'Speak and we’ll check', badge: 'Hands-free', icon: '🎤' },
];
const MODE_LABELS = MODES.reduce((acc, m) => ({ ...acc, [m.id]: m.label }), {});

function buildOption(word = '') {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const lower = word.toLowerCase();
  if (lower.length < 2) return `${lower}a`;
  const letters = lower.split('');
  const vowelIndex = letters.findIndex((l) => vowels.includes(l));
  if (vowelIndex >= 0) {
    const differentVowel = vowels[(vowels.indexOf(letters[vowelIndex]) + 1) % vowels.length];
    letters[vowelIndex] = differentVowel;
    return letters.join('');
  }
  // swap two letters for a simple distractor
  [letters[0], letters[1]] = [letters[1], letters[0]];
  return letters.join('');
}

function buildOptions(word = '') {
  const options = new Set([word.toLowerCase()]);
  while (options.size < 3) {
    options.add(buildOption(word));
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function suggestMode({ age, accuracy }) {
  if ((age && age <= 6) || (accuracy != null && accuracy < 50)) return 'choice';
  if ((age && age === 7) || (accuracy != null && accuracy < 70)) return 'drag';
  if ((age && age === 8) || (accuracy != null && accuracy < 85)) return 'tiles';
  return 'choice';
}

function buildDistractorLetters(word = '') {
  const letters = word.toLowerCase().split('');
  const used = new Set(letters);
  const picks = [];
  const shuffled = [...ALPHABET].sort(() => Math.random() - 0.5);
  for (const letter of shuffled) {
    if (!used.has(letter)) {
      picks.push(letter);
    }
    if (picks.length >= 3) break;
  }
  return picks;
}

function DraggableLetter({ letter, id, color = 'blue' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { item: { id, letter } },
  });

  const style = transform ? { transform: CSS.Transform.toString(transform), zIndex: isDragging ? 10 : 1 } : undefined;
  const colorMap = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-blue-300',
    green: 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400 shadow-green-300',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black cursor-grab active:cursor-grabbing shadow-lg border ${colorMap[color] || colorMap.blue} transition`}
    >
      {letter}
    </div>
  );
}

function DroppableSlot({ id, letter }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-16 h-16 md:w-20 md:h-20 border-4 border-dashed rounded-2xl flex items-center justify-center bg-gray-50 ${
        isOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
      }`}
    >
      {letter ? <DraggableLetter id={letter.id} letter={letter.letter} color="green" /> : <span className="text-3xl text-gray-300">_</span>}
    </div>
  );
}

function TrayDropZone({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray-drop' });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[92px] rounded-2xl border-2 border-dashed transition ${
        isOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {children}
    </div>
  );
}

function VisualCues({ mode, showHint }) {
  if (!showHint) return null;
  return (
    <div className="relative">
      {mode === 'choice' && (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl pointer-events-none"
        >
          👇
        </motion.div>
      )}
      {mode === 'drag' && (
        <motion.div
          animate={{ x: [0, 50, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -left-8 top-1/2 -translate-y-1/2 text-3xl pointer-events-none"
        >
          ➡️ Drag here
        </motion.div>
      )}
      {mode === 'tiles' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl pointer-events-none"
        >
          👆 Tap letters
        </motion.div>
      )}
      {mode === 'type' && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm text-gray-500 pointer-events-none"
        >
          Try typing the spelling
        </motion.div>
      )}
    </div>
  );
}

// (stubbed) content removed above
