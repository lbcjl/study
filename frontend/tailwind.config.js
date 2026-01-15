/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// 主色调 - 清新旅行风
				primary: {
					50: '#E6F9F7',
					100: '#B3EDE7',
					200: '#80E1D7',
					300: '#4DD5C7',
					400: '#33CFBF',
					500: '#4ECDC4', // 薄荷绿
					600: '#3DB9B0',
					700: '#2C9B93',
					800: '#1B7D76',
					900: '#0A5F59',
				},
				secondary: {
					400: '#6BCFE1',
					500: '#45B7D1', // 天空蓝
					600: '#3A9AB3',
				},
				accent: {
					yellow: '#FFE66D', // 淡黄 (强调按钮)
					coral: '#FF6B6B', // 珊瑚粉 (警告提示)
				},
				// 中性色
				neutral: {
					50: '#F7F9FC', // 背景白
					100: '#E8F4F8', // 淡蓝背景
					200: '#D1E4EB',
					300: '#B0D1DC',
					700: '#2C3E50', // 深灰文字
					800: '#1A2632',
					900: '#0F1419',
				},
			},
			fontFamily: {
				sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
				display: ['Poppins', 'Source Han Sans', 'sans-serif'],
			},
			boxShadow: {
				card: '0 4px 20px rgba(78, 205, 196, 0.15)',
				'card-hover': '0 8px 30px rgba(78, 205, 196, 0.25)',
				soft: '0 2px 10px rgba(0, 0, 0, 0.05)',
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.4s ease-out',
				typing: 'typing 2s steps(40) 1s infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				typing: {
					from: { width: '0' },
					to: { width: '100%' },
				},
			},
		},
	},
	plugins: [],
}
