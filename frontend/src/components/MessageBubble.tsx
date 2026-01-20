import type { Message } from '../types'
import './MessageBubble.css'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ItinerarySummaryCard from './ItinerarySummaryCard'
import CompactItineraryView from './CompactItineraryView'
import QuestionCard from './QuestionCard'
import Avatar from './Avatar'

interface MessageBubbleProps {
	message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === 'user'
	const isAssistant = message.role === 'assistant'

	// 检测是否为旅行计划消息（支持 Markdown 表格 或 JSON 格式）
	const isTravelPlan =
		isAssistant &&
		typeof message.content === 'string' &&
		(message.content.includes('## 📅 每日详细行程') ||
			message.content.includes('| 序号 |') ||
			(message.content.includes('"type": "plan"') &&
				message.content.includes('"itinerary":')))

	// JSON Plan 渲染逻辑：如果是 JSON，我们可能不显示原始 JSON，而是显示 SummaryCard + 提示
	// 或者，如果 ItinerarySummaryCard 支持 JSON，直接传进去。
	// 目前 ItinerarySummaryCard 使用 parseMarkdownTable，暂时不支持 JSON。
	// 但如果不显示 raw content，用户看不到东西。
	// 临时策略：如果是 JSON plan，尝试渲染 SummaryCard（需要后续升级 SummaryCard），
	// 同时也可以渲染 Markdown（如果是混合的）。
	// 针对纯 JSON 输出，我们可能需要一个专门的 Renderer。
	// 但根据之前的逻辑，MessageBubble 主要负责显示气泡。

	// 为了兼容性，如果是 JSON plan，我们暂时显示 SummaryCard (它可能显示空)，
	// 并且显示特定的文本提示，而不是展示一大坨 JSON 源码。
	const isJsonPlan = isTravelPlan && message.content.trim().startsWith('{')

	// Parsing Logic for JSON Question
	let displayContent: any = message.content
	try {
		if (
			!isTravelPlan &&
			typeof message.content === 'string' &&
			message.content.trim().startsWith('{')
		) {
			const parsed = JSON.parse(message.content)
			if (parsed.type === 'question') {
				// Support both new structured format and legacy string format
				if (parsed.questions && Array.isArray(parsed.questions)) {
					displayContent = {
						intro: parsed.message || parsed.content,
						questions: parsed.questions,
					}
				} else if (parsed.content) {
					displayContent = {
						intro: parsed.content,
						questions: [],
					}
				}
			}
		}
	} catch (e) {
		// Ignore parsing errors, treat as raw text
	}

	return (
		<div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
			{/* AI 头像 (左侧) */}
			{!isUser && (
				<div className='avatar ai-avatar'>
					<Avatar name='AI' size='sm' />
				</div>
			)}

			<div className='message-content-wrapper'>
				<div className='message-content'>
					{/* Loading State */}
					{!message.content && (
						<div className='typing-dots-inline'>
							<span></span>
							<span></span>
							<span></span>
						</div>
					)}

					{/* Main Text Content */}
					{message.content && (
						<div className='message-text'>
							<div className='markdown-body'>
								{isJsonPlan ? (
									<CompactItineraryView content={message.content} />
								) : isAssistant &&
								  displayContent !== message.content && // Extracted from JSON
								  !isTravelPlan ? (
									<QuestionCard data={displayContent} />
								) : (
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{displayContent}
									</ReactMarkdown>
								)}
							</div>
						</div>
					)}
				</div>

				<div className='message-time'>{formatTime(message.createdAt)}</div>
			</div>

			{/* User 头像 (右侧) */}
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
