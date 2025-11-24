import React, { useState } from 'react';
import { CollapsibleCard } from '../common/CollapsibleCard';
import Button from '../Button/Button';

const cards = [
	{
		icon: '📍',
		title: 'Personalised For Your Child',
		subtext: 'Every plan is tailored.',
		gradient: 'from-[#ffe9cf] via-white to-[#fff2e1]',
		bullets: [
			'Lesson flow adapts to the child’s level every week.',
			'If a learner struggles, we slow down and reinforce.',
			'Fast movers skip repetition and jump to fluency work.',
			'Confidence-building rituals for shy speakers.',
		],
		parentBenefit: 'Less daily homework stress for parents.',
		cta: 'See how it works',
	},
	{
		icon: '👩‍🏫',
		title: 'Certified Mentor Squad',
		subtext: 'Cambridge, CELTA, IB experts.',
		gradient: 'from-[#fbe7ff] via-white to-[#f1edff]',
		bullets: [
			'Early-childhood and IB-certified specialists.',
			'Speech coaches for articulation and voice.',
			'Average 8+ years with young learners.',
			'Available from 5:00 AM to 10:00 PM IST.',
		],
		parentBenefit: 'Expert mentors, no guesswork for parents.',
		cta: 'Meet the teachers',
	},
	{
		icon: '📊',
		title: 'Progress You Can Feel',
		subtext: 'Reports, videos, milestones.',
		gradient: 'from-[#e4f3ff] via-white to-[#f2fbff]',
		bullets: [
			'Friday snapshot: what was learned, where support is needed.',
			'Pronunciation, grammar, and confidence scores.',
			'Home practice nudges (5 minutes a day).',
			'Upcoming goals so you stay in the loop.',
		],
		parentBenefit: 'No need to chase your child to practise.',
		cta: 'View sample report',
	},
	{
		icon: '⏰',
		title: 'Family-Friendly Scheduling',
		subtext: 'Flexible, reschedulable, pause-ready.',
		gradient: 'from-[#eafbf1] via-white to-[#fef6e7]',
		bullets: [
			'Choose time slots that suit your family.',
			'Reschedule with 24-hour notice, no questions asked.',
			'Pause during exams or holidays and resume smoothly.',
			'1:1 or pod formats based on your preference.',
		],
		parentBenefit: 'Schedules that adapt to your life.',
		cta: 'Check live slots',
	},
];

const WhyChooseCollapsibleSection: React.FC = () => {
	const [expandedCard, setExpandedCard] = useState<string | null>(null);

	const toggleCard = (title: string) => {
		setExpandedCard((prev) => (prev === title ? null : title));
	};

	return (
		<section
			data-animate="fade-up"
			className="bg-gradient-to-b from-white to-slate-50/50 py-20"
		>
			<div className="mx-auto max-w-6xl px-6">
				<div className="mb-10 text-center">
					<h2 className="font-heading text-3xl font-bold md:text-4xl">
						Why Choose Tiny Steps
					</h2>
					<p className="mt-2 text-base text-gray-700">
						Tap on a card to reveal the details.
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{cards.map((card) => (
						<div
							key={card.title}
							className={`rounded-[28px] p-[1px] bg-gradient-to-br ${card.gradient}`}
							role="button"
							aria-expanded={expandedCard === card.title}
							onClick={() => toggleCard(card.title)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ')
									toggleCard(card.title);
							}}
							tabIndex={0}
						>
							<CollapsibleCard
								icon={<span aria-hidden="true">{card.icon}</span>}
								title={card.title}
								subtext={card.subtext}
								className="rounded-[26px] bg-white/95 ring-0 shadow-none"
								cta={
									<Button
										size="sm"
										variant="outline"
										className="hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 hover:text-white"
									>
										{card.cta}
									</Button>
								}
							>
								{expandedCard === card.title && (
									<div>
										<ul className="space-y-2 text-left text-sm text-gray-700">
											{card.bullets.map((point) => (
												<li key={point} className="flex items-start gap-2">
													<span>•</span>
													<span>{point}</span>
												</li>
											))}
										</ul>
										<p className="mt-3 text-sm font-medium text-gray-800">
											{card.parentBenefit}
										</p>
									</div>
								)}
							</CollapsibleCard>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default WhyChooseCollapsibleSection;
