import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

export interface QwenMessage {
	role: 'system' | 'user' | 'assistant'
	content: string
}

export interface QwenResponse {
	output: {
		choices: Array<{
			finish_reason: string
			message: {
				content: string
				role: string
			}
		}>
	}
	usage: {
		input_tokens: number
		output_tokens: number
		total_tokens: number
	}
	request_id: string
}

@Injectable()
export class AIService {
	private readonly logger = new Logger(AIService.name)
	private readonly apiKey: string
	private readonly model: string
	private readonly apiUrl =
		'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
	private readonly client: AxiosInstance

	// 旅行规划助手的系统提示词
	private readonly systemPrompt = `你是一位专业的旅行规划师助手。你的任务是通过与用户的对话，收集以下信息：

1. **目的地**（国家/城市）
2. **出行时间**（起止日期或天数）
3. **旅行预算**（人民币总额）
4. **同行人数和类型**（独自/情侣/家庭/朋友）
5. **兴趣偏好**（自然风光/历史文化/美食/购物/冒险等）
6. **特殊需求**（住宿标准、交通方式、身体限制等）

## 对话阶段
在收集信息时，请保持友好、专业的口吻，每次只问1-2个问题，不要一次性问太多。

## 方案生成阶段
当你收集到足够的信息后（**至少有目的地、天数、预算**），请生成一份详细的旅行方案，**必须包括**：

### 📅 每日详细行程
为每一天提供：
- **日期/星期**
- **上午活动**（时间、地点、景点介绍、门票费用）
- **中午活动**
- **下午活动** 
- **傍晚活动**
- **每日主题**（如"历史文化日"、"自然风光日"）

### 🍽️ 每日美食推荐
为每一天提供：
- **早餐推荐**：具体餐厅名称、特色菜品、人均消费
- **午餐推荐**：具体餐厅名称、特色菜品、人均消费
- **晚餐推荐**：具体餐厅名称、特色菜品、人均消费
- **小吃/甜品**：当地特色街边美食

### 💰 每日预算明细
为每一天提供详细预算分配表格：

| 类别 | 项目 | 费用(元) |
|------|------|---------|
| 交通 | 地铁/公交/打车 | XX |
| 门票 | 景点A + 景点B | XX |
| 餐饮 | 早+午+晚 | XX |
| 其他 | 购物/小吃 | XX |
| **每日小计** | | **XXX** |

### 🏨 住宿建议
- 推荐区域（靠近哪些景点）
- 不同档次选择（经济型/舒适型/豪华型）
- 人均价格范围

### 🚗 交通指南
- 如何到达目的地（飞机/火车班次推荐）
- 市内交通方式（地铁卡/公交/出租车）
- 日均交通费用

### 💡 实用贴士
- 最佳旅游季节
- 注意事项
- 省钱小技巧
- 必备物品清单

## 重要要求：
1. **每日行程必须具体到时间段**（如 09:00-12:00）
2. **美食推荐必须包含具体餐厅名称**，不要只说"当地餐厅"
3. **预算必须细化到每一天**，并用表格展示
4. **总预算要与每日预算之和一致**
5. 使用清晰的 Markdown 格式，善用表格、列表和表情符号

请确保方案实用、可操作，预算合理且透明。`

	constructor(private configService: ConfigService) {
		// 支持新旧配置格式，实现向后兼容
		const apiKey =
			this.configService.get<string>('AI_API_KEY') ||
			this.configService.get<string>('QWEN_API_KEY')

		if (!apiKey) {
			throw new Error(
				'未配置 AI API Key，请在 .env 文件中设置 AI_API_KEY（或旧的 QWEN_API_KEY）',
			)
		}

		this.apiKey = apiKey
		this.model =
			this.configService.get<string>('AI_MODEL') ||
			this.configService.get<string>('QWEN_MODEL') ||
			'qwen-turbo'

		// 创建 Axios 实例
		this.client = axios.create({
			baseURL: this.apiUrl,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			timeout: 60000, // 60秒超时
		})

		this.logger.log(`🤖 AI 服务已初始化，模型: ${this.model}`)
	}

	async chat(messages: QwenMessage[]): Promise<string> {
		try {
			// 添加系统提示词
			const messagesWithSystem: QwenMessage[] = [
				{ role: 'system', content: this.systemPrompt },
				...messages,
			]

			const response = await this.client.post<QwenResponse>('', {
				model: this.model,
				input: {
					messages: messagesWithSystem,
				},
				parameters: {
					result_format: 'message',
					temperature: 0.7,
					top_p: 0.8,
					max_tokens: 2000,
				},
			})

			this.logger.debug(`API 完整响应: ${JSON.stringify(response.data)}`)

			// 通义千问使用 OpenAI 兼容格式
			const text = response.data?.output?.choices?.[0]?.message?.content
			if (!text) {
				this.logger.error(`API 响应格式异常: ${JSON.stringify(response.data)}`)
				throw new Error('API 响应格式异常，未找到文本内容')
			}

			this.logger.debug(`AI 回复: ${text.substring(0, 100)}...`)
			return text
		} catch (error) {
			this.logger.error('通义千问 API 调用失败', error)

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new Error('API Key 无效，请检查环境变量配置')
				}
				if (error.response?.status === 429) {
					throw new Error('API 调用频率超限，请稍后再试')
				}

				const errorMsg = error.response?.data?.message || error.message
				this.logger.error(
					`API 错误详情: ${JSON.stringify(error.response?.data)}`,
				)
				throw new Error(`API 调用失败: ${errorMsg}`)
			}

			throw error
		}
	}

	/**
	 * 流式调用（用于打字效果）
	 * 返回一个生成器，逐步生成文本
	 */
	async *chatStream(
		messages: QwenMessage[],
	): AsyncGenerator<string, void, unknown> {
		try {
			// 添加系统提示词
			const messagesWithSystem: QwenMessage[] = [
				{ role: 'system', content: this.systemPrompt },
				...messages,
			]

			const response = await this.client.post(
				'',
				{
					model: this.model,
					input: {
						messages: messagesWithSystem,
					},
					parameters: {
						result_format: 'message',
						incremental_output: true, // 启用增量输出
						temperature: 0.7,
						top_p: 0.8,
						max_tokens: 2000,
					},
				},
				{
					responseType: 'stream',
				},
			)

			// 处理流式响应
			const stream = response.data
			let buffer = ''

			for await (const chunk of stream) {
				buffer += chunk.toString()
				const lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (const line of lines) {
					if (line.startsWith('data:')) {
						const jsonStr = line.substring(5).trim()
						if (jsonStr && jsonStr !== '[DONE]') {
							try {
								const data = JSON.parse(jsonStr)
								const text = data.output?.text || ''
								if (text) {
									yield text
								}
							} catch (e) {
								// 解析失败，跳过
							}
						}
					}
				}
			}
		} catch (error) {
			this.logger.error('流式调用失败', error)
			throw error
		}
	}
}
