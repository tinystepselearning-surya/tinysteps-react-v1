import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

type ComparisonRow = {
	feature: string;
	tinySteps: string;
	others: string;
};

const comparisons: ComparisonRow[] = [
	{
		feature: 'Live, credentialed language coaches',
		tinySteps: 'check',
		others: 'tilde'
	},
	{
		feature: 'Personalized age + confidence pathways',
		tinySteps: 'check',
		others: 'cross'
	},
	{
		feature: 'Weekly progress dashboards for parents',
		tinySteps: 'check',
		others: 'cross'
	},
	{
		feature: 'Immersive AR/VR phonics labs',
		tinySteps: 'check',
		others: 'cross'
	},
	{
		feature: 'Micro-pod speaking clubs (5:1)',
		tinySteps: 'check',
		others: 'tilde'
	},
	{
		feature: 'Global showcase events & badges',
		tinySteps: 'check',
		others: 'cross'
	},
	{
		feature: 'Recorded feedback + AI pronunciation coach',
		tinySteps: 'check',
		others: 'tilde'
	},
	{
		feature: 'Family coaching + habit trackers',
		tinySteps: 'check',
		others: 'cross'
	}
];

const rowVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.05, duration: 0.4 }
	})
};

const renderCell = (value: string) => {
	if (value === 'check') return <span className="text-emerald-500">✔</span>;
	if (value === 'cross') return <span className="text-rose-500">✕</span>;
	if (value === 'tilde') return <span className="text-amber-500">~</span>;
	return value;
};

const ComparisonTableSection: React.FC = () => {
	const { ref, isInView } = useScrollAnimation(0.2);

	return (
		<section className="bg-white py-20">
			<div className="mx-auto max-w-6xl px-6">
				<div className="text-center">
					<h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">How We Stand Out</h2>
					<p className="mt-2 text-base text-gray-600 md:text-lg">
						A quick look at the difference between Tiny Steps and traditional tutoring.
					</p>
				</div>

				<div className="mt-10 overflow-x-auto">
					<table ref={ref as React.RefObject<HTMLTableElement>} className="w-full min-w-[600px] divide-y divide-gray-200 rounded-3xl bg-white shadow-xl">
						<thead>
							<tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
								<th className="px-6 py-4">Feature</th>
								<th className="px-6 py-4 text-primary-600">Tiny Steps</th>
								<th className="px-6 py-4 text-gray-600">Others</th>
							</tr>
						</thead>
						<tbody>
							{comparisons.map((row, index) => (
								<motion.tr
									key={row.feature}
									custom={index}
									initial="hidden"
									animate={isInView ? 'visible' : 'hidden'}
									variants={rowVariants}
									className="text-sm text-gray-700"
								>
									<td className="px-6 py-4">{row.feature}</td>
									<td className="px-6 py-4 text-center text-lg">{renderCell(row.tinySteps)}</td>
									<td className="px-6 py-4 text-center text-lg">{renderCell(row.others)}</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
};

export default ComparisonTableSection;
