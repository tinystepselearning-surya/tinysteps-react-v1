import React, { useState } from 'react';

const InteractiveSampleActivitySection: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    if (option === 'sun') {
      setFeedback("Lovely choice! ‘Sun’ starts with the /s/ sound. This is how we build early reading confidence.");
    } else {
      setFeedback("Nice try! ‘Sun’ is the word that starts with the /s/ sound here. In class, we practise many such examples together.");
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">See how a class feels</p>
          <h2 className="text-3xl font-semibold text-gray-900 mt-2">Try a tiny Tiny Steps activity</h2>
          <p className="text-gray-700 mt-4">
            Here’s a quick sample of the kind of calm, focused practice we use in class. Join in with your child and see how it feels.
          </p>
        </div>

        <div className="max-w-xl mx-auto mt-8 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Phonics sample</p>
          <h3 className="text-lg font-semibold text-gray-900 mt-2">Which word starts with the /s/ sound?</h3>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:justify-center">
            {['sun', 'cat', 'ball'].map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 ${
                  selectedOption === option ? 'border-gray-900 bg-gray-100' : 'border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {feedback && (
            <div className="mt-4 text-sm text-gray-700">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InteractiveSampleActivitySection;