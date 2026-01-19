import axios from 'axios'
import type { Conversation } from '../types'

const api = axios.create({
	baseURL: '/api',
	headers: {
		'Content-Type': 'application/json',
	},
})

export interface SendMessageRequest {
	conversationId?: string
	content: string
}

export interface SendMessageResponse {
	conversationId: string
	message: string
	conversation: Conversation
}

export const chatApi = {
	// 发送消息
	async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
		const response = await api.post<SendMessageResponse>('/chat/message', data)
		return response.data
	},

	// 发送消息 (流式)
	async sendMessageStream(
		data: SendMessageRequest,
		onChunk: (chunk: string) => void,
	): Promise<SendMessageResponse> {
		const response = await fetch('/api/chat/stream', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})

		if (!response.ok) {
			throw new Error(`Stream request failed: ${response.statusText}`)
		}

		const reader = response.body?.getReader()
		const decoder = new TextDecoder()
		let fullContent = ''
		const conversationId = response.headers.get('X-Conversation-Id') || ''

		if (!reader) {
			throw new Error('Response body is null')
		}

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			const chunk = decoder.decode(value, { stream: true })
			fullContent += chunk
			onChunk(chunk)
		}

		// 返回模拟的完整响应结构
		return {
			conversationId: conversationId,
			message: fullContent,
			conversation: {
				id: conversationId,
				title: '', // 暂时无法获取最新标题，需后续刷新
				messages: [], // 暂时无法获取完整历史
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		}
	},

	// 获取所有会话
	async getConversations(): Promise<Conversation[]> {
		const response = await api.get<Conversation[]>('/chat/conversations')
		return response.data
	},

	// 获取单个会话
	async getConversation(id: string): Promise<Conversation> {
		const response = await api.get<Conversation>(`/chat/${id}`)
		return response.data
	},

	// 删除会话
	async deleteConversation(id: string): Promise<void> {
		await api.delete(`/chat/${id}`)
	},

	// 清空所有会话
	async deleteAllConversations(): Promise<void> {
		await api.delete('/chat/conversations')
	},
}
