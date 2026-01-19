import { useEffect, useRef, useState, useMemo } from 'react'
import { useChat } from '../hooks/useChat'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import MessageBubble from './MessageBubble'
import InputBox from './InputBox'
import Toast from './Toast'
import ItineraryPanel from './ItineraryPanel'
import LoadingModal from './LoadingModal'
import { HistorySidebar } from './HistorySidebar'
import './ChatInterface.css'

export default function ChatInterface() {
	const { user } = useAuth()
	const {
		conversation,
		isLoading,
		error,
		sendMessage,
		startNewConversation,
		loadConversation,
	} = useChat()
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const [showToast, setShowToast] = useState(false)

	// 自动滚动到底部
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [conversation?.messages])

	// 错误提示 - 显示toast
	useEffect(() => {
		if (error) {
			setShowToast(true)
		}
	}, [error])

	// 提取最新的行程内容（来自最后一条 AI 消息）
	const latestItineraryContent = useMemo(() => {
		if (!conversation) return ''
		// 倒序查找最后一条包含表格的 Assistant 消息
		const lastAiMsg = [...conversation.messages]
			.reverse()
			.find(
				(m) =>
					m.role === 'assistant' &&
					(m.content.includes('| 序号 |') || m.content.includes('|--')),
			)
		return lastAiMsg ? lastAiMsg.content : ''
	}, [conversation])

	const handleSendMessage = async (content: string) => {
		try {
			await sendMessage(content)
		} catch (err) {
			console.error('发送消息失败:', err)
		}
	}

	// Mobile View Toggle
	const [activeTab, setActiveTab] = useState<'chat' | 'itinerary'>('chat')

	// 当有新行程生成时，自动切换到行程 Tab (仅在移动端有效)
	useEffect(() => {
		// 如果有内容，且在移动端，且当前还在聊天Tab，且不在加载中(或者流式传输刚开始)
		// 为了体验更好，我们在内容长度变化较大时跳转，这里简单处理：只要有新内容且当前是chat就跳
		// 增加一个简单的防抖或锁，防止用户切回chat后又被强制切走
		// 暂定策略：只要检测到有效行程内容且当前是移动端，就切过去。
		if (latestItineraryContent && window.innerWidth <= 768) {
			// 只有当用户确实在等待新方案时才跳转比较合理，但这里简单实现用户需求：
			// "生成计划之后，会自动跳转"
			setActiveTab('itinerary')
		}
	}, [latestItineraryContent])

	// Sidebar State
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	// Close sidebar when conversation loads (on mobile useful)
	useEffect(() => {
		if (window.innerWidth < 768) {
			setIsSidebarOpen(false)
		}
	}, [conversation?.id])

	return (
		<div className='chat-layout'>
			<LoadingModal isOpen={isLoading} />

			<HistorySidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				onSelectConversation={(conv) => loadConversation(conv.id)}
				onNewChat={() => {
					startNewConversation()
					setIsSidebarOpen(false)
				}}
				currentConversationId={conversation?.id}
			/>

			{/* Left Panel: Glassmorphism Chat Area */}
			<div
				className={`chat-container ${activeTab === 'chat' ? 'mobile-active' : 'mobile-hidden'}`}
			>
				<header className='chat-header'>
					<div className='flex items-center gap-3'>
						<button
							className='menu-btn'
							onClick={() => setIsSidebarOpen(true)}
							title='历史记录'
						>
							<svg
								width='20'
								height='20'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<line x1='3' y1='12' x2='21' y2='12'></line>
								<line x1='3' y1='6' x2='21' y2='6'></line>
								<line x1='3' y1='18' x2='21' y2='18'></line>
							</svg>
						</button>
						<div className='text-2xl'>✈️</div>
						{/* <div>
							<h1>智能旅游规划</h1>
							<p className='text-sm text-muted'>AI Travel Companion</p>
						</div> */}
					</div>
					<div className='flex items-center gap-2'>
						{conversation && (
							<button onClick={startNewConversation} className='new-chat-btn'>
								<span className='text-lg'>+</span>{' '}
								<span className='btn-text'>新对话</span>
							</button>
						)}
						{user ? (
							<Link to='/profile' style={{ textDecoration: 'none' }}>
								<div className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'>
									{/* <span className='text-sm font-medium text-slate-600 hidden md:block'>
										{user.nickname}
									</span> */}
									<Avatar name={user.nickname} size='md' />
								</div>
							</Link>
						) : (
							<Link to='/login' className='profile-btn glass-btn' title='登录'>
								登录
							</Link>
						)}
					</div>
				</header>

				<div className='messages-area'>
					{!conversation ? (
						<div className='flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-fade-in'>
							<div className='text-6xl mb-6 animate-slide-up'>🌍</div>
							<h2 className='mb-2'>开启您的梦幻旅程</h2>
							<p className='text-muted mb-8 max-w-md'>
								告诉我您的目的地、时间和预算，为您生成包含真实景点、美食和酒店的完美行程。
							</p>
							<div className='flex flex-wrap justify-center gap-3'>
								<button
									onClick={() => handleSendMessage('我想去日本京都旅游5天')}
									className='btn btn-secondary glass-card px-6 py-3 hover:bg-white'
								>
									🌸 京都赏樱 5日游
								</button>
								<button
									onClick={() =>
										handleSendMessage('帮我规划上海周末游，预算3000元')
									}
									className='btn btn-secondary glass-card px-6 py-3 hover:bg-white'
								>
									🏙️ 上海周末 Citywalk
								</button>
							</div>
						</div>
					) : (
						<>
							{conversation.messages.map((message) => (
								<MessageBubble key={message.id} message={message} />
							))}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				<div className='input-area'>
					<InputBox
						onSend={handleSendMessage}
						disabled={isLoading}
						placeholder={
							conversation ? '继续规划您的行程...' : '例如：下周去三亚玩4天...'
						}
					/>
					{/* Re-plan Quick Action */}
				</div>
			</div>

			{/* Right Panel: Map & Itinerary */}
			<div
				className={`map-panel ${activeTab === 'itinerary' ? 'mobile-active' : 'mobile-hidden'}`}
			>
				<ItineraryPanel
					content={latestItineraryContent}
					loading={isLoading && !latestItineraryContent}
				/>
			</div>

			{/* Mobile Bottom Navigation */}
			<div className='bottom-nav'>
				<div
					className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
					onClick={() => setActiveTab('chat')}
				>
					<span className='nav-icon'>💬</span>
					<span>对话</span>
				</div>
				<div
					className={`nav-item ${activeTab === 'itinerary' ? 'active' : ''}`}
					onClick={() => setActiveTab('itinerary')}
				>
					<span className='nav-icon'>🗺️</span>
					<span>行程</span>
				</div>
			</div>

			{/* Toast Notification */}
			{showToast && error && (
				<Toast
					message={error}
					type='error'
					onClose={() => setShowToast(false)}
				/>
			)}
		</div>
	)
}
