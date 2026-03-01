// @ts-nocheck
import React from 'react';
import Button from '../Button/Button';
import { useAuthStore } from '../../store/useAuthStore';

const plans = [
	{
		name: 'Phonics Play Packs',
		price: '₹199/mo',
		tone: 'from-[#ffe4c7] to-white',
		description:
			'Replace random apps with curated phonics mini-games (SATPIN, digraphs, vowel teams).',
		features: [
			'Daily 10-minute quests',
			'AI tips for parents',
			'Printable badges + leaderboard',
		],
	},
	{
		name: 'Grammar Arcade',
		price: '₹199/mo',
		tone: 'from-[#e4f3ff] to-white',
		description:
			'Sentence surgery, punctuation hits, tense battles—grammar practice that feels like play.',
		features: [
			'Adaptive difficulty',
			'Stage-based accuracy report',
			'Rewards kids for editing correctly',
		],
	},
	{
		name: 'Speak Bold Studio',
		price: '₹299/mo',
		tone: 'from-[#f5e8ff] to-white',
		description:
			'Public speaking prompts with AI-generated speech insights on pace, clarity, and expression.',
		features: [
			'Record + auto-feedback',
			'Confidence streak tracker',
			'Exportable clips for parents',
		],
	},
];

const bundle = {
	name: 'All Access Joyful Learning',
	price: '₹499/mo',
	tone: 'from-[#fef6e7] via-white to-[#def1ff]',
	description:
		'Unlock all three game libraries. Deeper engagement + 10% off on annual billing for each track.',
	features: [
		'Phonics + Grammar + Speaking',
		'Parent dashboard with time well spent',
		'Extra seasonal quests & badges',
	],
};

export default function GamingSubscriptionSection({
	heading = 'Optional Game Subscriptions for Extra Practice',
}: {
	heading?: string;
}) {
	const { user } = useAuthStore();
	return (
		<section
			data-animate="fade-up"
			className="bg-gradient-to-b from-white to-slate-50/50 py-16"
		>
			<div className="mx-auto max-w-6xl px-6">
				<div className="text-center">
					<div className="gradient-chip mx-auto w-max">Optional Add-On</div>
					<h2 className="mt-2 text-3xl font-semibold text-gray-900 md:text-4xl">
						{heading}
					</h2>
					<p className="mt-2 text-gray-700">
						Enhance your child’s learning journey with curated Tiny Steps games.
						These subscriptions are designed to complement our core 1:1 classes.
					</p>
				</div>
				<div className="mt-10 grid gap-6 md:grid-cols-3">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`rounded-3xl border border-white/0 bg-gradient-to-br ${plan.tone} p-[1px] shadow-card-hover`}
						>
							<div className="rounded-3xl bg-white/95 p-6">
								<div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
									{plan.name}
								</div>
								<div className="mt-2 text-3xl font-bold text-gray-900">
									{plan.price}
								</div>
								<p className="mt-3 text-sm text-gray-600">
									{plan.description}
								</p>
								<ul className="mt-4 space-y-2 text-sm text-gray-700">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2">
											<span>🎮</span>
											<span>{feature}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					))}
				</div>
				<div
					className={`mt-8 rounded-[32px] border border-white/0 bg-gradient-to-r ${bundle.tone} p-[1px] shadow-card-hover`}
				>
					<div className="rounded-[28px] bg-white/95 p-6 md:p-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
						<div>
							<div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
								Bundle & save
							</div>
							<h3 className="text-2xl font-semibold text-gray-900">
								{bundle.name}
							</h3>
							<div className="text-4xl font-bold text-gray-900">
								{bundle.price}
							</div>
							<p className="mt-2 text-sm text-gray-600">
								{bundle.description}
							</p>
							<ul className="mt-3 space-y-2 text-sm text-gray-700">
								{bundle.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2">
										<span>🌈</span>
										<span>{feature}</span>
									</li>
								))}
							</ul>
							<p className="mt-2 text-xs text-gray-500">
								Annual billing? Take an extra 10% off on each game plan.
							</p>
						</div>
						<div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-700 space-y-3">
							<p className="font-semibold text-gray-900">How it works</p>
							<ol className="list-decimal pl-4 space-y-1">
								<li>Pick single track or the all-access bundle.</li>
								<li>
									Kids get lesson-aligned missions inside the Tiny Steps Games app.
								</li>
								<li>Parents receive AI insight summaries + habit nudges.</li>
							</ol>
							{!user && (
								<Button
									onClick={() =>
										window.open(
											'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20Tell%20me%20about%20the%20game%20subscriptions.%20',
											'_blank'
										)
									}
									className="w-full"
								>
									Learn More
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
