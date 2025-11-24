import React from 'react';

const AIGuidedPracticeSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Area */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            AI + human mentoring
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-800">
            How our AI-guided practice works each week
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Every child at Tiny Steps has a kind mentor in class and a quiet AI in the background. Together, they pick the right reading, phonics, grammar or speaking practice so your child keeps improving—without random screen time.
          </p>
        </div>

        {/* 4-Step Process */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md border border-gray-200">
            <p className="text-sm font-medium text-blue-600">Step 1</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">
              Child attends a 1:1 class
            </h3>
            <p className="mt-2 text-gray-600">
              Your child reads, speaks and practises with a Tiny Steps mentor in a calm, focused 35-minute session.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md border border-gray-200">
            <p className="text-sm font-medium text-blue-600">Step 2</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">
              AI analyses patterns
            </h3>
            <p className="mt-2 text-gray-600">
              Our AI notices accuracy, speed, common mistakes and confidence signals across sessions—without overwhelming you with data.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md border border-gray-200">
            <p className="text-sm font-medium text-blue-600">Step 3</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">
              Personalised practice plan
            </h3>
            <p className="mt-2 text-gray-600">
              Based on the patterns, we suggest the right mix of phonics, grammar or speaking activities for the coming week.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 md:p-5 bg-white rounded-2xl shadow-md border border-gray-200">
            <p className="text-sm font-medium text-blue-600">Step 4</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">
              Simple parent updates
            </h3>
            <p className="mt-2 text-gray-600">
              You receive clear, jargon-free updates about what your child did, what improved and what we’ll focus on next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIGuidedPracticeSection;