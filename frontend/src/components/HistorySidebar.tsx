import React, { useEffect, useState } from 'react'
import { chatApi } from '../services/api'
import { Conversation } from '../types'
import ConfirmModal from './ConfirmModal'
import './HistorySidebar.css'

interface HistorySidebarProps {
	currentConversationId?: string
	onSelectConversation: (conversation: Conversation) => void
	onNewChat: () => void
	isOpen: boolean
	onClose: () => void
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
	currentConversationId,
	onSelectConversation,
	onNewChat,
	isOpen,
	onClose,
}) => {
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [loading, setLoading] = useState(false)

	const fetchConversations = async () => {
		try {
			setLoading(true)
			const data = await chatApi.getConversations()
			setConversations(data)
		} catch (error) {
			console.error('Failed to fetch history:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (isOpen) {
			fetchConversations()
		}
	}, [isOpen, currentConversationId]) // Refresh when opening or ID changes (new chat created)

	// Delete modal state
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
	const [isConfirmingClear, setIsConfirmingClear] = useState(false)

	const confirmDelete = async () => {
		if (deleteTargetId) {
			// Single deletion
			try {
				await chatApi.deleteConversation(deleteTargetId)
				await fetchConversations()
				if (currentConversationId === deleteTargetId) {
					onNewChat()
				}
			} catch (error) {
				console.error('Delete failed:', error)
			} finally {
				setDeleteTargetId(null)
			}
		} else if (isConfirmingClear) {
			// Clear all
			try {
				await chatApi.deleteAllConversations()
				await fetchConversations()
				onNewChat() // Always reset
			} catch (error) {
				console.error('Clear all failed:', error)
			} finally {
				setIsConfirmingClear(false)
			}
		}
	}

	const handleDeleteClick = (e: React.MouseEvent, id: string) => {
		e.stopPropagation()
		setDeleteTargetId(id)
	}

	// Modal Config
	const modalConfig = isConfirmingClear
		? {
				isOpen: true,
				title: '清空所有记录',
				message: '您确定要删除所有对话记录吗？此操作极其危险且无法撤销！',
				confirmText: '全部清空',
				onCancel: () => setIsConfirmingClear(false),
			}
		: {
				isOpen: !!deleteTargetId,
				title: '删除对话',
				message: '确定要删除这条对话记录吗？此操作无法撤销。',
				confirmText: '删除',
				onCancel: () => setDeleteTargetId(null),
			}

	return (
		<>
			{/* Overlay for mobile */}
			<div
				className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
				onClick={onClose}
			/>

			<ConfirmModal
				isOpen={modalConfig.isOpen}
				title={modalConfig.title}
				message={modalConfig.message}
				confirmText={modalConfig.confirmText}
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={modalConfig.onCancel}
			/>

			<div className={`history-sidebar ${isOpen ? 'open' : ''}`}>
				<div className='sidebar-header'>
					<button className='new-chat-btn' onClick={onNewChat}>
						<span className='icon'>+</span> 开启新旅程
					</button>
					<button className='close-sidebar-btn' onClick={onClose}>
						×
					</button>
				</div>

				<div className='sidebar-content'>
					{loading ? (
						<div className='sidebar-loading'>加载中...</div>
					) : conversations.length === 0 ? (
						<div className='empty-history'>暂无历史记录</div>
					) : (
						<ul className='history-list'>
							{conversations.map((conv) => (
								<li
									key={conv.id}
									className={`history-item ${
										currentConversationId === conv.id ? 'active' : ''
									}`}
									onClick={() => {
										onSelectConversation(conv)
										if (window.innerWidth < 768) onClose()
									}}
								>
									<div className='history-title'>
										{conv.title || '未命名会话'}
									</div>
									<div className='history-meta'>
										<span className='history-date'>
											{new Date(conv.updatedAt).toLocaleDateString()}
										</span>
										<button
											className='delete-btn'
											onClick={(e) => handleDeleteClick(e, conv.id)}
											title='删除'
										>
											🗑️
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				{conversations.length > 0 && (
					<div className='sidebar-footer'>
						<button
							className='clear-all-btn'
							onClick={() => setIsConfirmingClear(true)}
						>
							<span className='icon'>🗑️</span> 清空所有记录
						</button>
					</div>
				)}
			</div>
		</>
	)
}
