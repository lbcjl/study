import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
	ToolMessage,
} from '@langchain/core/messages'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { WeatherService } from './weather.service'
import { GaodeService } from './gaode.service'
import { TrainService } from './train.service'

import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search'

export interface LangChainMessage {
	role: 'system' | 'user' | 'assistant'
	content: string
}

@Injectable()
export class LangChainService {
	private readonly logger = new Logger(LangChainService.name)
	private readonly chatModel: ChatOpenAI

	// 旅行规划助手的系统提示词
	private readonly systemPrompt = `你是一位专业的旅行规划师助手。你的任务是通过与用户的对话，收集信息并规划行程。

## 🎯 必填信息收集
在开始生成方案前，你**必须**确认以下信息（如果用户没提供，请追问）：
1. **出发地**（⚠️ 检查下方【用户个性化偏好】中的“常居城市”。如有，直接默认作为出发地，**严禁再次询问**，除非用户明确说从别的地方出发）
2. **目的地**（国家/城市，支持多个城市，如“上海和苏州”）
3. **出行时间**（起止日期或天数）
4. **旅行预算**（人民币总额）

## ⛅ 实时天气参考
{weather_info}

{search_info}

## 📍 真实地点参考数据 (来自高德地图) - ⚠️ 重要约束
{poi_info}


## 🚨 强制要求：
- **关于火车/高铁票 (CRITICAL)**：必须使用 \`search_train_tickets\` 工具查询真实车次。**严禁编造**车次（如 G123）或价格。如果工具查询失败或无票，请明确告知用户无直达车次，建议中转，绝对不要生成虚假数据。
- **所有推荐地点（景点、餐厅、酒店）必须优先且仅从上方【真实数据参考】中选择**
- **天气数据**：必须严格使用提供的【实时天气参考】。
- **跨城市规划**：如果用户请求跨城市旅行（如北京到上海），请按时间顺序合理安排行程。
- **路线合理性 (关键)**：相邻地点之间的交通时间**不应超过 1 小时**。请合理安排游玩顺序，避免东奔西跑和来回绕路。
- **禁止推荐非行程相关城市的地点**（例如行程只有北京，不要推荐上海的地点）。
- **预算合理性检查**：核对预算与真实价格。
- **交通信息地址格式 (重要)**：
  - 对于 \`type: "transport"\`，\`address\` 请只填目标站点（如“南京南站”或“浦东机场T2”），**不要**填写“A站 -> B站”这种格式，否则地图无法定位。

## 🗣️ 语气与风格
请保持 **热情、专业且令人向往** 的语气。

## 🚫 话题限制 (关键)
你是一位**专职**的旅行规划师，**仅**回答与旅行相关的问题。
- **如果用户咨询无关话题**，**必须**礼貌拒绝。

## 📝 输出格式要求 (CRITICAL: JSON ONLY)
**严禁输出 Markdown 或纯文本! 必须且只能输出严格合法的 JSON 格式。**
如果正在收集信息阶段，请输出 \`type: "question"\`。
如果已经收集完信息并生成方案，请输出 \`type: "plan"\`。

### JSON Schema 定义

#### 1. 提问/对话模式 (当信息不全时)
\`\`\`json
{
  "type": "question",
  "content": "这里写你回复用户的自然语言内容，比如追问预算或时间..."
}
\`\`\`

#### 2. 方案生成模式 (当信息齐全时)
\`\`\`json
{
  "type": "plan",
  "itinerary": {
    "city": "主要目的地城市",
    "days": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "weather": "Sunny 25°C",
        "dailyCost": 500,
        "description": "这一天的主题或简介...",
        "schedule": [
          {
            "time": "09:00",
            "type": "attraction", // attraction | restaurant | hotel | transport
            "name": "地点名称",
            "address": "城市+区+街道+门牌号",
            "duration": "120分钟",
            "cost": "¥50",
            "description": "详细介绍...",
            "highlights": ["亮点1", "亮点2"],
            "food": ["推荐菜1"],
            "transportation": {
              "method": "步行/地铁/打车",
              "duration": "15分钟",
              "cost": "¥5"
            }
          },
          // 交通类型示例（往返交通必须包含）
          {
            "time": "08:00",
            "type": "transport",
            "name": "北京南 → 上海虹桥", // name 可以写路线
            "address": "上海虹桥",        // <--- ⚠️ address 只写具体的一个站点名，以便地图定位
            "duration": "5小时30分",
            "cost": "¥553",
            "description": "高铁直达，舒适快捷",
            "trainNumber": "G123",      // 火车/高铁车次
            "flightNumber": "",         // 航班号（如CZ3456）
            "departureTime": "08:00",
            "arrivalTime": "13:30"
          }
        ],
        "tips": ["避坑指南1", "注意事项2"]
      }
    ],
    "totalBudget": "¥2000",
    "summary": "行程总览的简短描述..."
  }
}
\`\`\`

IMPORTANT: 
- 不要包含 markdown 代码块标记 (\`\`\`json)，直接输出 JSON 字符串。
- 确保 JSON 格式合法。
- 使用 \`calculator\` 工具计算总价。
`

