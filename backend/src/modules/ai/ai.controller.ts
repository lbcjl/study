import { Controller, Post, Body } from '@nestjs/common'
import { AiService } from './ai.service'

interface ChatRequestDto {
	messages: Array<{
		role: 'user' | 'assistant' | 'system'
		content: string
	}>
	temperature?: number
	maxTokens?: number
}

@Controller('ai')
export class AiController {
	constructor(private readonly aiService: AiService) {}

	@Post('chat')
	async chat(@Body() request: ChatRequestDto) {
		const systemPrompt = this.aiService.getTravelPlannerSystemPrompt()

		const messagesWithSystem = [
			{ role: 'system' as const, content: systemPrompt },
			...request.messages,
		]

		const response = await this.aiService.chat({
			messages: messagesWithSystem,
			temperature: request.temperature,
			maxTokens: request.maxTokens,
		})

		return {
			message: response,
			timestamp: new Date().toISOString(),
		}
	}
}
