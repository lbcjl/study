import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
	ToolMessage,
} from '@langchain/core/messages'
import { WeatherService } from './weather.service'
import { GaodeService } from './gaode.service'

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
1. **出发地**（⚠️ 注意：如果下方的【用户个性化偏好】中包含“常居城市”，请默认将该城市作为“出发地”，**无需再次询问**，除非用户明确指定了其他出发地）
2. **目的地**（国家/城市，支持多个城市，如“上海和苏州”）
3. **出行时间**（起止日期或天数）
4. **旅行预算**（人民币总额）

## ⛅ 实时天气参考
{weather_info}

{search_info}

## 📍 真实地点参考数据 (来自高德地图) - ⚠️ 重要约束
{poi_info}

## 🚨 强制要求：
- **所有推荐地点（景点、餐厅、酒店）必须优先且仅从上方【真实数据参考】中选择**
- **严禁编造**不存在的地点。
- **天气数据**：必须严格使用提供的【实时天气参考】。
- **跨城市规划**：如果用户请求跨城市旅行（如北京到上海），请按时间顺序合理安排行程。
- **路线合理性 (关键)**：相邻地点之间的交通时间**不应超过 1 小时**。请合理安排游玩顺序，避免东奔西跑和来回绕路。
- **禁止推荐非行程相关城市的地点**（例如行程只有北京，不要推荐上海的地点）。
- **预算合理性检查**：核对预算与真实价格。

## 🗣️ 语气与风格
请保持 **热情、专业且令人向往** 的语气。

## 🚫 话题限制 (关键)
你是一位**专职**的旅行规划师，**仅**回答与旅行相关的问题（包括：行程规划、景点介绍、交通住宿、各地美食、预算计算、签证政策等）。
- **如果用户咨询无关话题**（如：写代码、数学题、政治新闻、娱乐八卦、心理咨询等），**必须**礼貌拒绝。
- **拒绝话术示例**：“我是您的专属旅行规划助手，专注于为您打造完美旅程。这个问题超出了我的专业范围，我们还是以此为契机，聊聊您想去哪儿玩吧？🌍”

## 📝 方案生成要求
当你收集到上述信息后，请生成一份**真实、详细**的旅行方案。

### 1. 🚄 往返及城际大交通（必须真实）
- **去程/返程**：推荐具体的 1-2 个真实班次（高铁车次或航班号）。
- **城际交通**：如果是多城市旅行，请单独列出城市间的交通安排（如“上海 -> 苏州：高铁 G123”）。
- **真实性要求**：必须使用现实存在的车次/航班。

### 2. 🏨 住宿指南（必须基于真实数据）
- **推荐区域**：给出推荐居住的区域及理由。如果是多城市，请分别列出每个城市的住宿建议。
- **精选酒店**：挑选 **3家** 左右不同价位或风格的酒店。
- **酒店信息**：包含酒店名称、参考价格、推荐理由。

### 3. 📅 每日详细行程（必须用表格）
**必须使用以下表格格式**，每一天一个表格：

#### 第X天行程表
> **城市**：请注明当日所在的城市（如：上海）
> **天气**：请根据当日实际天气填写
> **今日预计花销**：请计算当日列表中的总花费

| 序号 | 时间 | 类型 | 名称 | 完整地址 | 停留时长 | 门票/人均 | 说明(景点介绍) | 好玩的 | 好吃的 | 交通(去下一站) |
|------|------|------|------|----------|----------|-----------|----------------|--------|--------|----------------|
| 1 | 09:00 | 景点 | 景点名称 | 城市+区+具体地址 | 120分钟 | ¥50 | **必须写一段生动的简介**（约50字），介绍它的历史、特色或必看之处，不要只写“推荐去”。 | 亮点 | 周边美食 | 步行15分钟 |
| 2 | 12:00 | 餐厅 | 餐厅名称 | 城市+区+具体地址 | 90分钟 | ¥100 | 介绍该餐厅的特色风格或主打菜系。 | 招牌菜 | / | 出租车10分钟 |

**表格填写要求**：
- **说明(景点介绍)**：**这是最关键的内容！** 
  - ❌ **严重错误**：“景色优美，值得一去。”（太短，太假）
  - ✅ **正确示范**：“始建于1420年的皇家祭天场所，拥有世界最大的古代祭天建筑群。核心建筑祈年殿通体使用蓝色琉璃瓦，象征天空。建议在回音壁尝试奇妙的声学现象，并在丹陛桥上拍摄祈年殿全景。”
  - **要求**：必须写满 **60-100字**，包含历史背景、建筑特色、最佳拍照点或独特体验。让用户看一眼就被种草。
