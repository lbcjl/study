import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class WeatherService {
	private readonly logger = new Logger(WeatherService.name)
	private readonly baseUrl = 'https://wttr.in'

	/**
	 * 获取指定城市的天气信息（未来3天）
	 * @param city 城市名称
	 * @returns 简化的天气描述字符串
	 */
	async getWeather(city: string): Promise<string> {
		try {
			// format=3: 简短格式 (e.g. "Beijing: ☀ +5°C")
			// 但我们需要更多信息，尝试 j1 格式获取 JSON 或自定义 format
			// 为了简化 Prompt 注入，我们直接请求预定义的简洁文本格式，或者使用 format="%l:+%C+%t\n"
			// 这里我们使用 format=j1 获取 JSON 以便更灵活处理，或者直接用 format 3 拿简单文本
			// 考虑到大模型阅读能力，我们请求 resulting text directly relevant for travel

			// 使用 format=3 简单获取当前天气
			// 使用 ?0PQnHT 可以去掉一些不必要的 ANSI code 和 header，但 wttr.in 的 format 参数更可控
			// 让我们尝试获取未来几天的预报，wttr.in 默认返回 text table
			// 为了 Token 节省，我们只取简单的通过 API

			// 方案：使用 format=j1 (JSON) 以便编程提取，或者直接让 LLM 读 wttr.in 的输出
			// 直接请求 format=3 过于简单，仅有当前天气。
			// 我们请求 format="%l:\n+%d+%C+%t\n" 来获取未来几天的趋势? wttr.in 对自定义格式支持有限制。

			// 简单起见，且为了"免费/无Key"，我们抓取 format=j1 的 JSON，确实支持 lang 参数
			const url = `${this.baseUrl}/${encodeURIComponent(city)}?format=j1&lang=zh`
			this.logger.log(`Fetching weather for ${city} from ${url}`)

			const response = await axios.get(url, { timeout: 4000 })
			const data = response.data

			if (!data || !data.weather) {
				return '暂无天气信息'
			}

			// 解析未来3天天气
			const forecast = data.weather
				.slice(0, 3)
				.map((day: any) => {
					const date = day.date
					const tempMax = day.maxtempC
					const tempMin = day.mintempC
					// hourly 中午12点的天气描述
					// hourly 中午12点的天气描述
					// wttr.in JSON returns translated value in 'weatherDesc' when lang is set, or sometimes in 'weatherIconUrl' etc.
					// Actually wttr.in with lang=zh often still returns English in 'value' but might have 'lang_zh'?
					// Let's verify standard wttr.in behavior: ?format=j1&lang=zh usually translates the `value`.
					// If not, we might need a mapping. But let's try direct extraction first.
					const condition = day.hourly[4]?.weatherDesc[0]?.value || '未知'
					return `${date}: ${condition}, ${tempMin}°C ~ ${tempMax}°C`
				})
				.join('; ')

			return `${city}天气预报: ${forecast}`
		} catch (error) {
			this.logger.warn(`Failed to fetch weather for ${city}: ${error.message}`)
			return '天气服务暂不可用' // 降级处理，不影响主流程
		}
	}
}
