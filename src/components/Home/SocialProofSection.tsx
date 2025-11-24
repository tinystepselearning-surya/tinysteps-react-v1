import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import StatCard from './StatCard';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import AnimatedText from '../common/AnimatedText';

const stats = [
	{ label: 'Happy Learners', value: 3500, suffix: '+' },
	{ label: 'Parent Satisfaction', value: 98, suffix: '%' },
	{ label: 'Expert Teachers', value: 50, suffix: '+' },
	{ label: '3-Month Improvement', value: 95, suffix: '%' }
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.15
		}
	}
};

const cardVariants = {
	hidden: { opacity: 0, y: 50 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: 'easeOut' }
	}
};

const SocialProofSection: React.FC = () => {
	const { scrollYProgress } = useScroll();
	const gradientBackground = useTransform(
		scrollYProgress,
		[0, 1],
		[
			'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 45%, #FEF2F2 100%)',
			'linear-gradient(135deg, #E0F2FE 0%, #FDF2F8 40%, #F0FDF4 100%)'
		]
	);
	const { ref, isInView } = useScrollAnimation(0.2);

	return (
		<motion.section
			className="relative overflow-hidden py-20"
			style={{ background: gradientBackground }}
		>
			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
					backgroundSize: '24px 24px'
				}}
			/>

			<div className="relative mx-auto max-w-6xl px-6">
				<div ref={ref as React.RefObject<HTMLDivElement>} className="text-center">
						<AnimatedText
							text="Loved by parents across the world"
							as="h2"
							className="font-heading text-3xl font-bold md:text-4xl gradient-text"
							animation="slide"
						/>
					<motion.div
						className="mx-auto mt-3 h-1 w-10 rounded-full bg-primary-500"
						initial={{ scaleX: 0 }}
						animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
					/>
					<AnimatedText
						text="Tiny Steps families join from India, the Middle East, the US, UK and beyond—because children feel seen, heard and gently challenged in every class."
						as="p"
						className="mt-4 text-base text-gray-700 md:text-lg"
						animation="words"
						delay={0.2}
					/>
				</div>

				<motion.div
					className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
					variants={containerVariants}
					initial="hidden"
					animate={isInView ? 'visible' : 'hidden'}
				>
					{stats.map((stat, _index) => (
						<motion.div key={stat.label} variants={cardVariants}>
							<StatCard
								value={stat.value}
								label={stat.label}
								suffix={stat.suffix}
								className="hover:shadow-[0_20px_45px_rgba(0,82,204,0.25)]"
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</motion.section>
	);
};

export default SocialProofSection;
