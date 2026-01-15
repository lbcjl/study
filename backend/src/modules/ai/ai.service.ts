import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

interface ChatMessage {
	role: 'user' | 'assistant' | 'system'
	content: string
}

interface QwenChatRequest {
	messages: ChatMessage[]
	temperature?: number
	maxTokens?: number
}

@Injectable()
export class AiService {
	private readonly apiKey: string
	private readonly model: string
	private readonly baseUrl =
		'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

	constructor(private configService: ConfigService) {
		this.apiKey = this.configService.get<string>('QWEN_API_KEY')
		this.model = this.configService.get<string>('QWEN_MODEL') || 'qwen-max'
	}

	/**
	 * 调用通义千问 API 进行对话
	 */
	async chat(request: QwenChatRequest): Promise<string> {
		try {
			const response = await axios.post(
				this.baseUrl,
				{
					model: this.model,
					input: {
						messages: request.messages,
					},
					parameters: {
						temperature: request.temperature || 0.7,
						max_tokens: request.maxTokens || 2000,
						result_format: 'message',
					},
				},
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			)

			return response.data.output.choices[0].message.content
		} catch (error) {
			console.error('Qwen API Error:', error)
			throw new Error('AI service unavailable')
		}
	}

	/**
	 * 生成旅游规划的系统提示词
	 */
	getTravelPlannerSystemPrompt(): string {
		return `你是一位专业的旅游规划师，擅长根据用户需求定制个性化旅行方案。

职责：
1. 理解用户的目的地、预算、天数、兴趣偏好
2. 生成合理的每日行程（含时间、景点、餐饮、交通）
3. 推荐性价比高的酒店和特色美食
4. 回复要清晰、友好，使用 Emoji 增强可读性

输出格式：使用 JSON 格式，便于前端解析
{
  "destination": "城市名称",
  "days": 3,
  "dailyItinerary": [
    {
      "day": 1,
      "date": "2024-03-10",
      "activities": [
        {
          "time": "09:00-11:00",
          "type": "attraction",
          "name": "景点名称",
          "description": "简要描述",
          "cost": 0
        }
      ]
    }
  ],
  "estimatedBudget": {
    "transportation": 800,
    "accommodation": 900,
    "food": 900,
    "tickets": 300,
    "total": 2900
  }
}`
	}
}
