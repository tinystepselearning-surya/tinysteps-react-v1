import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	gradient?: boolean;
	withBorder?: boolean;
}

const Card: React.FC<CardProps> = ({ gradient = false, withBorder = false, className, children, ...rest }) => {
	return (
		<motion.div
			className={cn(
				'relative rounded-lg bg-white p-6 text-slate-800 shadow-md transition-all duration-300 hover:shadow-xl',
				gradient && 'bg-gradient-card text-slate-900',
				withBorder && 'border-l-4 border-primary-500',
				className
			)}
			whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)' }}
			transition={{ duration: 0.3 }}
			{...rest}
		>
			{children}
		</motion.div>
	);
};

export default Card;
