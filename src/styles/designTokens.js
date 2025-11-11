/**
 * Centralized design tokens for gradients, motion, and color primitives.
 * Import from this module whenever you need consistent styling values.
 */
export const gradientPresets = {
	heroGradient: 'linear-gradient(135deg, #0052CC 0%, #FF6B6B 50%, #10B981 100%)',
	cardGradient: 'linear-gradient(to right, #E0F2FE 0%, #FEF2F2 100%)',
	textGradient: 'linear-gradient(90deg, #0052CC 0%, #8B5CF6 100%)',
	glowGradient: 'radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, rgba(0, 82, 204, 0.1) 100%)',
	vibrantGradient: 'linear-gradient(135deg, #FF6B6B, #FF9500, #10B981, #0052CC)'
};

export const animationTiming = {
	fast: '0.2s',
	smooth: '0.4s',
	standard: '0.6s',
	slow: '0.8s',
	verySlow: '1.2s'
};

export const easingFunctions = {
	smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
	bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	'ease-in-out': 'ease-in-out'
};

export const shadowPresets = {
	cardShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
	hoverShadow: '0 20px 40px rgba(0, 82, 204, 0.15)',
	glowShadow: '0 0 30px rgba(255, 107, 107, 0.2)'
};

export const colorPalette = {
	primary: '#0052CC',
	secondary: '#FF6B6B',
	accent: '#10B981',
	warning: '#FF9500',
	success: '#10B981',
	text: {
		primary: '#1F2937',
		secondary: '#6B7280',
		light: '#9CA3AF'
	}
};

export const designTokens = {
	gradients: gradientPresets,
	animationTiming,
	easing: easingFunctions,
	shadows: shadowPresets,
	colors: colorPalette
};