- **头部信息**：必须填写**城市**、**天气**和**今日预计花销**。
- **仅包含目的地行程**：表格内**只记录在目的地城市内部**的游玩/餐饮/住宿。
- **城际交通**：可以是表格的一行（类型为“交通”），或者写在说明里。建议将**跨城移动**作为单独的一行，名称写“前往XX城市”，类型写“交通”。
- **地址必须完整**：**必须包含"城市+区+街道+门牌号"**（关键！这对多城市地图定位至关重要）。
- **真实性验证**：所有地点必须真实存在。

### 4. 💰 预算明细
- **必须使用计算器工具**：请调用 \`calculator\` 工具将表格中的每一笔费用相加，确保总额绝对准确。
- 列出交通（往返+城际+市内）、住宿、餐饮、门票的预估总价。
- **禁止口算**：必须依赖工具计算结果。

## 🏷️ 格式强制要求 (非常重要)
在回复的第一行，**必须**插入一条包含主要目的地城市的隐藏注释，格式如下：
\`<!-- DESTINATION_CITY: 城市名称 -->\`
（填写整个行程的主要目的地，如果是多城市，填写第一个或最主要的城市即可）

`

	constructor(
		private configService: ConfigService,
		private weatherService: WeatherService,
		private gaodeService: GaodeService,
	) {
		const apiKey = this.configService.get<string>('QWEN_API_KEY')

		if (!apiKey) {
			throw new Error(
				'未配置 QWEN_API_KEY，请在 .env 文件中设置阿里云通义千问 API Key',
			)
		}

		// 使用 LangChain 的 ChatOpenAI，配置为通义千问端点
		this.chatModel = new ChatOpenAI({
			apiKey,
			model: this.configService.get<string>('QWEN_MODEL') || 'qwen-turbo',
			temperature: 0.7,
			maxTokens: 3000, // 增加 Token 上限以容纳更详细的方案
			configuration: {
				baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
			},
		})

		this.logger.log(`🧠 LangChain 服务已初始化，使用通义千问模型`)
	}

	/**
	 * 使用 LangChain 调用通义千问 API (流式响应)
	 */
	async *chatStream(
		messages: LangChainMessage[],
		user?: any,
	): AsyncGenerator<string> {
		try {
			// 0. 构建用户偏好上下文
			let userContextPrompt = ''
			if (user && user.preferences) {
				const p = user.preferences
				const parts: string[] = []
				if (p.nickname) parts.push(`用户昵称: ${p.nickname}`)
				if (p.homeCity) parts.push(`常居城市: ${p.homeCity}`)
				if (p.budgetRange && p.budgetRange !== '不限')
					parts.push(`预算偏好: ${p.budgetRange}`)
				if (p.travelStyle) parts.push(`旅行风格: ${p.travelStyle}`)
				if (p.dietary && p.dietary.length > 0)
					parts.push(`饮食偏好: ${p.dietary.join(', ')}`)
				if (p.interests && p.interests.length > 0)
					parts.push(`兴趣标签: ${p.interests.join(', ')}`)

				if (parts.length > 0) {
					userContextPrompt = `\n## 👤 用户个性化偏好 (请严格遵守)\n${parts.join('\n')}\n请在生成方案时特别关照上述偏好。例如：如果用户不吃辣，请避免推荐川湘菜；如果用户喜欢自然风光，请多安排户外景点。`
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
						if (destMatch) city = destMatch[1]
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

			this.logger.log(`📝 [Intent Analysis]`)
			this.logger.log(`   - 🗣️ 用户输入: "\${lastUserMessage || 'Unknown'}"`)
			this.logger.log(`   - 🏁 目的地 (Dest): \${city || '❓ 未知'}`)
			this.logger.log(`   - 🚀 出发地 (Origin): \${origin || '❓ 未知'}`)
			this.logger.log(`   - 💰 预算参考: \${budget || '❓ 未知'}`)

			if (city) {
				this.logger.log(
					`检测到目的地: \${city}，维持环境数据注入 (Weather/POI)...`,
				)
				const [weather, pois] = await Promise.all([
					this.weatherService.getWeather(city),
					this.gaodeService.getRecommendedPOIs(city),
				])

				if (weather) {
					this.logger.log(`⛅ 天气数据: \${weather}`)
					weatherInfo = `\n**当前目的地(\${city})天气参考**：\n\${weather}\n请根据天气情况调整行程安排。`
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
							`🔍 使用 DuckDuckGo 搜索 "\${city} 旅游攻略" (Fallback)...`,
						)
						const searchTool = new DuckDuckGoSearch()
						const searchResults = await searchTool.invoke(
							`\${city} 旅游攻略 必去景点 美食推荐`,
						)
						if (searchResults) {
							searchInfo = `\n## 🌐 网络搜索实时资讯 (DuckDuckGo)\n\${searchResults}\n`
							this.logger.log(`✅ DuckDuckGo 搜索成功`)
						}
					} catch (ddgErr) {
						if (
							ddgErr.message?.includes('too quickly') ||
							ddgErr.message?.includes('429')
						) {
							this.logger.warn(`⚠️ DuckDuckGo 限流，跳过搜索 (不影响主流程)`)
						} else {
							this.logger.warn(`⚠️ DuckDuckGo 搜索失败: \${ddgErr.message}`)
						}
					}
				}

				try {
					const tavilyKey = this.configService.get<string>('TAVILY_API_KEY')

					if (tavilyKey) {
						// 方案 A: 使用 Tavily (更稳定，专门为 AI 优化)
						try {
							this.logger.log(
								`🔍 使用 Tavily 搜索 "\${city} 旅游攻略" (API Key present)...`,
							)
							// 动态引入本地自定义工具
							const { TavilyTool } = await import('./tavily.tool')
							const searchTool = new TavilyTool(tavilyKey)

							const searchResults = await searchTool.invoke(
								`\${city} 旅游攻略 必去景点 美食推荐`,
							)
							if (searchResults) {
								searchInfo = `\n## 🌐 网络搜索实时资讯 (Tavily)\n\${searchResults}\n`
								this.logger.log(`✅ Tavily 搜索成功`)
							}
						} catch (tavilyErr) {
							this.logger.warn(
								`⚠️ Tavily 搜索失败 (自动降级): \${tavilyErr.message}`,
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
			let finalSystemPrompt = this.systemPrompt
				.replace(
					'{weather_info}',
					weatherInfo || '（暂无具体天气信息，请按一般季节性气候规划）',
				)
				.replace('{search_info}', searchInfo) // 注入搜索结果

			// 注入用户偏好
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

			this.logger.debug(`开始流式调用 LangChain ChatModel...`)

			// 4. 工具绑定与流式调用 (Tool Calling Loop)
			// 引入计算器工具
			const { Calculator } =
				await import('@langchain/community/tools/calculator')
			const tools = [new Calculator()]
			const modelWithTools = this.chatModel.bindTools(tools)

			// 定义处理流的函数
			const processStream = async function* (
				inputMessages: any[],
			): AsyncGenerator<string> {
				const stream = await modelWithTools.stream(inputMessages)
				let finalContent = ''
				let toolCallChunks: any[] = []

				for await (const chunk of stream) {
					// 1. 实时返回文本内容
					if (chunk.content) {
						yield chunk.content as string
						finalContent += chunk.content
					}
					// 2. 收集工具调用片段
					if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
						toolCallChunks = toolCallChunks.concat(chunk.tool_call_chunks)
					}
				}

				// 3. 如果有工具调用，执行并递归
				if (toolCallChunks.length > 0) {
					// 构造完整的 AI Message (包含 tool_calls)
					const aiMsg = await modelWithTools.invoke(inputMessages)

					if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
						// 将 AI 的回复 (包含 tool_calls) 加入历史
						const newMessages = [...inputMessages, aiMsg]

						// 执行工具
						for (const toolCall of aiMsg.tool_calls) {
							const tool = tools.find((t) => t.name === toolCall.name)
							if (tool) {
								try {
									const result = await tool.invoke(toolCall.args)

									newMessages.push(
										new ToolMessage({
											tool_call_id: toolCall.id!,
											content: result,
										}),
									)
								} catch (err) {
									console.error(`Tool execution failed:`, err)
									newMessages.push(
										new ToolMessage({
											tool_call_id: toolCall.id!,
											content: 'Error: Calculation failed.',
										}),
									)
								}
							}
						}

						// 再次调用模型生成基于工具结果的回答 (递归) - 这里使用流式
						const finalStream = await modelWithTools.stream(newMessages)
						for await (const chunk of finalStream) {
							if (chunk.content) yield chunk.content as string
						}
					}
				}
			}

			yield* processStream(langChainMessages)
		} catch (error) {
			this.logger.error('LangChain 流式调用失败', error)
			throw error
		}
	}

	/**
	 * 使用 LangChain 调用通义千问 API (非流式)
	 */
	async chat(messages: LangChainMessage[], user?: any): Promise<string> {
		// 复用流式逻辑，但收集所有 chunks 后返回完整内容
		let fullResponse = ''
		for await (const chunk of this.chatStream(messages, user)) {
			fullResponse += chunk
		}
		return fullResponse
	}
}
