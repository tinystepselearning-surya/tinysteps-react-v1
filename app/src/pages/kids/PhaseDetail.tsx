/**
 * PhaseDetail.tsx
 * Detailed page for a specific phase showing all games and milestones
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PHASES } from "../../data/phases";
import { calculatePhaseProgress, getMilestoneStatusCounts, getStatusColor } from "../../utils/progress";

export default function PhaseDetail() {
  const { phaseId } = useParams<{ phaseId: string }>();
  const navigate = useNavigate();
  
  const phase = PHASES.find((p) => p.id === phaseId);
  
  if (!phase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-rose-50 p-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-gray-900">Phase Not Found</h1>
          <Link
            to="/kids/games-gallery"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-400 to-sky-400 px-6 py-3 font-bold text-white shadow-md hover:from-orange-500 hover:to-sky-500"
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    );
  }
  
  const progress = calculatePhaseProgress(phase);
  const statusCounts = getMilestoneStatusCounts(phase);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-rose-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-md hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <span>←</span> Back to Gallery
          </button>
        </div>
        
        {/* Phase Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-3xl shadow-2xl"
          style={{ backgroundColor: phase.color }}
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-5xl font-bold text-gray-900 md:text-6xl">{phase.id}</div>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">{phase.name}</h1>
                <p className="mt-2 text-lg text-gray-700">{phase.age}</p>
                <p className="mt-3 text-xl italic text-gray-800">{phase.tagline}</p>
              </div>
              
              <div className="shrink-0 text-center">
                <div className="text-6xl font-bold text-gray-900">{progress}%</div>
                <div className="mt-2 text-sm font-medium text-gray-700">Complete</div>
                
                <div className="mt-4 flex gap-3 justify-center">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 border-2 border-emerald-300">
                    ✓ {statusCounts.done}
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 border-2 border-blue-300">
                    • {statusCounts.in_progress}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600 border-2 border-gray-300">
                    🔒 {statusCounts.locked}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-4 overflow-hidden rounded-full bg-white/40 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 shadow-md transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Milestones Grid */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">
            Milestones & Games
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {phase.milestones.map((milestone, index) => {
              const colors = getStatusColor(milestone.status);
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all hover:shadow-xl ${colors.border}`}
                >
                  <div className={`p-6 ${colors.bg}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xl font-bold ${colors.text}`}>
                            {milestone.title}
                          </h3>
                          {milestone.status === "done" && (
                            <span className="text-2xl text-emerald-600">✓</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{milestone.desc}</p>
                        
                        {milestone.kpi && milestone.kpi.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {milestone.kpi.map((k) => (
                              <span
                                key={k}
                                className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
                              >
                                📊 {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          {milestone.progress}%
                        </div>
                        <div className="mt-1 text-xs font-medium text-gray-500">
                          {milestone.status === "done" && "Complete"}
                          {milestone.status === "in_progress" && "In Progress"}
                          {milestone.status === "locked" && "Locked"}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-sky-400 transition-all duration-500"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    
                    {/* Action button */}
                    <div className="mt-4">
                      <button
                        className={`w-full rounded-full px-4 py-3 text-sm font-bold text-white shadow-md transition-all ${
                          milestone.status === "locked"
                            ? "cursor-not-allowed bg-gray-400 opacity-50"
                            : "bg-gradient-to-r from-orange-400 to-sky-400 hover:from-orange-500 hover:to-sky-500"
                        }`}
                        disabled={milestone.status === "locked"}
                      >
                        {milestone.status === "done" && "🎮 Play Again"}
                        {milestone.status === "in_progress" && "🎮 Continue Playing"}
                        {milestone.status === "locked" && "🔒 Unlock Previous Milestones"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Navigation to next/previous phase */}
        <div className="mt-12 flex justify-between">
          <button
            onClick={() => {
              const currentIndex = PHASES.findIndex((p) => p.id === phase.id);
              if (currentIndex > 0) {
                navigate(`/kids/phase/${PHASES[currentIndex - 1].id}`);
              }
            }}
            disabled={PHASES.findIndex((p) => p.id === phase.id) === 0}
            className="rounded-full bg-white px-6 py-3 font-bold text-gray-700 shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous Phase
          </button>
          
          <button
            onClick={() => {
              const currentIndex = PHASES.findIndex((p) => p.id === phase.id);
              if (currentIndex < PHASES.length - 1) {
                navigate(`/kids/phase/${PHASES[currentIndex + 1].id}`);
              }
            }}
            disabled={PHASES.findIndex((p) => p.id === phase.id) === PHASES.length - 1}
            className="rounded-full bg-white px-6 py-3 font-bold text-gray-700 shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Phase →
          </button>
        </div>
      </div>
    </div>
  );
}