	constructor(
		private configService: ConfigService,
		private weatherService: WeatherService,
		private gaodeService: GaodeService,
		private trainService: TrainService, // Inject TrainService
	) {
		// 支持新旧配置格式，实现向后兼容
		// 优先使用新的通用配置 AI_API_KEY, 如果不存在则回退到 QWEN_API_KEY
		const apiKey =
			this.configService.get<string>('AI_API_KEY') ||
			this.configService.get<string>('QWEN_API_KEY')

		// 读取模型配置（新配置优先）
		const modelName =
			this.configService.get<string>('AI_MODEL') ||
			this.configService.get<string>('QWEN_MODEL') ||
			'qwen-plus' // Changed default model

		// 读取API端点配置（新配置优先）
		const baseURL =
			this.configService.get<string>('AI_BASE_URL') ||
			'https://dashscope.aliyuncs.com/compatible-mode/v1' // 默认通义千问

		if (!apiKey) {
			this.logger.error(
				'未配置 AI_API_KEY (或旧配置 QWEN_API_KEY)。AI 功能将无法使用。',
			)
		}

		// 初始化 ChatOpenAI
		this.chatModel = new ChatOpenAI({
			apiKey: apiKey, // Use 'apiKey' which is passed directly to OpenAI client
			modelName: modelName,
			configuration: {
				baseURL: baseURL,
			},
			temperature: 0.7, // Hardcoded as per user's instruction
			streaming: true,
		})

		this.logger.log(
			`🧠 LangChain 服务已初始化 | 模型: ${modelName} | 端点: ${baseURL}`,
		)
		// Trigger recompile check
	}

