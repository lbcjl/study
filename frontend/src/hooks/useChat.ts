import { useState } from 'react'
import type { Conversation, Message } from '../types'
import { chatApi } from '../services/api'

export function useChat() {
	const [conversation, setConversation] = useState<Conversation | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const sendMessage = async (content: string) => {
		setIsLoading(true)
		setError(null)

		// 1. 乐观更新：立即显示用户消息
		const tempUserMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content,
			conversationId: conversation?.id || 'temp',
			createdAt: new Date(),
		}

		// 更新 UI，暂时只显示用户消息
		setConversation((prev) => {
			if (!prev) {
				// 新会话：创建临时会话
				return {
					id: 'temp',
					title: '新会话',
					messages: [tempUserMessage],
					createdAt: new Date(),
					updatedAt: new Date(),
				}
			}
			return {
				...prev,
				messages: [...prev.messages, tempUserMessage],
			}
		})

		try {
			console.log('--- Debug Request ---', {
				conversationId: conversation?.id,
				content,
			})

			// 2. 发送非流式请求（LoadingModal 显示加载状态）
			const response = await chatApi.sendMessage({
				conversationId: conversation?.id,
				content,
			})

			console.log('--- Debug AI Response ---', response.message)

			// 3. 收到完整响应后，更新会话
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: response.message,
				conversationId: response.conversationId,
				createdAt: new Date(),
			}

			setConversation({
				id: response.conversationId,
				title: response.conversation.title || conversation?.title || '新会话',
				messages: [
					...(conversation?.messages || [tempUserMessage]),
					tempUserMessage,
					assistantMessage,
				].filter(
					(msg, index, arr) =>
						// 去重：过滤掉临时用户消息的重复
						arr.findIndex(
							(m) => m.content === msg.content && m.role === msg.role,
						) === index,
				),
				createdAt: response.conversation.createdAt,
				updatedAt: response.conversation.updatedAt,
			})

			return response.message
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '发送消息失败'
			setError(errorMessage)

			// 发生错误时，移除用户消息
			setConversation((prev) => {
				if (!prev) return null
				return {
					...prev,
					messages: prev.messages.filter((m) => m.id !== tempUserMessage.id),
				}
			})

			throw err
		} finally {
			setIsLoading(false)
		}
	}

	const startNewConversation = () => {
		setConversation(null)
		setError(null)
	}

	const loadConversation = async (id: string) => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await chatApi.getConversation(id)
			setConversation(data)
		} catch (err) {
			setError('无法加载会话记录')
			console.error(err)
		} finally {
			setIsLoading(false)
		}
	}

	return {
		conversation,
		isLoading,
		error,
		sendMessage,
		startNewConversation,
		loadConversation,
	}
}
