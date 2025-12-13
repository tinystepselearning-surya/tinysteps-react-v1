/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	safelist: [
		{ pattern: /(bg|text|border|ring|from|to)-(primary|secondary|accent)-(50|100|500|600|700)/ },
		{ pattern: /(bg|text|border|from|to)-vibrancy-(orange|purple|pink)/ },
		{ pattern: /bg-gradient-(hero|card|text-primary|text-secondary|glow)/ },
		{ pattern: /animate-(fadeInUp|slideDown|scaleUp|shimmer|floatUp|pulse-glow)/ }
	],
	theme: {
		container: {
			center: true,
			padding: '1rem'
		},
		extend: {
			colors: {
				brand: '#2563eb',
				background: {
					DEFAULT: '#FAFBFC',
					light: '#FAFBFC',
					dark: '#0F172A'
				},
				foreground: {
					DEFAULT: '#0F172A',
					light: '#FAFBFC'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#0F172A'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#0F172A'
				},
				primary: {
					50: '#F0F9FF',
					100: '#E0F2FE',
					200: '#CDE9FF',
					500: '#0052CC',
					600: '#0041A3',
					700: '#003399',
					900: '#001F4F',
					DEFAULT: '#0052CC',
					foreground: '#F0F9FF'
				},
				secondary: {
					50: '#FEF2F2',
					500: '#FF6B6B',
					600: '#FF5252',
					DEFAULT: '#FF6B6B',
					foreground: '#FFFFFF'
				},
				accent: {
					50: '#F0FDF4',
					500: '#10B981',
					600: '#059669',
					DEFAULT: '#10B981',
					foreground: '#FFFFFF'
				},
				vibrancy: {
					orange: '#FF9500',
					purple: '#8B5CF6',
					pink: '#EC4899'
				},
                'tiny-blue': {
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    900: '#1E3A8A',
                },
                'tiny-green': {
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    500: '#10B981',
                    600: '#059669',
                },
                'tiny-orange': {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    500: '#F59E0B',
                    600: '#D97706',
                },
                'tiny-purple': {
                    50: '#FAF5FF',
                    100: '#F3E8FF',
                    500: '#A855F7',
                    600: '#9333EA',
                },
				muted: {
					DEFAULT: '#F1F5F9',
					foreground: '#64748B'
				},
				destructive: {
					DEFAULT: '#DC2626',
					foreground: '#FDF2F2'
				},
				border: '#E2E8F0',
				input: '#E2E8F0',
				ring: '#94A3B8'
			},
			backgroundImage: {
				'gradient-hero': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'gradient-card': 'linear-gradient(to bottom right, #EFF6FF, #FAF5FF)',
				'gradient-text-primary': 'linear-gradient(90deg, #0052CC, #8B5CF6)',
				'gradient-text-secondary': 'linear-gradient(90deg, #FF6B6B, #FF9500)',
				'gradient-glow': 'radial-gradient(circle, #FF6B6B, #0052CC)'
			},
			boxShadow: {
				'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
				'glow-orange': '0 0 20px rgba(245, 158, 11, 0.3)',
				'card-hover': '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
				'neumorphic': '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff',
			},
			keyframes: {
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideDown: {
					'0%': { opacity: '0', transform: 'translateY(-10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				scaleUp: {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				shimmer: {
					'0%': { backgroundPosition: '200% center' },
					'100%': { backgroundPosition: '-200% center' }
				},
				floatUp: {
					'0%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' },
					'100%': { transform: 'translateY(0px)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				}
			},
			animation: {
				fadeInUp: 'fadeInUp 0.6s ease-out forwards',
				slideDown: 'slideDown 0.5s ease-out forwards',
				scaleUp: 'scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
				shimmer: 'shimmer 2s linear infinite',
				floatUp: 'floatUp 4s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			},
			fontFamily: {
				heading: ['Poppins', 'sans-serif'],
				body: ['Inter', 'sans-serif'],
				mono: ['Fira Code', 'monospace']
			},
			spacing: {
				128: '32rem',
				144: '36rem',
				160: '40rem'
			},
			borderRadius: {
				lg: '1rem',
				md: '0.75rem',
				sm: '0.5rem'
			}
		}
	},
	plugins: [require('tailwindcss-animate')]
};
