import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
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
1. **出发地**（非常重要！否则无法规划往返交通）
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
- **禁止推荐非行程相关城市的地点**（例如行程只有北京，不要推荐上海的地点）。
- **预算合理性检查**：核对预算与真实价格。

## 🗣️ 语气与风格
请保持 **热情、专业且令人向往** 的语气。

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

| 序号 | 时间 | 类型 | 名称 | 完整地址 | 停留时长 | 门票/人均 | 说明 | 好玩的 | 好吃的 | 交通(去下一站) |
|------|------|------|------|----------|----------|-----------|------|--------|--------|----------------|
| 1 | 09:00 | 景点 | 景点名称 | 城市+区+具体地址 | 120分钟 | ¥50 | 推荐理由及说明 | 亮点 | 周边美食 | 步行15分钟 |
| 2 | 12:00 | 餐厅 | 餐厅名称 | 城市+区+具体地址 | 90分钟 | ¥100 | 推荐理由及说明 | 招牌菜 | / | 出租车10分钟 |

**表格填写要求**：
- **头部信息**：必须填写**城市**、**天气**和**今日预计花销**。
- **仅包含目的地行程**：表格内**只记录在目的地城市内部**的游玩/餐饮/住宿。
- **城际交通**：可以是表格的一行（类型为“交通”），或者写在说明里。建议将**跨城移动**作为单独的一行，名称写“前往XX城市”，类型写“交通”。
- **地址必须完整**：**必须包含"城市+区+街道+门牌号"**（关键！这对多城市地图定位至关重要）。
- **真实性验证**：所有地点必须真实存在。

### 4. 💰 预算明细
- 列出交通（往返+城际+市内）、住宿、餐饮、门票的预估总价。

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
	 * 使用 LangChain 调用通义千问 API
	 */
	/**
	 * 使用 LangChain 调用通义千问 API (流式响应)
	 */
	async *chatStream(messages: LangChainMessage[]): AsyncGenerator<string> {
		try {
			// 1. 简单的意图识别：提取目的地以获取天气和POI
			const lastUserMessage = messages
				.slice()
				.reverse()
				.find((m) => m.role === 'user')?.content

			let weatherInfo = ''
			let poiInfo = ''
			let city: string | null = null

			if (lastUserMessage) {
				// 优先提取目的地城市（匹配"去XX"、"到XX"、"玩XX"等模式）
				// 排除"从XX出发"的起点城市
				const destinationMatch = lastUserMessage.match(
					/(?:去|到|玩|游览|前往)([^\s，,。、]{2,5}?)(?:玩|旅游|旅行|游|自由行)?/,
				)

				// 如果没有明确的目的地，尝试匹配任意中文城市名
				city = destinationMatch ? destinationMatch[1] : null

				this.logger.log(`用户消息: "${lastUserMessage}"`)
				this.logger.log(`提取的目的地城市: ${city || '未检测到'}`)

				if (city) {
					this.logger.log(
						`检测到目的地: ${city}，正在并发获取天气和高德POI数据...`,
					)
					const [weather, pois] = await Promise.all([
						this.weatherService.getWeather(city),
						this.gaodeService.getRecommendedPOIs(city),
					])

					if (weather) {
						weatherInfo = `\n**当前目的地(${city})天气参考**：\n${weather}\n请根据天气情况调整行程安排。`
						this.logger.log(`✅ 天气数据获取成功`)
					}

					if (pois) {
						poiInfo = pois
						this.logger.log(`✅ POI数据获取成功，长度: ${pois.length} 字符`)
					}
				}
			}

			// 4. DuckDuckGo 搜索增强
			let searchInfo = ''
			if (city) {
				try {
					this.logger.log(`🔍 正在使用 DuckDuckGo 搜索 "${city} 旅游攻略"...`)
					const searchTool = new DuckDuckGoSearch()
					// 搜索最新的旅游信息
					const searchResults = await searchTool.invoke(
						`${city} 旅游攻略 必去景点 美食推荐`,
					)
					if (searchResults) {
						searchInfo = `\n## 🌐 网络搜索实时资讯 (DuckDuckGo)\n${searchResults}\n`
						this.logger.log(`✅ 搜索成功 (长度: ${searchResults.length})`)
					}
				} catch (err) {
					this.logger.warn(`⚠️ 搜索失败: ${err.message}`)
				}
			}

			// 2. 注入各类信息到 System Prompt
			let finalSystemPrompt = this.systemPrompt
				.replace(
					'{weather_info}',
					weatherInfo || '（暂无具体天气信息，请按一般季节性气候规划）',
				)
				.replace('{search_info}', searchInfo) // 注入搜索结果

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

			// 4. 调用 LangChain Stream
			const stream = await this.chatModel.stream(langChainMessages)

			for await (const chunk of stream) {
				if (chunk.content) {
					yield chunk.content as string
				}
			}
		} catch (error) {
			this.logger.error('LangChain 流式调用失败', error)
			throw error
		}
	}

	/**
	 * 使用 LangChain 调用通义千问 API (非流式)
	 */
	async chat(messages: LangChainMessage[]): Promise<string> {
		// 复用流式逻辑，但收集所有 chunks 后返回完整内容
		let fullResponse = ''
		for await (const chunk of this.chatStream(messages)) {
			fullResponse += chunk
		}
		return fullResponse
	}
}
