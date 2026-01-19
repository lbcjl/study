import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	HttpCode,
	HttpStatus,
	Logger,
	Res,
} from '@nestjs/common'
import { Response } from 'express'
import { ChatService } from './chat.service'
import { SendMessageDto } from './dto/send-message.dto'

@Controller('chat')
export class ChatController {
	private readonly logger = new Logger(ChatController.name)

	constructor(private readonly chatService: ChatService) {}

	/**
	 * 发送消息
	 * POST /api/chat/message
	 */
	/**
	 * 发送消息
	 * POST /api/chat/message
	 */
	@Post('message')
	@HttpCode(HttpStatus.OK)
	async sendMessage(@Body() dto: SendMessageDto) {
		this.logger.log(
			`收到消息: 会话=${dto.conversationId || '新会话'}, 内容="${dto.content.substring(0, 50)}..."`,
		)

		const result = await this.chatService.sendMessage(
			dto.conversationId || null,
			dto.content,
		)

		return {
			conversationId: result.conversation.id,
			message: result.assistantMessage,
			conversation: result.conversation,
		}
	}

	/**
	 * 发送消息 (流式响应)
	 * POST /api/chat/stream
	 */
	@Post('stream')
	async sendMessageStream(@Body() dto: SendMessageDto, @Res() res: Response) {
		this.logger.log(
			`收到流式请求: 会话=${dto.conversationId || '新会话'}, 内容="${dto.content.substring(0, 50)}..."`,
		)

		try {
			const { stream, conversationId, onComplete } =
				await this.chatService.sendMessageStream(
					dto.conversationId || null,
					dto.content,
				)

			// 设置响应头，告诉客户端这是一个流
			// 使用 text/plain 或 text/event-stream 都可以，这里简单起见用 text/plain 分块传输
			res.setHeader('Content-Type', 'text/plain; charset=utf-8')
			res.setHeader('Transfer-Encoding', 'chunked')
			res.setHeader('X-Conversation-Id', conversationId)

			let fullContent = ''

			for await (const chunk of stream) {
				res.write(chunk)
				fullContent += chunk
			}

			res.end()

			// 流结束后，保存完整消息
			await onComplete(fullContent)
		} catch (error) {
			this.logger.error('流式响应失败', error)
			res.status(500).end('Internal Server Error')
		}
	}

	/**
	 * 获取所有会话列表
	 * GET /api/chat/conversations
	 */
	@Get('conversations')
	async getConversations() {
		return this.chatService.getConversations()
	}

	/**
	 * 获取单个会话详情
	 * GET /api/chat/:id
	 */
	@Get(':id')
	async getConversation(@Param('id') id: string) {
		return this.chatService.getConversation(id)
	}

	/**
	 * 清空所有会话
	 * DELETE /api/chat/conversations
	 * 必须放在 :id 之前，否则会被 :id 路由拦截
	 */
	@Delete('conversations')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteAllConversations() {
		await this.chatService.clearAllConversations()
	}

	/**
	 * 删除会话
	 * DELETE /api/chat/:id
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteConversation(@Param('id') id: string) {
		await this.chatService.deleteConversation(id)
	}
}
