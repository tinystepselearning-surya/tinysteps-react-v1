import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const testimonials = [
	{
		id: 1,
		name: 'Ananya Mehta',
		result: '+2 reading levels',
		quote: 'Tiny Steps turned bedtime stories into confident performances. She now reads aloud to the whole class!',
		rating: 5,
		photo: 'https://i.pravatar.cc/100?img=45'
	},
	{
		id: 2,
		name: 'Marcus Lee',
		result: 'Debate finalist',
		quote: 'Marcus found his voice! The coaches make public speaking less scary and more like a game.',
		rating: 5,
		photo: 'https://i.pravatar.cc/100?img=12'
	},
	{
		id: 3,
		name: 'Sara Gupta',
		result: 'Grammar jump',
		quote: 'We saw instant improvements in sentence structure and writing clarity within four weeks.',
		rating: 5,
		photo: 'https://i.pravatar.cc/100?img=30'
	},
	{
		id: 4,
		name: 'Diego Alvarez',
		result: 'Confidence unlocked',
		quote: 'The teachers make every child feel like a star. Diego volunteered for assembly announcements!',
		rating: 5,
		photo: 'https://i.pravatar.cc/100?img=5'
	},
	{
		id: 5,
		name: 'Lina Park',
		result: 'Speaking award',
		quote: 'The coaching and feedback loops are unmatched. Lina won her first storytelling contest.',
		rating: 5,
		photo: 'https://i.pravatar.cc/100?img=20'
	}
];

const TestimonialsCarousel: React.FC = () => {
	const [index, setIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		if (isPaused) return undefined;
		const id = setInterval(() => {
			setIndex((prev) => (prev + 1) % testimonials.length);
		}, 5000);
		return () => clearInterval(id);
	}, [isPaused]);

	const visibleTestimonials = useMemo(() => {
		return Array.from({ length: 3 }, (_, offset) => testimonials[(index + offset) % testimonials.length]);
	}, [index]);

	const handlePrev = () => {
		setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
	};

	const handleNext = () => {
		setIndex((prev) => (prev + 1) % testimonials.length);
	};

	return (
		<section className="bg-gradient-to-b from-primary-50 to-white py-20">
			<div className="mx-auto max-w-6xl px-6">
				<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
					<div>
						<h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">What Parents Say</h2>
						<p className="mt-2 text-base text-gray-600 md:text-lg">Stories from families building confident communicators.</p>
					</div>
					<div className="flex gap-4">
						<button
							type="button"
							aria-label="Previous testimonies"
							className="rounded-full border border-gray-300 p-3 text-gray-600 hover:text-primary-600"
							onClick={handlePrev}
						>
							←
						</button>
						<button
							type="button"
							aria-label="Next testimonies"
							className="rounded-full border border-gray-300 p-3 text-gray-600 hover:text-primary-600"
							onClick={handleNext}
						>
							→
						</button>
					</div>
				</div>

				<div
					className="mt-10 overflow-hidden"
					onMouseEnter={() => setIsPaused(true)}
					onMouseLeave={() => setIsPaused(false)}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={index}
							className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
							initial={{ opacity: 0, x: 40 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -40 }}
							transition={{ duration: 0.5, ease: 'easeInOut' }}
						>
							{visibleTestimonials.map((testimonial) => (
								<motion.div
									key={testimonial.id}
									className="rounded-3xl bg-white p-6 shadow-lg"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4 }}
								>
									<div className="flex items-center gap-4">
										<img src={testimonial.photo} alt={testimonial.name} className="h-14 w-14 rounded-full object-cover" />
										<div>
											<p className="font-semibold text-gray-900">{testimonial.name}</p>
											<p className="text-sm text-primary-500">{testimonial.result}</p>
										</div>
									</div>
									<p className="mt-4 text-gray-600">&ldquo;{testimonial.quote}&rdquo;</p>
									<div className="mt-4 flex items-center justify-between">
										<div className="flex gap-1 text-yellow-400">
											{Array.from({ length: 5 }).map((_, starIndex) => (
												<span key={starIndex}>{starIndex < testimonial.rating ? '★' : '☆'}</span>
											))}
										</div>
										<span className="text-sm text-gray-500">Rated {testimonial.rating}/5</span>
									</div>
								</motion.div>
							))}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
};

export default TestimonialsCarousel;
