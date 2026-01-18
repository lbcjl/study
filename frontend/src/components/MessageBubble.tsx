import type { Message } from '../types'
import './MessageBubble.css'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TravelPlanCard from './TravelPlanCard'

interface MessageBubbleProps {
	message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === 'user'
	const isAssistant = message.role === 'assistant'

	// 检测是否为旅行计划消息（包含行程表格或关键词）
	const isTravelPlan =
		isAssistant &&
		(message.content.includes('## 📅 每日详细行程') ||
			message.content.includes('第1天') ||
			(message.content.includes('|') && message.content.includes('景点')))

	return (
		<div className={`message-bubble ${message.role}`}>
			{isAssistant && (
				<div className='avatar ai-avatar'>
					<svg
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
					>
						<path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
					</svg>
				</div>
			)}

			<div className='message-content'>
				<div className='message-text'>
					{/* 对于旅行计划使用卡片展示，其他消息使用 Markdown */}
					{message.content ? (
						isTravelPlan ? (
							<TravelPlanCard content={message.content} />
						) : (
							<div className='markdown-body'>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{message.content}
								</ReactMarkdown>
							</div>
						)
					) : (
						<div className='typing-dots-inline'>
							<span></span>
							<span></span>
							<span></span>
						</div>
					)}
				</div>

				{/* 地图已移动到右侧面板，此处不再显示 */}

				<div className='message-time'>{formatTime(message.createdAt)}</div>
			</div>

			{isUser && (
				<div className='avatar user-avatar'>
					<svg
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
					>
						<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' />
					</svg>
				</div>
			)}
		</div>
	)
}

function formatTime(timestamp: Date): string {
	const date = new Date(timestamp)
	const now = new Date()
	const diff = now.getTime() - date.getTime()

	// 小于1分钟
	if (diff < 60000) {
		return '刚刚'
	}

	// 小于1小时
	if (diff < 3600000) {
		const minutes = Math.floor(diff / 60000)
		return `${minutes}分钟前`
	}

	// 今天
	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString('zh-CN', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// 其他
	return date.toLocaleString('zh-CN', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}
