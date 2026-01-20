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
			// 优先尝试获取详细 JSON 格式
			const url = `${this.baseUrl}/${encodeURIComponent(city)}?format=j1&lang=zh`
			this.logger.log(`Fetching weather for ${city} from ${url}`)

			const response = await axios.get(url, { timeout: 8000 }) // Increase timeout
			const data = response.data

			if (!data || !data.weather) {
				return ''
			}

			// 解析未来3天天气
			const forecast = data.weather
				.slice(0, 3)
				.map((day: any) => {
					const date = day.date
					const tempMax = day.maxtempC
					const tempMin = day.mintempC
					const condition = day.hourly[4]?.weatherDesc[0]?.value || '未知'
					return `${date}: ${condition}, ${tempMin}°C ~ ${tempMax}°C`
				})
				.join('; ')

			return `${city}天气预报: ${forecast}`
		} catch (error) {
			this.logger.warn(`Failed to fetch weather for ${city}: ${error.message}`)
			// 尝试降级：获取简单文本格式
			try {
				const simpleUrl = `${this.baseUrl}/${encodeURIComponent(city)}?format=3`
				const simpleRes = await axios.get(simpleUrl, { timeout: 3000 })
				return simpleRes.data ? `${city}当前天气: ${simpleRes.data}` : ''
			} catch (fallbackError) {
				return '' // 彻底失败则返回空，由 LLM 处理空缺
			}
		}
	}
}
