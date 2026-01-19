import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Conversation } from '../entities/conversation.entity'
import { Message } from '../entities/message.entity'
import { LangChainService, LangChainMessage } from './langchain.service'

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name)

	constructor(
		@InjectRepository(Conversation)
		private conversationRepo: Repository<Conversation>,
		@InjectRepository(Message)
		private messageRepo: Repository<Message>,
		private langChainService: LangChainService,
	) {}

	/**
	 * 发送消息并获取 AI 回复
	 */
	/**
	 * 发送消息并获取 AI 回复 (流式)
	 */
	async sendMessageStream(
		conversationId: string | null,
		userMessage: string,
		user: any = null,
	): Promise<{
		stream: AsyncGenerator<string>
		conversationId: string
		onComplete: (fullContent: string) => Promise<void>
	}> {
		let conversation: Conversation

		// 如果没有指定会话，创建新会话
		if (!conversationId) {
			conversation = this.conversationRepo.create({
				title: this.generateTitle(userMessage),
				messages: [],
				userId: user ? user.id : null,
			})
			await this.conversationRepo.save(conversation)
			this.logger.log(
				`创建新会话: ${conversation.id}, User: ${user ? user.email : 'Guest'}`,
			)
		} else {
			// 加载现有会话
			const foundConversation = await this.conversationRepo.findOne({
				where: { id: conversationId },
				relations: ['messages'],
			})

			if (!foundConversation) {
				throw new NotFoundException(`会话 ${conversationId} 不存在`)
			}
			conversation = foundConversation
		}

		// 保存用户消息
		const userMsg = this.messageRepo.create({
			conversationId: conversation.id,
			role: 'user',
			content: userMessage,
		})
		await this.messageRepo.save(userMsg)

		// 构建对话历史
		const history: LangChainMessage[] = conversation.messages.map((msg) => ({
			role: msg.role as 'user' | 'assistant' | 'system',
			content: msg.content,
		}))

		// 添加当前用户消息
		history.push({ role: 'user', content: userMessage })

		// 调用 LangChain 流式接口
		this.logger.log(`调用 LangChain Stream API，会话: ${conversation.id}`)
		const stream = this.langChainService.chatStream(history, user)

		return {
			stream,
			conversationId: conversation.id,
			onComplete: async (fullContent: string) => {
				// 保存 AI 回复
				const assistantMsg = this.messageRepo.create({
					conversationId: conversation.id,
					role: 'assistant',
					content: fullContent,
				})
				await this.messageRepo.save(assistantMsg)
				this.logger.log(
					`流式响应完成，已保存完整消息。长度: ${fullContent.length}`,
				)
			},
		}
	}

	/**
	 * 发送消息并获取 AI 回复 (普通模式 - 保留兼容)
	 */
	async sendMessage(
		conversationId: string | null,
		userMessage: string,
		user: any = null,
	): Promise<{ conversation: Conversation; assistantMessage: string }> {
		let conversation: Conversation

		// 如果没有指定会话，创建新会话
		if (!conversationId) {
			conversation = this.conversationRepo.create({
				title: this.generateTitle(userMessage),
				messages: [],
				userId: user ? user.id : null,
			})
			await this.conversationRepo.save(conversation)
			this.logger.log(
				`创建新会话: ${conversation.id}, User: ${user ? user.email : 'Guest'}`,
			)
		} else {
			// 加载现有会话
			const foundConversation = await this.conversationRepo.findOne({
				where: { id: conversationId },
				relations: ['messages'],
			})

			if (!foundConversation) {
				throw new NotFoundException(`会话 ${conversationId} 不存在`)
			}
			conversation = foundConversation
		}

		// 保存用户消息
		const userMsg = this.messageRepo.create({
			conversationId: conversation.id,
			role: 'user',
			content: userMessage,
		})
		await this.messageRepo.save(userMsg)

		// 构建对话历史
		const history: LangChainMessage[] = conversation.messages.map((msg) => ({
			role: msg.role as 'user' | 'assistant' | 'system',
			content: msg.content,
		}))

		// 添加当前用户消息
		history.push({ role: 'user', content: userMessage })

		// 调用 LangChain
		this.logger.log(`调用 LangChain API，会话: ${conversation.id}`)
		const assistantReply = await this.langChainService.chat(history, user)

		// 保存 AI 回复
		const assistantMsg = this.messageRepo.create({
			conversationId: conversation.id,
			role: 'assistant',
			content: assistantReply,
		})
		await this.messageRepo.save(assistantMsg)

		// 重新加载会话（包含最新消息）
		const updatedConversation = await this.conversationRepo.findOne({
			where: { id: conversation.id },
			relations: ['messages'],
		})

		return {
			conversation: updatedConversation!,
			assistantMessage: assistantReply,
		}
	}

	/**
	 * 获取所有会话列表
	 */
	/**
	 * 获取所有会话列表 (仅返回属于当前用户的会话)
	 */
	async getConversations(userId: string | null): Promise<Conversation[]> {
		// 如果是 Guest (userId null)，目前策略是看不到任何历史（或只能看到本地存储的 ids，这里后端简单返回空）
		// 或者后期可以支持根据 deviceId 查
		if (!userId) {
			return []
		}

		return this.conversationRepo.find({
			where: { userId },
			relations: ['messages'],
			order: { updatedAt: 'DESC' },
		})
	}

	/**
	 * 获取单个会话详情
	 */
	async getConversation(
		id: string,
		userId: string | null = null,
	): Promise<Conversation> {
		const conversation = await this.conversationRepo.findOne({
			where: { id },
			relations: ['messages'],
		})

		if (conversation && conversation.userId && conversation.userId !== userId) {
			throw new NotFoundException(`会话 ${id} 不存在或无权访问`)
		}

		if (!conversation) {
			throw new NotFoundException(`会话 ${id} 不存在`)
		}

		return conversation
	}

	/**
	 * 删除会话
	 */
	async deleteConversation(
		id: string,
		userId: string | null = null,
	): Promise<void> {
		// 先检查是否存在且归属
		const conversation = await this.conversationRepo.findOne({ where: { id } })
		if (!conversation) {
			throw new NotFoundException(`会话 ${id} 不存在`)
		}
		if (conversation.userId && conversation.userId !== userId) {
			throw new NotFoundException(`会话 ${id} 不存在或无权操作`)
		}

		const result = await this.conversationRepo.delete(id)
		if (result.affected === 0) {
			throw new NotFoundException(`会话 ${id} 不存在`)
		}
		this.logger.log(`删除会话: ${id}`)
	}

	/**
	 * 清空所有会话
	 */
	async clearAllConversations(): Promise<void> {
		await this.conversationRepo.clear()
		this.logger.log('已清空所有会话')
	}

	/**
	 * 根据用户消息生成会话标题
	 */
	private generateTitle(message: string): string {
		// 简单截取前30个字符作为标题
		const maxLength = 30
		if (message.length <= maxLength) {
			return message
		}
		return message.substring(0, maxLength) + '...'
	}
}
