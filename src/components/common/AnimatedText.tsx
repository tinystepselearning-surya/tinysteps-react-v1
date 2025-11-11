import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type AnimationType = 'fade' | 'slide' | 'scale' | 'letters' | 'words';

interface AnimatedTextProps {
	text: string;
	as?: keyof JSX.IntrinsicElements;
	className?: string;
	animation?: AnimationType;
	delay?: number;
	gradient?: boolean;
	glitchOnHover?: boolean;
}

const baseVariants = {
	fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
	slide: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
	scale: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } }
};

const AnimatedText: React.FC<AnimatedTextProps> = ({
	text,
	as = 'span',
	className,
	animation = 'fade',
	delay = 0,
	gradient = false,
	glitchOnHover = false
}) => {
	const Tag = as;

	const content = useMemo(() => {
		if (animation === 'letters') {
			return (
				<motion.span
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.4 }}
					transition={{ staggerChildren: 0.05, delay }}
					className="inline-flex flex-wrap"
				>
					{text.split('').map((char, index) => (
						<motion.span
							key={`${char}-${index}`}
							variants={{
								hidden: { opacity: 0, y: 10 },
								visible: { opacity: 1, y: 0 }
							}}
						>
							{char === ' ' ? '\u00A0' : char}
						</motion.span>
					))}
				</motion.span>
			);
		}

		if (animation === 'words') {
			return (
				<motion.span
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.4 }}
					transition={{ staggerChildren: 0.15, delay }}
					className="inline-flex flex-wrap gap-1"
				>
					{text.split(' ').map((word, index) => (
						<motion.span
							key={`${word}-${index}`}
							variants={{
								hidden: { opacity: 0, y: 8 },
								visible: { opacity: 1, y: 0 }
							}}
						>
							{word}
						</motion.span>
					))}
				</motion.span>
			);
		}

		const variant = baseVariants[animation] ?? baseVariants.fade;

		return (
			<motion.span
				initial={variant.initial}
				whileInView={variant.animate}
				viewport={{ once: true, amount: 0.4 }}
				transition={{ duration: 0.6, delay }}
			>
				{text}
			</motion.span>
		);
	}, [animation, delay, text]);

	return (
		<Tag
			className={cn(
				'inline-block',
				className,
				gradient && 'animated-gradient-text',
				glitchOnHover && 'glitch-text'
			)}
			data-glitch={glitchOnHover ? text : undefined}
		>
			{content}
		</Tag>
	);
};

export default AnimatedText;
