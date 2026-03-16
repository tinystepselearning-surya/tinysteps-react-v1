import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../Button/Button';
import { cn } from '../lib/utils';

const navLinks = [
	{ label: 'Home', path: '/' },
	{ label: 'Courses', path: '/courses' },
	{ label: 'Curriculum', path: '/curriculum' },
	{ label: 'Why Tiny Steps', path: '/why-us' },
	{ label: 'Contact', path: '/contact' }
];

const Header: React.FC = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isDark, setIsDark] = useState(() =>
		typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
	);

	useEffect(() => {
		if (typeof document === 'undefined') {
			return;
		}
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileOpen]);

	const toggleDarkMode = () => {
		if (typeof document === 'undefined') {
			return;
		}
		document.documentElement.classList.toggle('dark');
		setIsDark(document.documentElement.classList.contains('dark'));
	};

	return (
		<motion.header
			className="sticky top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-lg"
			initial={{ y: -80, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
		>
			<div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 md:px-8">
				<Link to="/" className="font-heading text-2xl font-bold text-orange-500">
					Tiny Steps
				</Link>

				<nav className="hidden items-center gap-6 md:flex">
					{navLinks.map(({ label, path }) => (
						<NavLink
							key={path}
							to={path}
							className={({ isActive }) =>
								cn(
									'interactive-link text-sm font-medium text-gray-700',
									isActive && 'font-semibold text-primary-600 underline decoration-primary-500'
								)
							}
						>
							{label}
						</NavLink>
					))}
				</nav>

				<div className="flex items-center gap-3">
					<button
						type="button"
						aria-label="Toggle dark mode"
						className="hidden rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:text-primary-500 md:inline-flex"
						onClick={toggleDarkMode}
					>
						{isDark ? '🌙' : '☀️'}
					</button>
					<Button size="sm" className="hidden md:inline-flex">
						Book Free Trial
					</Button>
					<button
						type="button"
						aria-label="Toggle navigation"
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 md:hidden"
						onClick={() => setMobileOpen((prev) => !prev)}
					>
						<span className="block h-0.5 w-5 bg-gray-700" />
						<span className="mt-1 block h-0.5 w-5 bg-gray-700" />
						<span className="mt-1 block h-0.5 w-5 bg-gray-700" />
					</button>
				</div>
			</div>

			<AnimatePresence>
				{mobileOpen && (
					<>
						<motion.div
							className="fixed inset-0 z-40 bg-black/40"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMobileOpen(false)}
						/>
						<motion.aside
							className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-2xl"
							initial={{ x: '-100%' }}
							animate={{ x: 0 }}
							exit={{ x: '-100%' }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<div className="flex items-center justify-between">
								<span className="font-heading text-xl text-primary-600">Menu</span>
								<button
									type="button"
									aria-label="Close navigation"
									className="text-2xl text-gray-500"
									onClick={() => setMobileOpen(false)}
								>
									×
								</button>
							</div>
							<div className="mt-8 flex flex-col gap-4">
								{navLinks.map(({ label, path }) => (
									<NavLink
										key={path}
										to={path}
										className="interactive-link text-lg text-gray-700"
										onClick={() => setMobileOpen(false)}
									>
										{label}
									</NavLink>
								))}
							</div>
							<div className="mt-10 space-y-4">
								<Button size="md" className="w-full">
									Book Free Trial
								</Button>
								<button
									type="button"
									className="w-full rounded-full border border-gray-200 py-2 text-center text-sm text-gray-600"
									onClick={toggleDarkMode}
								>
									{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
								</button>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</motion.header>
	);
};

export default Header;
