import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const Footer: React.FC = () => {
	const { ref, isInView } = useScrollAnimation(0.2);

	return (
		<motion.footer
			ref={ref as React.RefObject<HTMLDivElement>}
			className="bg-gray-900 px-6 py-12 text-gray-300 md:px-16"
			initial={{ opacity: 0, y: 40 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
		>
			<div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-4">
				<div>
					<h3 className="font-heading text-2xl text-orange-500">Tiny Steps</h3>
					<p className="mt-4 text-sm text-gray-400">
						Empowering confident communicators through immersive phonics, grammar, and public speaking experiences.
					</p>
					<div className="mt-4 flex gap-4 text-sm uppercase tracking-wide text-white">
						<a href="https://facebook.com" aria-label="Tiny Steps on Facebook" className="interactive-link hover:text-primary-500">
							Fb
						</a>
						<a href="https://instagram.com" aria-label="Tiny Steps on Instagram" className="interactive-link hover:text-primary-500">
							Ig
						</a>
						<a href="https://www.youtube.com/@TinyStepsLearning-1157" aria-label="Tiny Steps on YouTube" className="interactive-link hover:text-primary-500">
							YT
						</a>
					</div>
				</div>
				<div>
					<h4 className="font-semibold text-white">Quick Links</h4>
					<ul className="mt-4 space-y-2 text-sm">
						{['Home', 'Courses', 'About', 'FAQ'].map((item) => (
							<li key={item}>
								<Link to={`/${item.toLowerCase()}`} className="interactive-link transition-colors hover:text-primary-500">
									{item}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h4 className="font-semibold text-white">Legal</h4>
					<ul className="mt-4 space-y-2 text-sm">
						{['Privacy', 'Terms', 'Disclaimer'].map((item) => (
							<li key={item}>
								<Link to={`/${item.toLowerCase()}`} className="interactive-link transition-colors hover:text-primary-500">
									{item}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h4 className="font-semibold text-white">Contact</h4>
					<ul className="mt-4 space-y-2 text-sm">
						<li>Phone: +1 (555) 123-4567</li>
						<li>Email: hello@tinysteps.com</li>
						<li>Address: 123 Learning Lane, Wonder City</li>
					</ul>
				</div>
			</div>
			<p className="mt-12 text-center text-xs text-gray-500">
				© 2025 Tiny Steps Online School. All rights reserved.
			</p>
		</motion.footer>
	);
};

export default Footer;