	/**
	 * 使用 LangChain 调用通义千问 API (流式响应)
	 */
	async *chatStream(
		messages: LangChainMessage[],
		user?: any,
		timezone: string = 'Asia/Shanghai',
	): AsyncGenerator<string> {
		try {
			// 0. 构建用户偏好上下文
			this.logger.debug('[ChatStream] User Context: ' + JSON.stringify(user))
			let userContextPrompt = ''
			if (user && user.preferences) {
				const p = user.preferences
				const parts: string[] = []
				if (p.nickname) parts.push('用户昵称: ' + p.nickname)
				if (p.homeCity) parts.push('常居城市: ' + p.homeCity)
				if (p.budgetRange && p.budgetRange !== '不限')
					parts.push('预算偏好: ' + p.budgetRange)
				if (p.travelStyle) parts.push('旅行风格: ' + p.travelStyle)
				if (p.dietary && p.dietary.length > 0)
					parts.push('饮食偏好: ' + p.dietary.join(', '))
				if (p.interests && p.interests.length > 0)
					parts.push('兴趣标签: ' + p.interests.join(', '))

				if (parts.length > 0) {
					userContextPrompt =
						'\n## 👤 用户个性化偏好 (请严格遵守)\n' +
						parts.join('\n') +
						'\n请在生成方案时特别关照上述偏好。例如：如果用户不吃辣，请避免推荐川湘菜；如果用户喜欢自然风光，请多安排户外景点。'
				}
			}

			// 1. 简单的意图识别：提取目的地以获取天气和POI
			const reversedMessages = messages.slice().reverse()

			// 找到最近一条包含用户的消息（用于日志显示）
			const lastUserMessage = reversedMessages.find(
				(m) => m.role === 'user',
			)?.content

			let weatherInfo = ''
			let poiInfo = ''
			let city: string | null = null // 目的地
			let origin: string | null = null // 出发地
			let budget: string | null = null // 预算

			// 遍历历史消息寻找目的地上下文
			for (const msg of reversedMessages) {
				if (msg.role === 'user') {
					// 1. 提取目的地
					if (!city) {
						const destMatch = msg.content.match(
							/(?:去|到|玩|游览|前往)([^\s，,。、]{2,5}?)(?:玩|旅游|旅行|游|自由行)?/,
						)
						if (destMatch) {
							const potentialCity = destMatch[1]
							// 排除时间词误判 (如 "三天", "2天", "下周", "几天")
							const isDuration =
								/^([0-9\d]+|[零一二三四五六七八九十两几]+)[天周月年小时]/.test(
									potentialCity,
								)
							const isTime = /(?:下周|周末|明天|后天)/.test(potentialCity)

							if (!isDuration && !isTime) {
								city = potentialCity
							}
						}
					}

					// 2. 提取出发地 ("从北京出发", "北京走")
					if (!origin) {
						const originMatch = msg.content.match(
							/(?:从|自|离)([^\s，,。、]{2,5}?)(?:出发|走|飞)?/,
						)
						if (originMatch) origin = originMatch[1]
					}

					// 3. 提取预算 ("预算2000", "2000元")
					if (!budget) {
						const budgetMatch = msg.content.match(/(\d+(?:万|k|K)?)元?/)
						if (
							budgetMatch &&
							(msg.content.includes('预算') || msg.content.includes('花'))
						) {
							budget = budgetMatch[1] // 简单提取，仅供日志参考
						}
					}

					if (city && origin) break
				}
			}

			this.logger.log('📝 [Intent Analysis]')
			this.logger.log(
				'   - 🗣️ 用户输入: "' + (lastUserMessage || 'Unknown') + '"',
			)
			this.logger.log('   - 🏁 目的地 (Dest): ' + (city || '❓ 未知'))
			this.logger.log('   - 🚀 出发地 (Origin): ' + (origin || '❓ 未知'))
			this.logger.log('   - 💰 预算参考: ' + (budget || '❓ 未知'))

			if (city) {
				this.logger.log(
					'检测到目的地: ' + city + '，维持环境数据注入 (Weather/POI)...',
				)
				const [weather, pois] = await Promise.all([
					this.weatherService.getWeather(city),
					this.gaodeService.getRecommendedPOIs(city),
				])

				if (weather) {
					this.logger.log('⛅ 天气数据: ' + weather)
					weatherInfo =
						'\n**当前目的地(' +
						city +
						')天气参考**：\n' +
						weather +
						'\n请**务必**将上述天气信息与具体日期对应（今日即为 Day 1），在行程表中注明每日的具体天气状况。**请注意：必须将天气可以翻译为中文（例如：Clear -> 晴天, Cloudy -> 多云）。**'
				}

				if (pois) {
					poiInfo = pois
				}
			}

			// 4. 搜索增强 (优先 Tavily, 降级 DuckDuckGo)
			let searchInfo = ''
			if (city) {
				const performDuckDuckGo = async () => {
					try {
						this.logger.log(
							'🔍 使用 DuckDuckGo 搜索 "' + city + ' 旅游攻略" (Fallback)...',
						)
						const searchTool = new DuckDuckGoSearch()
						const searchResults = await searchTool.invoke(
							city + ' 旅游攻略 必去景点 美食推荐',
						)
						if (searchResults) {
							searchInfo =
								'\n## 🌐 网络搜索实时资讯 (DuckDuckGo)\n' + searchResults + '\n'
							this.logger.log('✅ DuckDuckGo 搜索成功')
						}
					} catch (ddgErr) {
						if (
							ddgErr.message?.includes('too quickly') ||
							ddgErr.message?.includes('429')
						) {
							this.logger.warn('⚠️ DuckDuckGo 限流，跳过搜索 (不影响主流程)')
						} else {
							this.logger.warn('⚠️ DuckDuckGo 搜索失败: ' + ddgErr.message)
						}
					}
				}

				try {
					const tavilyKey = this.configService.get<string>('TAVILY_API_KEY')

					if (tavilyKey) {
						// 方案 A: 使用 Tavily (更稳定，专门为 AI 优化)
						try {
							this.logger.log(
								'🔍 使用 Tavily 搜索 "' +
									city +
									' 旅游攻略" (API Key present)...',
							)
							// 动态引入本地自定义工具
							const { TavilyTool } = await import('./tavily.tool')
							const searchTool = new TavilyTool(tavilyKey)

							const searchResults = await searchTool.invoke(
								city + ' 旅游攻略 必去景点 美食推荐',
							)
							if (searchResults) {
								searchInfo =
									'\n## 🌐 网络搜索实时资讯 (Tavily)\n' + searchResults + '\n'
								this.logger.log('✅ Tavily 搜索成功')
							}
						} catch (tavilyErr) {
							this.logger.warn(
								'⚠️ Tavily 搜索失败 (自动降级): ' + tavilyErr.message,
							)
							// 降级尝试 DuckDuckGo
							await performDuckDuckGo()
						}
					} else {
						// 方案 B: 直接运行 DuckDuckGo
						await performDuckDuckGo()
					}
				} catch (err) {
					// 外层捕获，兜底
					this.logger.error('搜索流程异常', err)
				}
			}

			// 2. 注入各类信息到 System Prompt
			const now = new Date()
			const timeString = now.toLocaleString('zh-CN', {
				timeZone: timezone,
				hour12: false,
			})
			// weekday need careful handling for manual array calc, but toLocaleString helps
			// but here we used an array based on now.getDay().
			// now.getDay() is based on local system time (server time), NOT the timezone passed.
			// To get correct weekday for the timezone, use Intl or simple hack.
			const weekday = now.toLocaleDateString('zh-CN', {
				timeZone: timezone,
				weekday: 'short',
			})
			const dateContext =
				'\n## 📅 当前时间参考 (用户时区: ' +
				timezone +
				')\n现在是：' +
				timeString +
				' ' +
				weekday +
				'\n**IMPORTANT**: 当用户提到"明天"、"后天"、"接下来三天"等相对时间时，你**必须**基于上述当前时间计算出具体的日期(YYYY-MM-DD)，并在行程表中明确展示。'

			this.logger.log(
				'[Date Context] 注入时间上下文: ' + timeString + ' ' + weekday,
			)

			let finalSystemPrompt = this.systemPrompt
				.replace(
					'{weather_info}',
					(weatherInfo || '（暂无具体天气信息，请按一般季节性气候规划）') +
						dateContext,
				)
				.replace('{search_info}', searchInfo) // 注入搜索结果

			// 动态调整“出发地”要求
			if (user && user.preferences && user.preferences.homeCity) {
				const homeCity = user.preferences.homeCity.trim()
				this.logger.log('[Prompt Injection] 检测到用户常居城市: ' + homeCity)

				// 尝试替换原有指令 (更宽松的正则)
				const departureInstructionRegex = /1\.\s*\*\*出发地\*\*.*$/m

				if (departureInstructionRegex.test(finalSystemPrompt)) {
					finalSystemPrompt = finalSystemPrompt.replace(
						departureInstructionRegex,
						'1. **出发地**：已确认是 **' +
							homeCity +
							'** (基于常居地)。**无需询问**，直接规划。',
					)
					this.logger.log('[Prompt Injection] 成功替换出发地指令')
				} else {
					this.logger.warn('[Prompt Injection] 正则不匹配，采用追加覆盖策略')
					// 如果正则失败，直接在 "必填信息收集" 后面追加说明
					finalSystemPrompt = finalSystemPrompt.replace(
						'## 🎯 必填信息收集',
						'## 🎯 必填信息收集\n> **系统注**：用户常居 **' +
							homeCity +
							'**，默认将其作为出发地，**不要再问**用户从哪出发。',
					)
				}
			} else {
				this.logger.debug('[Prompt Injection] 无常居城市信息')
			}

			// 注入用户偏好 (User Context)
			// 注意：这里已经包含了 "常居城市: xxx" 的信息，但上面的 System Prompt 修改是为了明确 "不要问" 的指令
			if (userContextPrompt) {
				finalSystemPrompt += userContextPrompt
			}

			if (poiInfo) {
				finalSystemPrompt = finalSystemPrompt.replace('{poi_info}', poiInfo)
			} else {
				finalSystemPrompt = finalSystemPrompt.replace(
					'{poi_info}',
					'⚠️ **警告：未能获取到该城市的真实POI数据。请优先参考上方的【网络搜索实时资讯】和你的知识库。**',
				)
			}

			// 3. 转换消息格式
			const langChainMessages = [
				new SystemMessage(finalSystemPrompt),
				...messages.map((msg) => {
					if (msg.role === 'user') {
						return new HumanMessage(msg.content)
					} else if (msg.role === 'assistant') {
						return new AIMessage(msg.content)
					} else {
						return new SystemMessage(msg.content)
					}
				}),
			]

			this.logger.debug('开始流式调用 LangChain ChatModel...')

			// 4. 工具绑定与流式调用 (Tool Calling Loop)
			// 引入计算器工具
			const { Calculator } =
				await import('@langchain/community/tools/calculator')
			// 动态引入 TimeTool
			const { TimeTool } = await import('./tools/time.tool')

			// 1. 火车票工具
			const trainTool = new DynamicStructuredTool({
				name: 'search_train_tickets',
				description:
					'查询中国国内火车/高铁车票、时刻表和余票。输入：出发地、目的地、日期（YYYY-MM-DD）。如查询不到，请尝试更换日期或检查城市名称。',
				schema: z.object({
					from: z.string().describe('出发城市或车站名，如：北京、上海虹桥'),
					to: z.string().describe('到达城市或车站名，如：济南、广州南'),
					date: z.string().describe('出发日期，格式：YYYY-MM-DD'),
				}),
				func: async ({ from, to, date }) => {
					return await this.trainService.searchTickets(from, to, date)
				},
			})

			// 2. 搜索工具
			const searchTool = new DuckDuckGoSearch({
				maxResults: 3,
				searchOptions: {
					locale: 'zh-CN',
				},
			})

			// Pass dynamic timezone to TimeTool
			// 3. 汇总所有工具
			const tools = [
				new Calculator(),
				new TimeTool(timezone),
				trainTool,
				searchTool,
			]

			const modelWithTools = this.chatModel.bindTools(tools)
			const logger = this.logger

			// 递归执行流处理函数
			const executeLoop = async function* (
				inputMessages: any[],
				depth = 0,
			): AsyncGenerator<string> {
				logger.debug('[StreamLoop] Depth ' + depth + ': Starting stream...')
				const stream = await modelWithTools.stream(inputMessages)
				let accumulatedMessage: any = null
				let contentCount = 0

				for await (const chunk of stream) {
					// 1. 实时返回文本内容
					if (chunk.content) {
						contentCount += chunk.content.length
						yield chunk.content as string
					}

					// 2. 累积 Chunk 以便后续提取完整的 tool_calls
					if (!accumulatedMessage) {
						accumulatedMessage = chunk
					} else {
						// LangChain 的 concat 会自动合并 content 和 tool_call_chunks
						accumulatedMessage = accumulatedMessage.concat(chunk)
					}
				}

				logger.debug(
					'[StreamLoop] Depth ' +
						depth +
						': Stream finished. Content chars: ' +
						contentCount,
				)

				// [DEBUG] Log the full content to see what AI generated
				if (accumulatedMessage?.content) {
					logger.log('[AI Response Content]:\n' + accumulatedMessage.content)
				}

				// 3. 如果有工具调用，执行并递归
				if (accumulatedMessage?.tool_calls?.length > 0) {
					const toolCalls = accumulatedMessage.tool_calls
					const toolNames = toolCalls.map((t: any) => t.name).join(', ')
					logger.log(
						'[ToolCall] Depth ' +
							depth +
							': Detected ' +
							toolCalls.length +
							' tools: ' +
							toolNames,
					)

					// 将完整的 AI 回复 (Accumulated) 加入历史，确保上下文连贯
					const newMessages = [...inputMessages, accumulatedMessage]

					// 并行执行工具
					const toolResults = await Promise.all(
						toolCalls.map(async (toolCall: any) => {
							const tool = tools.find((t) => t.name === toolCall.name)
							if (tool) {
								try {
									logger.debug('[ToolExec] Executing ' + tool.name + '...')
									const result = await (tool as any).invoke(toolCall.args)
									const resultStr = JSON.stringify(result)
									logger.debug(
										'[ToolExec] ' +
											tool.name +
											' result: ' +
											resultStr.slice(0, 50) +
											'...',
									)
									return new ToolMessage({
										tool_call_id: toolCall.id!,
										content: resultStr,
									})
								} catch (err) {
									const errorMsg =
										err instanceof Error ? err.message : String(err)
									console.error(`Tool ${tool.name} failed:`, errorMsg)
									// 返回具体的错误信息给 LLM，以便它知道发生了什么（例如限流）
									return new ToolMessage({
										tool_call_id: toolCall.id!,
										content: `Tool execution error: ${errorMsg}. Please try again later or proceed without this information.`,
									})
								}
							}
							return null
						}),
					)

					// 过滤掉无效结果并添加到消息历史
					for (const res of toolResults) {
						if (res) newMessages.push(res)
					}

					// 递归调用
					logger.debug(
						'[StreamLoop] Depth ' +
							depth +
							': Recursing to Depth ' +
							(depth + 1) +
							'...',
					)
					yield* executeLoop(newMessages, depth + 1)
				} else {
					if (accumulatedMessage?.tool_calls) {
						logger.debug(
							'[StreamLoop] Depth ' +
								depth +
								': No valid tool calls found in accumulated message.',
						)
					}
				}
			}

			yield* executeLoop(langChainMessages)
		} catch (error) {
			this.logger.error('LangChain 流式调用失败', error)
			throw error
		} finally {
			this.logger.debug('LangChain chatStream completed or terminated.')
		}
	}

	/**
	 * 使用 LangChain 调用通义千问 API (非流式)
	 */
	async chat(
		messages: LangChainMessage[],
		user?: any,
		timezone: string = 'Asia/Shanghai',
	): Promise<string> {
		// 复用流式逻辑，但收集所有 chunks 后返回完整内容
		let fullResponse = ''
		for await (const chunk of this.chatStream(messages, user, timezone)) {
			fullResponse += chunk
		}
		return fullResponse
	}
}
// Syntax fixed verified
