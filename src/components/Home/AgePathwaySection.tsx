import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import AnimatedText from '../common/AnimatedText';

type Pathway = {
	courses: string[];
	focus: string;
};

const pathways: Record<number, Pathway> = {
	// Ages 3-6: Early Readers & Speakers
	3: { courses: ['Fun phonics and letter-sound stories', 'Early blending, reading and sight words', 'Simple speaking games to build confidence'], focus: 'Phonics, early reading, and confidence building.' },
	4: { courses: ['Fun phonics and letter-sound stories', 'Early blending, reading and sight words', 'Simple speaking games to build confidence'], focus: 'Phonics, early reading, and confidence building.' },
	5: { courses: ['Fun phonics and letter-sound stories', 'Early blending, reading and sight words', 'Simple speaking games to build confidence'], focus: 'Phonics, early reading, and confidence building.' },
	6: { courses: ['Fun phonics and letter-sound stories', 'Early blending, reading and sight words', 'Simple speaking games to build confidence'], focus: 'Phonics, early reading, and confidence building.' },

	// Ages 7-9: Strong Grammar & Reading
	7: { courses: ['Clear grammar basics for school', 'Reading fluency with short passages', 'Storytelling and picture talk to express ideas'], focus: 'Grammar foundations and reading fluency.' },
	8: { courses: ['Clear grammar basics for school', 'Reading fluency with short passages', 'Storytelling and picture talk to express ideas'], focus: 'Grammar foundations and reading fluency.' },
	9: { courses: ['Clear grammar basics for school', 'Reading fluency with short passages', 'Storytelling and picture talk to express ideas'], focus: 'Grammar foundations and reading fluency.' },

	// Ages 10-12: Writing & Public Speaking
	10: { courses: ['Paragraph and essay writing support', 'Presentation skills and structured speeches', 'Listening, note-taking and comprehension practice'], focus: 'Writing, presentations, and advanced comprehension.' },
	11: { courses: ['Paragraph and essay writing support', 'Presentation skills and structured speeches', 'Listening, note-taking and comprehension practice'], focus: 'Writing, presentations, and advanced comprehension.' },
	12: { courses: ['Paragraph and essay writing support', 'Presentation skills and structured speeches', 'Listening, note-taking and comprehension practice'], focus: 'Writing, presentations, and advanced comprehension.' }
};

const listVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.1
		}
	}
};

const itemVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const AgePathwaySection: React.FC = () => {
	const [selectedAge, setSelectedAge] = useState(6);
	const { ref } = useScrollAnimation(0.2);
	const pathway = pathways[selectedAge] ?? pathways[6];

	const coursesWithIndex = useMemo(() => pathway.courses.map((course, index) => ({ course, index })), [pathway]);

	return (
		<section className="relative overflow-hidden py-20">
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E0F2FE] via-[#FEF2F2] to-[#F0FDF4] animate-gradient-shift opacity-80" />
			<div className="relative mx-auto max-w-5xl px-6">
				<div ref={ref as React.RefObject<HTMLDivElement>} className="text-center">
					<AnimatedText
						text="Built for every age and stage"
						as="h2"
						className="font-heading text-3xl font-bold text-gray-900 md:text-4xl"
						animation="slide"
					/>
					<p className="mt-4 max-w-2xl mx-auto text-gray-700">
						Whether your child is just starting with sounds or preparing for big-school presentations, Tiny Steps has a clear, gentle path for ages 3–12.
					</p>
				</div>

				<div className="mt-10 space-y-6">
					<div className="flex flex-col items-center gap-4">
						<label htmlFor="age-slider" className="font-semibold text-gray-800">
							Select Age: <span className="text-primary-600">{selectedAge}</span> years
						</label>
						<input
							id="age-slider"
							type="range"
							min={3}
							max={12}
							step={1}
							value={selectedAge}
							onChange={(event) => setSelectedAge(Number(event.target.value))}
							className="age-slider w-full max-w-xl"
						/>
					</div>

					<AnimatePresence mode="wait">
						{pathway && (
							<motion.div
								key={selectedAge}
								className="rounded-3xl bg-white/90 p-[1px] shadow-[0_20px_50px_rgba(0,82,204,0.15)]"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
							>
								<div className="rounded-3xl bg-white p-8">
									<h3 className="font-heading text-2xl font-semibold text-gray-900">Recommended Courses</h3>
									<motion.ul
										className="mt-6 space-y-4"
										variants={listVariants}
										initial="hidden"
										animate="visible"
									>
										{coursesWithIndex.map(({ course, index }) => (
											<motion.li
												key={course}
												variants={itemVariants}
												className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4"
											>
												<span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 font-semibold text-white shadow-lg">
													{index + 1}
												</span>
												<p className="text-lg font-medium text-gray-800">{course}</p>
											</motion.li>
										))}
									</motion.ul>

									<div className="mt-8 rounded-2xl border-l-4 border-orange-500 bg-orange-50 p-4 text-sm italic text-orange-900">
										Focus Area: {pathway.focus}
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
};

export default AgePathwaySection;
