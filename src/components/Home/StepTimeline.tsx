import React, { useState } from 'react';
import { Carousel } from '../common/Carousel';
import Modal from '@/common/Modal';

type Step = {
  icon: string;
  header: string;
  duration: string;
  bullets: string[];
  progressPercent: number;
  parentNotice: string;
  sampleScheduleLink?: boolean;
};

const steps: Step[] = [
  {
    icon: '🎯',
    header: 'Week 1: Assessment',
    duration: '1 Class',
    bullets: ['Initial level check', 'Learning style assessment', 'Customized plan', 'Detailed parent report'],
    progressPercent: 0,
    parentNotice: 'We understand your child’s comfort level and current skills.'
  },
  {
    icon: '📚',
    header: 'Weeks 2-8: Intensive Learning',
    duration: '6–8 Weeks',
    bullets: ['2–3 classes/week', 'Core skills development', 'Fun practice activities', 'Weekly progress reports'],
    progressPercent: 45,
    parentNotice: 'Reading or speaking starts to feel smoother and less hesitant.',
    sampleScheduleLink: true
  },
  {
    icon: '🚀',
    header: 'Weeks 9-12: Confidence Building',
    duration: '4 Weeks',
    bullets: ['Real‑world application', 'Presentation practice', 'Milestone moments', 'Peer sharing sessions'],
    progressPercent: 80,
    parentNotice: 'Child starts using new words in daily talk without prompting.'
  },
  {
    icon: '⭐',
    header: 'Month 4+: Independent Learning',
    duration: 'Ongoing',
    bullets: ['Reads independently', 'Speaks confidently', 'Advanced paths', 'Maintenance classes'],
    progressPercent: 100,
    parentNotice: 'Confidence is visible in school presentations and discussions.'
  }
];

const accentStyles = [
  { border: 'from-[#ffdaba] via-[#fff1d6] to-white', chip: 'from-[#ff8f5c] to-[#ffb347]' },
  { border: 'from-[#d6f1ff] via-white to-[#e8fbff]', chip: 'from-[#59c3ff] to-[#7ddff8]' },
  { border: 'from-[#fbe4ff] via-white to-[#fde7f4]', chip: 'from-[#c28cff] to-[#f472d0]' },
  { border: 'from-[#e6fde9] via-white to-[#fdf5d8]', chip: 'from-[#34d399] to-[#a3e635]' }
];

const StepTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);

  const renderCard = (step: Step, index: number) => {
    const isActive = index === activeStep;
    const accent = accentStyles[index % accentStyles.length];
    return (
      <div
        key={step.header}
        className={`rounded-[28px] p-[1px] transition-all ${
          isActive
            ? `bg-gradient-to-br ${accent.border} shadow-[0_18px_45px_rgba(255,143,92,0.18)]`
            : 'bg-transparent'
        }`}
      >
        <div className={`rounded-[24px] bg-white p-5 ${isActive ? 'ring-0' : 'ring-1 ring-slate-200'} shadow`}>
          <div className="text-2xl">{step.icon}</div>
          <div className="mt-2 font-semibold text-gray-900">{step.header}</div>
          <div className="text-sm text-primary-600">{step.duration}</div>
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {step.bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
          {step.sampleScheduleLink && (
            <button
              className="mt-3 text-sm font-medium text-primary-600 underline"
              onClick={() => setModalOpen(true)}
            >
              View a sample weekly schedule
            </button>
          )}
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-600">Progress</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff]"
                style={{ width: `${step.progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">{step.progressPercent}%</div>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-800">{step.parentNotice}</p>
        </div>
      </div>
    );
  };

  return (
    <section data-animate="fade-up" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Your Child's Learning Journey</h2>
          <p className="mt-2 text-base text-gray-700">
            Assessment → intensive learning → confidence building → independent communication. Hover or tap to explore each checkpoint.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {steps.map((step, index) => (
            <button
              key={step.header}
              type="button"
              aria-pressed={activeStep === index}
              onClick={() => setActiveStep(index)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeStep === index
                  ? 'bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 ring-1 ring-gray-200'
              }`}
            >
              {step.header.split(':')[0]}
            </button>
          ))}
        </div>
        <div className="mt-10 hidden grid-cols-4 gap-6 md:grid">
          {steps.map((step, index) => renderCard(step, index))}
        </div>
        <div className="mt-10 md:hidden">
          <Carousel className="-mx-2" autoRotateMs={6000}>
            {steps.map((step, index) => (
              <div key={step.header}>{renderCard(step, index)}</div>
            ))}
          </Carousel>
        </div>
      </div>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold">Sample Weekly Schedule</h3>
            <p className="mt-2 text-sm text-gray-700">Placeholder text for the sample schedule modal.</p>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default StepTimeline;
