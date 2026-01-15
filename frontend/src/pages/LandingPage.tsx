import { motion } from 'framer-motion'
import { Plane, Sparkles, MapPin } from 'lucide-react'

export default function LandingPage() {
	return (
		<div className='min-h-screen'>
			{/* Hero Section */}
			<section className='section-padding min-h-screen flex flex-col items-center justify-center relative overflow-hidden'>
				{/* 背景装饰 */}
				<div className='absolute inset-0 -z-10'>
					<div className='absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob'></div>
					<div className='absolute top-40 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000'></div>
					<div className='absolute bottom-20 left-1/2 w-72 h-72 bg-accent-yellow/30 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000'></div>
				</div>

				{/* 主标题 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='text-center max-w-4xl mx-auto'
				>
					<div className='flex items-center justify-center gap-2 mb-6'>
						<Plane className='w-12 h-12 text-primary-500' />
						<h1 className='text-6xl font-bold text-gradient'>TravelGenie</h1>
					</div>

					<p className='text-2xl text-neutral-600 mb-4'>
						AI 驱动的智能旅游规划助手 ✨
					</p>

					<p className='text-lg text-neutral-500 mb-12'>
						告诉我你想去哪儿，我来帮你规划完美行程
					</p>

					{/* 搜索框 */}
					<div className='max-w-2xl mx-auto'>
						<div className='flex flex-col gap-4'>
							<textarea
								placeholder='我想去杭州玩 3 天，预算 3000 元...'
								className='input-field text-lg resize-none'
								rows={4}
							/>
							<button className='btn-primary py-3 px-8 w-full text-lg'>
								开始规划
							</button>
						</div>
					</div>
				</motion.div>

				{/* 特性卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className='mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl'
				>
					<FeatureCard
						icon={<Sparkles className='w-8 h-8' />}
						title='AI 智能规划'
						description='通义千问驱动，秒懂你的需求'
					/>
					<FeatureCard
						icon={<MapPin className='w-8 h-8' />}
						title='路线可视化'
						description='地图展示，一目了然'
					/>
					<FeatureCard
						icon={<Plane className='w-8 h-8' />}
						title='费用透明'
						description='详细预算，清晰明了'
					/>
				</motion.div>
			</section>
		</div>
	)
}

interface FeatureCardProps {
	icon: React.ReactNode
	title: string
	description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
	return (
		<div className='bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-card card-hover-effect'>
			<div className='text-primary-500 mb-4'>{icon}</div>
			<h3 className='text-xl font-bold text-neutral-800 mb-2'>{title}</h3>
			<p className='text-neutral-600'>{description}</p>
		</div>
	)
}
