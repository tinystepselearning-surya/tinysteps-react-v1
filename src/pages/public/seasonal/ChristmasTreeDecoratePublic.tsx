import React from 'react';
import { Link } from 'react-router-dom';

const ChristmasTreeDecoratePublic: React.FC = () => {
  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4">
      <div className="mx-auto max-w-6xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Christmas Tree Decorator</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Home</Link>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden border bg-gray-100 shadow-lg select-none">
          {/* Background image */}
          <img
            src="/seasonal/christmas/gamebg.jpeg"
            alt="Christmas background"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Tree on the right */}
          <img
            src="/seasonal/christmas/tree.png"
            alt="Christmas tree"
            draggable={false}
            className="absolute right-4 bottom-0 w-[36%] md:w-[28%] pointer-events-none"
          />

          {/* Placeholder center content */}
          <div className="relative z-10 flex h-full items-center justify-center p-6">
            <div className="text-center text-white drop-shadow-lg">
              <h2 className="text-2xl font-bold">Christmas Tree Decorator</h2>
              <p className="mt-2 text-sm">Decorate the tree with festive ornaments — coming soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChristmasTreeDecoratePublic;
