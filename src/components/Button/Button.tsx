import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
}

type Ripple = {
	id: number;
	x: number;
	y: number;
	size: number;
};

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg',
	secondary: 'bg-gradient-to-r from-accent-500 to-primary-500 text-white shadow-lg',
	outline: 'border-2 border-primary-500 text-primary-600 bg-white'
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'h-8 px-4 text-sm md:text-base',
	md: 'h-11 px-6 text-base md:text-lg',
	lg: 'h-14 px-8 text-lg md:text-xl'
};

const Button: React.FC<ButtonProps> = ({
	variant = 'primary',
	size = 'md',
	type = 'button',
	loading = false,
	disabled,
	children,
	className,
	onFocus,
	onBlur,
	onClick,
	...rest
}) => {
	const [isFocused, setIsFocused] = useState(false);
	const isDisabled = disabled || loading;
	const ariaLabel = (rest as { 'aria-label'?: string })['aria-label'] ?? (typeof children === 'string' ? children : undefined);
	const [ripples, setRipples] = useState<Ripple[]>([]);

	const spinnerBorder = variant === 'outline' ? 'border-primary-500' : 'border-white';

	const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height);
		const x = event.clientX - rect.left - size / 2;
		const y = event.clientY - rect.top - size / 2;
		const newRipple = { id: Date.now(), x, y, size };
		setRipples((prev) => [...prev, newRipple]);
		setTimeout(() => {
			setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
		}, 600);
	};

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (!isDisabled) {
			createRipple(event);
		}
		onClick?.(event);
	};

	return (
		<motion.button
			type={type}
			aria-label={ariaLabel}
			disabled={isDisabled}
			className={cn(
				'relative inline-flex overflow-hidden rounded-full font-semibold text-white shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
				variantClasses[variant],
				sizeClasses[size],
				isFocused && 'ring-2 ring-primary-500 ring-offset-2',
				className
			)}
			whileHover={
				!isDisabled
					? {
							scale: 1.05,
							boxShadow: '0 15px 30px rgba(0, 82, 204, 0.25)'
						}
					: undefined
			}
			whileTap={!isDisabled ? { scale: 0.95 } : undefined}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
			onFocus={(event) => {
				setIsFocused(true);
				onFocus?.(event);
			}}
			onBlur={(event) => {
				setIsFocused(false);
				onBlur?.(event);
			}}
			onClick={handleClick}
			{...rest}
		>
			{ripples.map((ripple) => (
				<span
					key={ripple.id}
					className="pointer-events-none absolute rounded-full bg-white/40 button-ripple"
					style={{ top: ripple.y, left: ripple.x, width: ripple.size, height: ripple.size }}
				/>
			))}
			{loading && (
				<span
					className={cn(
						'mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent',
						spinnerBorder
					)}
					style={{ animation: 'spin 1s linear infinite' }}
				/>
			)}
			<span className="flex items-center gap-2">{children}</span>
		</motion.button>
	);
};

export default Button;
