import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import AnimatedText from '../common/AnimatedText';

const title = 'Our Three Core Courses';

const courseCards = [
	{
		id: 'phonics',
		title: 'Phonics',
		icon: '🔤',
		description: 'Master sounds and letters',
		age: 'Ages 3-8',
		level: 'Foundation to Advanced',
		gradient: 'linear-gradient(135deg, #93C5FD, #2563EB)',
		headerClass: 'from-primary-400 to-primary-600'
	},
	{
		id: 'grammar',
		title: 'Grammar',
		icon: '✍️',
		description: 'Build perfect sentences',
		age: 'Ages 4-12',
		level: 'Beginner to Expert',
		gradient: 'linear-gradient(135deg, #FFB9B9, #FF6B6B)',
		headerClass: 'from-secondary-400 to-secondary-600'
	},
	{
		id: 'speaking',
		title: 'Public Speaking',
		icon: '🎤',
		description: 'Find your voice',
		age: 'Ages 5-12',
		level: 'Confidence to Mastery',
		gradient: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)',
		headerClass: 'from-purple-400 to-purple-600'
	}
];

const cardVariants = {
	hidden: { opacity: 0, scale: 0.85 },
	visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
	hover: {
		y: -10,
		boxShadow: '0 20px 40px rgba(0, 82, 204, 0.15)',
		transition: { duration: 0.3 }
	}
};

const CoursesPreviewSection: React.FC = () => {
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	return (
		<section className="bg-gradient-to-b from-white to-white/60 py-20">
			<div className="mx-auto max-w-6xl px-6">
				<div className="text-center">
					<AnimatedText
						text={title}
						as="h2"
						className="font-heading text-3xl font-bold md:text-4xl"
						animation="letters"
					/>
					<AnimatedText
						text="Master English from A-Z"
						as="p"
						className="mt-4 text-base text-gray-600 md:text-lg"
						animation="words"
					/>
				</div>

				<motion.div
					className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.2 }}
					transition={{ staggerChildren: 0.1 }}
				>
					{courseCards.map((course) => (
						<motion.div
							key={course.id}
							className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition-all"
							variants={cardVariants}
							whileHover="hover"
							whileTap={{ scale: 0.98 }}
							onHoverStart={() => setHoveredId(course.id)}
							onHoverEnd={() => setHoveredId(null)}
							onClick={() => console.log(`Course selected: ${course.id}`)}
						>
							<motion.div
								className="flex h-40 items-center justify-center text-6xl text-white"
								style={{ backgroundImage: course.gradient, backgroundSize: '200% 200%' }}
								animate={hoveredId === course.id ? { backgroundPosition: '100% 50%' } : { backgroundPosition: '0% 50%' }}
								transition={{ duration: 0.8, ease: 'easeInOut' }}
							>
								{course.icon}
							</motion.div>
							<div className="flex flex-1 flex-col gap-4 p-6">
								<div>
									<h3 className="font-heading text-2xl font-semibold text-gray-900">{course.title}</h3>
									<p className="mt-2 text-sm text-gray-600">{course.description}</p>
								</div>
								<div className="flex flex-wrap gap-3">
									<span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">{course.age}</span>
									<span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-600">
										{course.level}
									</span>
								</div>
								<div className="mt-auto">
									<Button size="sm" className="w-full">
										Learn More
									</Button>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
};

export default CoursesPreviewSection;
